import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Composant pour afficher les coordonnées au survol de la carte
const CoordinatesDisplay = ({ setMouseCoordinates }) => {
  useMapEvents({
    mousemove: (e) => {
      setMouseCoordinates({
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6)
      });
    },
    mouseout: () => {
      setMouseCoordinates(null);
    }
  });
  return null;
};

// Composant pour le contrôle manuel de la carte (SANS auto-update)
const MapController = ({ center, zoom, shouldUpdate, onUpdateComplete }) => {
  const map = useMap();
  
  useEffect(() => {
    if (shouldUpdate && center) {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
      // Réinitialiser le flag après la mise à jour
      if (onUpdateComplete) {
        setTimeout(() => onUpdateComplete(), 600);
      }
    }
  }, [shouldUpdate]); // Ne dépend QUE de shouldUpdate, pas de center ou zoom
  
  return null;
};

// Composant pour gérer l'invalidation de la taille
const MapSizeController = () => {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map]);
  
  return null;
};

const MapPage = ({ bins, selectedBin, setSelectedBin }) => {
  const fianarantsoa = [-21.4531, 47.0856];
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [mapCenter, setMapCenter] = useState(fianarantsoa);
  const [mapZoom, setMapZoom] = useState(13);
  const [shouldUpdateView, setShouldUpdateView] = useState(false);
  const [mouseCoordinates, setMouseCoordinates] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routePointsCount, setRoutePointsCount] = useState(0);

  // Obtenir la position de l'utilisateur UNE SEULE FOIS au chargement
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setLocationAccuracy(position.coords.accuracy);
          // Centrer UNE SEULE FOIS au démarrage
          setMapCenter(coords);
          setMapZoom(14);
          setShouldUpdateView(true);
          console.log("Position utilisateur:", coords, "Précision:", position.coords.accuracy, "m");
        },
        (error) => {
          console.warn("Erreur de géolocalisation:", error.message);
          setUserLocation(fianarantsoa);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.warn("Géolocalisation non supportée");
      setUserLocation(fianarantsoa);
    }
  }, []); // Dépendance vide = exécution UNE SEULE FOIS

  // Calculer la route entre deux points avec OSRM
  const calculateRoute = async (start, end) => {
    setIsLoadingRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRouteCoordinates(coordinates);
        setRoutePointsCount(coordinates.length);
        
        // Calculer la distance
        const distanceKm = (data.routes[0].distance / 1000).toFixed(2);
        setRouteDistance(distanceKm);
        
        console.log("Route calculée avec succès:", coordinates.length, "points, Distance:", distanceKm, "km");
      } else {
        console.warn("Impossible de calculer la route, tracé direct");
        setRouteCoordinates([start, end]);
        setRoutePointsCount(2);
        
        // Calculer distance à vol d'oiseau
        const distance = calculateDistance(start, end);
        setRouteDistance(distance);
      }
    } catch (error) {
      console.error("Erreur lors du calcul de la route:", error);
      setRouteCoordinates([start, end]);
      setRoutePointsCount(2);
      
      const distance = calculateDistance(start, end);
      setRouteDistance(distance);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Calculer la route quand une poubelle est sélectionnée
  useEffect(() => {
    if (selectedBin && userLocation) {
      const binCoords = [selectedBin.latitude, selectedBin.longitude];
      calculateRoute(userLocation, binCoords);
    } else {
      setRouteCoordinates([]);
      setRouteDistance(null);
      setRoutePointsCount(0);
    }
  }, [selectedBin]); // Ne dépend QUE de selectedBin, pas de userLocation

  // Fonction pour recentrer la carte sur l'itinéraire
  const recenterMap = () => {
    if (routeCoordinates.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(routeCoordinates);
      mapRef.current.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 0.5
      });
    } else if (userLocation && mapRef.current) {
      setMapCenter(userLocation);
      setMapZoom(14);
      setShouldUpdateView(true);
    }
  };

  // Créer une icône personnalisée pour les poubelles
  const createBinIcon = (fillLevel) => {
    let bgColor;
    if (fillLevel >= 95) {
      bgColor = '#ff6b6b';
    } else if (fillLevel >= 80) {
      bgColor = '#ffd93d';
    } else {
      bgColor = '#6bcf7f';
    }

    const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40">
        <path d="M 15 2 C 8 2 3 7 3 14 C 3 24 15 38 15 38 C 15 38 27 24 27 14 C 27 7 22 2 15 2 Z" fill="${bgColor}" stroke="white" stroke-width="2"/>
        <g transform="translate(15, 13)" stroke="white" stroke-width="1.5" fill="none">
          <path d="M -3 -3 L 3 -3 M -3 0 L 3 0 M -2 2 L 2 2 L 1 5 L 1 6 L -3 6 L 3 6"/>
        </g>
      </svg>
    `;

    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(iconSvg)}`,
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -40],
    });
  };

  // Créer une icône stable pour la position de l'utilisateur
  const createUserIcon = () => {
    const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#3b82f6" opacity="0.2">
          <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.2;0.1;0.2" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="20" cy="20" r="14" fill="#3b82f6" stroke="white" stroke-width="3"/>
        <circle cx="20" cy="20" r="5" fill="white"/>
        <path d="M 20 8 L 23 14 L 20 12 L 17 14 Z" fill="white" opacity="0.9"/>
      </svg>
    `;

    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(iconSvg)}`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
      className: 'user-location-marker'
    });
  };

  const getFillColor = (fillLevel) => {
    if (fillLevel >= 95) return '#ff6b6b';
    if (fillLevel >= 80) return '#ffd93d';
    return '#6bcf7f';
  };

  const calculateDistance = (coord1, coord2) => {
    if (!coord1 || !coord2) return null;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(2)} km`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Carte des Poubelles</h2>
        <div className="flex space-x-6">
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

      {isLoadingRoute && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
          <p className="font-medium">Calcul de l'itinéraire en cours...</p>
        </div>
      )}

      {/* Affichage des coordonnées de la souris */}
      {mouseCoordinates && (
        <div className="fixed top-20 right-6 z-[1000] bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-700">
          <div className="text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Lat:</span>
              <span className="font-bold">{mouseCoordinates.lat}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Lng:</span>
              <span className="font-bold">{mouseCoordinates.lng}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 map-wrapper" style={{ height: '600px', position: 'relative', zIndex: 1 }}>
          {bins && bins.length > 0 ? (
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              scrollWheelZoom={true} 
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              ref={mapRef}
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapSizeController />
              <MapController 
                center={mapCenter} 
                zoom={mapZoom} 
                shouldUpdate={shouldUpdateView}
                onUpdateComplete={() => setShouldUpdateView(false)}
              />
              <CoordinatesDisplay setMouseCoordinates={setMouseCoordinates} />
              
              {/* Boussole */}
              <div className="compass-control">
                <div className="compass-rose">
                  <div className="compass-direction compass-north">N</div>
                  <div className="compass-direction compass-east">E</div>
                  <div className="compass-direction compass-south">S</div>
                  <div className="compass-direction compass-west">O</div>
                  <div className="compass-center"></div>
                </div>
              </div>

              {/* Bouton de recentrage */}
              <div className="recenter-control">
                <button 
                  onClick={recenterMap}
                  className="recenter-button"
                  title="Recentrer sur l'itinéraire"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="12" y1="2" x2="12" y2="6"/>
                    <line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="6" y2="12"/>
                    <line x1="18" y1="12" x2="22" y2="12"/>
                  </svg>
                </button>
              </div>
              
              {/* Marqueur de la position de l'utilisateur */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={createUserIcon()}
                  zIndexOffset={1000}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-blue-600 mb-2">📍 Votre position</h3>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Latitude:</span>
                          <span className="font-mono font-semibold">{userLocation[0].toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Longitude:</span>
                          <span className="font-mono font-semibold">{userLocation[1].toFixed(6)}</span>
                        </div>
                        {locationAccuracy && (
                          <div className="flex justify-between pt-1 border-t">
                            <span className="text-gray-600">Précision:</span>
                            <span className="font-semibold text-green-600">±{Math.round(locationAccuracy)}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Route tracée automatiquement en couleur sur les rues */}
              {routeCoordinates.length > 0 && (
                <>
                  {/* Ligne de fond (ombre) */}
                  <Polyline
                    positions={routeCoordinates}
                    color="#000000"
                    weight={6}
                    opacity={0.3}
                  />
                  {/* Ligne principale avec gradient */}
                  <Polyline
                    positions={routeCoordinates}
                    color="#dc2626"
                    weight={4}
                    opacity={0.8}
                    dashArray="0"
                    lineCap="round"
                    lineJoin="round"
                  />
                  {/* Ligne animée par-dessus */}
                  <Polyline
                    positions={routeCoordinates}
                    color="#ffffff"
                    weight={2}
                    opacity={0.6}
                    dashArray="10, 15"
                    lineCap="round"
                    className="animated-route"
                  />
                </>
              )}
              
              {/* Marqueurs des poubelles */}
              {bins.map((bin) => (
                <Marker
                  key={bin.bin_id}
                  position={[bin.latitude, bin.longitude]}
                  icon={createBinIcon(bin.fill_level)}
                  eventHandlers={{
                    click: () => {
                      setSelectedBin(bin);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-3">
                      <h3 className="font-bold text-lg">{bin.bin_id}</h3>
                      <p className="text-sm text-gray-700">{bin.location}</p>
                      <p className="text-xs text-gray-600 mt-1">Remplissage: {bin.fill_level}%</p>
                      {userLocation && (
                        <p className="text-xs text-blue-600 mt-1 font-semibold">
                          Distance: {calculateDistance(userLocation, [bin.latitude, bin.longitude])}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Chargement de la carte...
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 overflow-y-auto border border-gray-200" style={{ height: '600px', position: 'relative', zIndex: 2 }}>
          <h3 className="text-lg font-bold mb-4">Détails</h3>
          
          {userLocation && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <span className="mr-2">📍</span> Votre position
              </h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-mono font-semibold">{userLocation[0].toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-mono font-semibold">{userLocation[1].toFixed(6)}</span>
                </div>
                {locationAccuracy && (
                  <div className="flex justify-between pt-1 border-t mt-1">
                    <span className="text-gray-600">Précision GPS:</span>
                    <span className="font-semibold text-green-600">±{Math.round(locationAccuracy)}m</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedBin ? (
            <div className="space-y-4">
              <div className="pb-4 border-b">
                <h4 className="font-bold text-lg">{selectedBin.bin_id}</h4>
                <p className="text-sm text-gray-700">{selectedBin.location}</p>
                {userLocation && routeDistance && (
                  <p className="text-sm text-blue-600 font-semibold mt-2">
                    📏 Distance: {routeDistance}
                  </p>
                )}
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

              {routeCoordinates.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 font-semibold mb-1">
                    ✓ Itinéraire tracé automatiquement
                  </p>
                  <p className="text-xs text-gray-600">
                    {routePointsCount} points de route calculés
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedBin(null);
                  setRouteCoordinates([]);
                  setRouteDistance(null);
                  setRoutePointsCount(0);
                }}
                className="w-full mt-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
              >
                Effacer la sélection
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 mb-4">Cliquez sur une poubelle pour voir l'itinéraire</p>
              {userLocation && (
                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  L'itinéraire sera automatiquement tracé en couleur sur les rues depuis votre position vers la poubelle sélectionnée
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;