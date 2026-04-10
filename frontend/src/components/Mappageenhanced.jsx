import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Navigation, MapPin, Trash2 } from 'lucide-react';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Composant pour gérer le routing
const RoutingMachine = ({ userPosition, destination, routeColor = '#8B0000' }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !userPosition || !destination) return;

    // Supprimer l'ancien routing s'il existe
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Créer le routing control
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userPosition[0], userPosition[1]),
        L.latLng(destination[0], destination[1])
      ],
      lineOptions: {
        styles: [{ 
          color: routeColor, 
          opacity: 0.8, 
          weight: 6 
        }]
      },
      createMarker: function() { return null; }, // Ne pas créer de markers supplémentaires
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      routeWhileDragging: false,
      show: false, // Cacher les instructions détaillées
      collapsible: true,
      language: 'fr'
    }).addTo(map);

    // Masquer le panneau d'instructions
    const routingContainer = routingControl.getContainer();
    if (routingContainer) {
      routingContainer.style.display = 'none';
    }

    routingControlRef.current = routingControl;

    // Cleanup
    return () => {
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.log('Route déjà supprimée');
        }
      }
    };
  }, [map, userPosition, destination, routeColor]);

  return null;
};

// Composant pour suivre la position de l'utilisateur
const UserLocationTracker = ({ onLocationUpdate }) => {
  const map = useMap();
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Géolocalisation non supportée');
      return;
    }

    // Suivre la position en temps réel
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationUpdate([latitude, longitude]);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    // Cleanup
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [onLocationUpdate]);

  return null;
};

// Composant principal MapPage
const MapPageEnhanced = ({ bins, selectedBin, setSelectedBin, assignedBins = [] }) => {
  const fianarantsoa = [-21.4531, 47.0856];
  const mapRef = useRef(null);
  const [userPosition, setUserPosition] = useState(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [routeDestination, setRouteDestination] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Créer l'icône personnalisée pour l'utilisateur
  const createUserIcon = () => {
    return L.divIcon({
      html: `<div style="
        width: 32px;
        height: 32px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Créer l'icône des poubelles
  const createBinIcon = (fillLevel, isSelected = false) => {
    let bgColor;
    if (fillLevel >= 95) {
      bgColor = '#ff6b6b';
    } else if (fillLevel >= 80) {
      bgColor = '#ffd93d';
    } else {
      bgColor = '#6bcf7f';
    }

    const size = isSelected ? 40 : 30;
    const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40">
        <path d="M 15 2 C 8 2 3 7 3 14 C 3 24 15 38 15 38 C 15 38 27 24 27 14 C 27 7 22 2 15 2 Z" 
              fill="${bgColor}" 
              stroke="${isSelected ? '#000' : 'white'}" 
              stroke-width="${isSelected ? '3' : '2'}"/>
        <g transform="translate(15, 13)" stroke="white" stroke-width="1.5" fill="none">
          <path d="M -2 -2 L 2 -2 M -2 0 L 2 0 M -1 2 L 1 2 L 0 4 L 0 5 L -2 5 L 2 5"/>
        </g>
      </svg>
    `;

    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(iconSvg)}`,
      iconSize: [size, size * 1.33],
      iconAnchor: [size / 2, size * 1.33],
      popupAnchor: [0, -size * 1.33],
    });
  };

  const getFillColor = (fillLevel) => {
    if (fillLevel >= 95) return '#ff6b6b';
    if (fillLevel >= 80) return '#ffd93d';
    return '#6bcf7f';
  };

  // Gérer le clic sur une poubelle
  const handleBinClick = (bin) => {
    setSelectedBin(bin);
    if (userPosition) {
      setRouteDestination([bin.latitude, bin.longitude]);
    }
  };

  // Activer/désactiver le suivi de position
  const toggleLocationTracking = () => {
    if (!isTrackingLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = [position.coords.latitude, position.coords.longitude];
            setUserPosition(pos);
            setIsTrackingLocation(true);
            
            // Si une poubelle est sélectionnée, tracer la route
            if (selectedBin) {
              setRouteDestination([selectedBin.latitude, selectedBin.longitude]);
            }
          },
          (error) => {
            alert('Erreur de géolocalisation: ' + error.message);
          }
        );
      } else {
        alert('La géolocalisation n\'est pas supportée par votre navigateur');
      }
    } else {
      setIsTrackingLocation(false);
      setUserPosition(null);
      setRouteDestination(null);
    }
  };

  // Afficher les poubelles assignées ou toutes les poubelles
  const displayBins = assignedBins && assignedBins.length > 0 ? assignedBins : bins;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Carte des Poubelles</h2>
        <div className="flex space-x-4 items-center">
          {/* Bouton de géolocalisation */}
          <button
            onClick={toggleLocationTracking}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isTrackingLocation 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Navigation size={18} className={isTrackingLocation ? 'animate-pulse' : ''} />
            <span>{isTrackingLocation ? 'Position activée' : 'Activer ma position'}</span>
          </button>

          {/* Légende */}
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Normal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
              <span className="text-sm font-medium">Attention</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium">Critique</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message d'information */}
      {isTrackingLocation && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex items-center">
            <MapPin className="text-blue-500 mr-2" size={20} />
            <p className="text-sm text-blue-700">
              Votre position est suivie en temps réel. 
              {selectedBin && ' L\'itinéraire vers la poubelle sélectionnée est affiché en rouge.'}
              {!selectedBin && ' Cliquez sur une poubelle pour afficher l\'itinéraire.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div 
          className="lg:col-span-3 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 map-wrapper" 
          style={{ height: '600px', position: 'relative', zIndex: 1 }}
        >
          {displayBins && displayBins.length > 0 ? (
            <MapContainer 
              center={userPosition || fianarantsoa} 
              zoom={13} 
              scrollWheelZoom={true} 
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              ref={mapRef}
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
                setMapReady(true);
                // Forcer la mise à jour de la taille après le montage
                setTimeout(() => {
                  mapInstance.invalidateSize();
                }, 100);
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Suivi de position en temps réel */}
              {isTrackingLocation && (
                <UserLocationTracker onLocationUpdate={setUserPosition} />
              )}

              {/* Marqueur de l'utilisateur */}
              {userPosition && (
                <>
                  <Marker position={userPosition} icon={createUserIcon()}>
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-blue-600">Votre position</h3>
                        <p className="text-xs text-gray-600">Position en temps réel</p>
                      </div>
                    </Popup>
                  </Marker>
                  {/* Cercle de précision */}
                  <Circle
                    center={userPosition}
                    radius={50}
                    pathOptions={{
                      fillColor: '#3b82f6',
                      fillOpacity: 0.1,
                      color: '#3b82f6',
                      weight: 2,
                      opacity: 0.3
                    }}
                  />
                </>
              )}

              {/* Routing entre utilisateur et poubelle */}
              {mapReady && userPosition && routeDestination && (
                <RoutingMachine 
                  userPosition={userPosition} 
                  destination={routeDestination}
                  routeColor="#DC143C"
                />
              )}
              
              {/* Marqueurs des poubelles */}
              {displayBins.map((bin) => (
                <Marker
                  key={bin.bin_id}
                  position={[bin.latitude, bin.longitude]}
                  icon={createBinIcon(bin.fill_level, selectedBin?.bin_id === bin.bin_id)}
                  eventHandlers={{
                    click: () => handleBinClick(bin),
                  }}
                >
                  <Popup>
                    <div className="p-3">
                      <h3 className="font-bold text-lg mb-1">{bin.bin_id}</h3>
                      <p className="text-sm text-gray-700 mb-2">{bin.location}</p>
                      <div className="space-y-1 text-xs">
                        <p><strong>Remplissage:</strong> {bin.fill_level}%</p>
                        <p><strong>Batterie:</strong> {bin.battery}%</p>
                        <p><strong>Signal:</strong> {bin.signal_quality}</p>
                      </div>
                      {userPosition && (
                        <button
                          onClick={() => setRouteDestination([bin.latitude, bin.longitude])}
                          className="mt-2 w-full bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600"
                        >
                          Tracer l'itinéraire
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Trash2 size={48} className="mx-auto mb-2 text-gray-400" />
                <p>Chargement de la carte...</p>
              </div>
            </div>
          )}
        </div>

        <div 
          className="bg-white rounded-xl shadow-lg p-6 overflow-y-auto border border-gray-200" 
          style={{ height: '600px', position: 'relative', zIndex: 2 }}
        >
          <h3 className="text-lg font-bold mb-4">Détails</h3>
          {selectedBin ? (
            <div className="space-y-4">
              <div className="pb-4 border-b">
                <h4 className="font-bold text-lg">{selectedBin.bin_id}</h4>
                <p className="text-sm text-gray-700">{selectedBin.location}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Remplissage:</span>
                  <span className="font-bold">{Math.round(selectedBin.fill_level)}%</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${selectedBin.fill_level}%`,
                      backgroundColor: getFillColor(selectedBin.fill_level)
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4">
                <div className="bg-blue-50 p-2 rounded">
                  <span className="text-xs font-semibold">Batterie</span>
                  <p className="font-bold">{Math.round(selectedBin.battery)}%</p>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <span className="text-xs font-semibold">Signal</span>
                  <p className="font-bold text-sm">{selectedBin.signal_quality}</p>
                </div>
              </div>

              {/* Actions */}
              {userPosition && (
                <div className="pt-4 border-t">
                  <button
                    onClick={() => setRouteDestination([selectedBin.latitude, selectedBin.longitude])}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <Navigation size={18} />
                    <span>Afficher l'itinéraire</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <Trash2 size={48} className="mx-auto mb-2" />
              <p>Cliquez sur une poubelle pour voir les détails</p>
              {!isTrackingLocation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Activez votre position pour voir les itinéraires vers les poubelles
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPageEnhanced;