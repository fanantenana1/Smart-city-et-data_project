import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Navigation, MapPin, Trash2, Route, X } from 'lucide-react';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Couleurs pour différentes routes
const ROUTE_COLORS = [
  '#DC143C', // Crimson
  '#FF6347', // Tomato
  '#FF4500', // OrangeRed
  '#8B0000', // DarkRed
  '#B22222', // FireBrick
  '#CD5C5C', // IndianRed
];

// Composant pour afficher une seule route
const SingleRoute = ({ userPosition, destination, color, waypoints }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !userPosition || !destination) return;

    // Supprimer l'ancien routing
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        console.log('Route déjà supprimée');
      }
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
          color: color, 
          opacity: 0.7, 
          weight: 5 
        }]
      },
      createMarker: function() { return null; },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      showAlternatives: false,
      routeWhileDragging: false,
      show: false,
      collapsible: true,
    }).addTo(map);

    // Masquer le panneau d'instructions
    const container = routingControl.getContainer();
    if (container) {
      container.style.display = 'none';
    }

    routingControlRef.current = routingControl;

    return () => {
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.log('Cleanup route');
        }
      }
    };
  }, [map, userPosition, destination, color]);

  return null;
};

// Composant pour afficher toutes les routes en même temps
const MultipleRoutesDisplay = ({ userPosition, bins, showAllRoutes }) => {
  if (!showAllRoutes || !userPosition || !bins || bins.length === 0) {
    return null;
  }

  return (
    <>
      {bins.map((bin, index) => (
        <SingleRoute
          key={bin.bin_id}
          userPosition={userPosition}
          destination={[bin.latitude, bin.longitude]}
          color={ROUTE_COLORS[index % ROUTE_COLORS.length]}
          waypoints={[]}
        />
      ))}
    </>
  );
};

// Composant pour le suivi de position
const UserLocationTracker = ({ onLocationUpdate, isActive }) => {
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!isActive || !navigator.geolocation) return;

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

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isActive, onLocationUpdate]);

  return null;
};

// Composant principal
const MapPageAutoRouting = ({ bins, selectedBin, setSelectedBin, assignedBins = [] }) => {
  const fianarantsoa = [-21.4531, 47.0856];
  const mapRef = useRef(null);
  const [userPosition, setUserPosition] = useState(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Créer l'icône utilisateur
  const createUserIcon = () => {
    return L.divIcon({
      html: `<div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" fill="white"/>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
        </svg>
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      </style>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  // Créer l'icône des poubelles
  const createBinIcon = (fillLevel, isSelected = false) => {
    let bgColor;
    if (fillLevel >= 95) bgColor = '#ef4444';
    else if (fillLevel >= 80) bgColor = '#f59e0b';
    else bgColor = '#10b981';

    const size = isSelected ? 45 : 35;
    const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        <path d="M 15 2 C 8 2 3 7 3 14 C 3 24 15 38 15 38 C 15 38 27 24 27 14 C 27 7 22 2 15 2 Z" 
              fill="${bgColor}" 
              stroke="${isSelected ? '#000' : 'white'}" 
              stroke-width="${isSelected ? '3' : '2.5'}"
              filter="url(#shadow)"/>
        <g transform="translate(15, 13)" stroke="white" stroke-width="2" fill="none">
          <rect x="-3" y="-3" width="6" height="8" rx="1"/>
          <line x1="-2" y1="6" x2="2" y2="6"/>
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
    if (fillLevel >= 95) return '#ef4444';
    if (fillLevel >= 80) return '#f59e0b';
    return '#10b981';
  };

  // Activer la géolocalisation et afficher toutes les routes automatiquement
  const activateLocationAndRoutes = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = [position.coords.latitude, position.coords.longitude];
        setUserPosition(pos);
        setIsTrackingLocation(true);
        setShowAllRoutes(true); // Activer toutes les routes automatiquement
        
        // Centrer la carte sur la position de l'utilisateur
        if (mapRef.current) {
          mapRef.current.setView(pos, 13);
        }
      },
      (error) => {
        alert('Erreur de géolocalisation: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Désactiver la géolocalisation et les routes
  const deactivateLocationAndRoutes = () => {
    setIsTrackingLocation(false);
    setShowAllRoutes(false);
    setUserPosition(null);
    setSelectedRoute(null);
  };

  // Afficher les poubelles assignées ou toutes
  const displayBins = assignedBins && assignedBins.length > 0 ? assignedBins : bins;

  // Activer automatiquement la géolocalisation au chargement
  useEffect(() => {
    // Auto-activer après 1 seconde
    const timer = setTimeout(() => {
      if (!isTrackingLocation) {
        activateLocationAndRoutes();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Exécuter une seule fois au montage

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Carte des Poubelles</h2>
          <p className="text-sm text-gray-600 mt-1">
            {displayBins.length} poubelle{displayBins.length > 1 ? 's' : ''} 
            {isTrackingLocation && showAllRoutes && ' - Routes affichées'}
          </p>
        </div>

        <div className="flex space-x-3 items-center">
          {/* Bouton de géolocalisation */}
          <button
            onClick={isTrackingLocation ? deactivateLocationAndRoutes : activateLocationAndRoutes}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md ${
              isTrackingLocation 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
            }`}
          >
            <Navigation size={18} className={isTrackingLocation ? 'animate-pulse' : ''} />
            <span>{isTrackingLocation ? 'Position active' : 'Activer GPS'}</span>
          </button>

          {/* Bouton pour afficher/masquer toutes les routes */}
          {isTrackingLocation && (
            <button
              onClick={() => setShowAllRoutes(!showAllRoutes)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md ${
                showAllRoutes 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <Route size={18} />
              <span>{showAllRoutes ? 'Masquer routes' : 'Afficher routes'}</span>
            </button>
          )}

          {/* Légende */}
          <div className="flex space-x-4 bg-white px-4 py-2 rounded-lg shadow-md border-2 border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium">Normal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs font-medium">Attention</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs font-medium">Critique</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message d'information */}
      {isTrackingLocation && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <MapPin className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {showAllRoutes 
                    ? `${displayBins.length} itinéraire${displayBins.length > 1 ? 's' : ''} affiché${displayBins.length > 1 ? 's' : ''} vers vos poubelles`
                    : 'Position GPS activée - Cliquez sur "Afficher routes" pour voir les itinéraires'}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Votre position est suivie en temps réel
                  {showAllRoutes && ' - Chaque poubelle a une couleur de route différente'}
                </p>
              </div>
            </div>
            {showAllRoutes && (
              <button
                onClick={() => setShowAllRoutes(false)}
                className="text-blue-600 hover:text-blue-800 p-1"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Carte */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div 
          className="lg:col-span-3 bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200" 
          style={{ height: '650px', position: 'relative', zIndex: 1 }}
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
                setTimeout(() => {
                  mapInstance.invalidateSize();
                }, 150);
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Suivi de position */}
              {isTrackingLocation && (
                <UserLocationTracker 
                  onLocationUpdate={setUserPosition} 
                  isActive={isTrackingLocation}
                />
              )}

              {/* Marqueur utilisateur */}
              {userPosition && (
                <>
                  <Marker position={userPosition} icon={createUserIcon()}>
                    <Popup>
                      <div className="p-3">
                        <h3 className="font-bold text-purple-600 text-lg">📍 Votre position</h3>
                        <p className="text-xs text-gray-600 mt-1">Mise à jour en temps réel</p>
                        <div className="mt-2 text-xs">
                          <p className="text-gray-700">
                            <strong>Latitude:</strong> {userPosition[0].toFixed(6)}
                          </p>
                          <p className="text-gray-700">
                            <strong>Longitude:</strong> {userPosition[1].toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Cercle de précision */}
                  <Circle
                    center={userPosition}
                    radius={30}
                    pathOptions={{
                      fillColor: '#667eea',
                      fillOpacity: 0.15,
                      color: '#667eea',
                      weight: 2,
                      opacity: 0.5
                    }}
                  />
                </>
              )}

              {/* Afficher toutes les routes */}
              {mapReady && (
                <MultipleRoutesDisplay
                  userPosition={userPosition}
                  bins={displayBins}
                  showAllRoutes={showAllRoutes}
                />
              )}

              {/* Marqueurs des poubelles */}
              {displayBins.map((bin, index) => (
                <Marker
                  key={bin.bin_id}
                  position={[bin.latitude, bin.longitude]}
                  icon={createBinIcon(bin.fill_level, selectedBin?.bin_id === bin.bin_id)}
                  eventHandlers={{
                    click: () => setSelectedBin(bin),
                  }}
                >
                  <Popup>
                    <div className="p-3 min-w-[200px]">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">{bin.bin_id}</h3>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length] }}
                          title="Couleur de la route"
                        ></div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{bin.location}</p>
                      
                      <div className="space-y-2 text-sm border-t pt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Remplissage:</span>
                          <span className="font-bold" style={{ color: getFillColor(bin.fill_level) }}>
                            {bin.fill_level}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Batterie:</span>
                          <span className="font-semibold">{bin.battery}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Signal:</span>
                          <span className="font-semibold">{bin.signal_quality}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Trash2 size={64} className="mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-semibold">Chargement de la carte...</p>
              </div>
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 overflow-y-auto border-2 border-gray-200" 
          style={{ height: '650px', position: 'relative', zIndex: 2 }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Trash2 size={20} className="mr-2" />
            Détails
          </h3>
          
          {selectedBin ? (
            <div className="space-y-4">
              <div className="pb-4 border-b-2">
                <h4 className="font-bold text-xl text-gray-800">{selectedBin.bin_id}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedBin.location}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Remplissage:</span>
                  <span className="font-bold text-xl">{Math.round(selectedBin.fill_level)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all duration-300"
                    style={{
                      width: `${selectedBin.fill_level}%`,
                      backgroundColor: getFillColor(selectedBin.fill_level)
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
                  <span className="text-xs font-semibold text-blue-900">Batterie</span>
                  <p className="font-bold text-lg text-blue-700">{Math.round(selectedBin.battery)}%</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
                  <span className="text-xs font-semibold text-purple-900">Signal</span>
                  <p className="font-bold text-sm text-purple-700">{selectedBin.signal_quality}</p>
                </div>
              </div>

              {userPosition && showAllRoutes && (
                <div className="pt-4 border-t-2">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-red-900 mb-2">Itinéraire actif</p>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ 
                          backgroundColor: ROUTE_COLORS[displayBins.findIndex(b => b.bin_id === selectedBin.bin_id) % ROUTE_COLORS.length] 
                        }}
                      ></div>
                      <span className="text-sm text-gray-700">Route affichée en couleur</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <Trash2 size={56} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm font-semibold">Sélectionnez une poubelle</p>
              <p className="text-xs mt-2 text-gray-500">
                Cliquez sur un marqueur pour voir les détails
              </p>
              
              {!isTrackingLocation && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <Navigation size={32} className="mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-blue-800 font-semibold">
                    Activez le GPS pour voir les itinéraires
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

export default MapPageAutoRouting;