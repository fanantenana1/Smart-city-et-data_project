import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, MapPin, AlertTriangle, TrendingUp, User, Navigation as NavigationIcon, Bell, Calendar, Activity, Battery, Thermometer, Signal } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Footer from './Footer';
import AlertsPage from './AlertsPage';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const API_URL = 'http://localhost:8000/api';

const SimpleUserDashboard = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [bins, setBins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [collections, setCollections] = useState([]);
  const [user, setUser] = useState(null);
  const [assignedBins, setAssignedBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);

  // Connexion WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'bin_update') {
        // NE PAS mettre à jour si on est sur la page carte
        if (currentPage !== 'map') {
          fetchAssignedBins(); // UNIQUEMENT les poubelles assignées
        }
      } else if (data.type === 'alert') {
        fetchAlerts();
      }
    };

    ws.onerror = (error) => {
      console.log('WebSocket error:', error);
    };

    // Charger les données initiales
    loadUser();
    fetchAssignedBins(); // Charger UNIQUEMENT les poubelles assignées
    fetchAlerts();
    fetchStatistics();
    fetchCollections();

    const interval = setInterval(() => {
      // NE PAS mettre à jour quand on est sur la carte
      if (currentPage !== 'map') {
        fetchAssignedBins(); // UNIQUEMENT les poubelles assignées
        fetchStatistics();
      }
    }, 15000); // 15 secondes

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [currentPage]);

  const loadUser = () => {
    const token = localStorage.getItem('sw_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: payload.sub, id: payload.user_id });
      } catch (e) {
        console.error('Error decoding token');
      }
    }
  };

  // MODIFIÉ : Récupérer UNIQUEMENT les poubelles assignées à l'utilisateur
  const fetchAssignedBins = async () => {
    try {
      const token = localStorage.getItem('sw_token');
      if (!token) {
        console.log('Pas de token trouvé');
        return;
      }
      
      const response = await fetch(`${API_URL}/user/assigned-bins`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Poubelles assignées récupérées:', data);
        setAssignedBins(data);
        setBins(data); // Les bins généraux = bins assignés pour un simple user
      } else {
        console.error('Erreur lors de la récupération des poubelles assignées');
        setAssignedBins([]);
        setBins([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des poubelles assignées:', error);
      setAssignedBins([]);
      setBins([]);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts`);
      const data = await response.json();
      // Filtrer les alertes pour ne garder que celles des poubelles assignées
      const assignedBinIds = assignedBins.map(bin => bin.bin_id);
      const filteredAlerts = data.filter(alert => assignedBinIds.includes(alert.bin_id));
      setAlerts(filteredAlerts);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_URL}/statistics`);
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch(`${API_URL}/collections`);
      const data = await response.json();
      // Filtrer les collections pour ne garder que celles des poubelles assignées
      const assignedBinIds = assignedBins.map(bin => bin.bin_id);
      const filteredCollections = data.filter(col => assignedBinIds.includes(col.bin_id));
      setCollections(filteredCollections.slice(0, 5));
    } catch (error) {
      console.error('Erreur lors du chargement des collectes:', error);
    }
  };

  const handleResolveAlert = (alertIndex) => {
    const updatedAlerts = [...alerts];
    updatedAlerts[alertIndex].status = 'resolved';
    setAlerts(updatedAlerts);
  };

  // Navigation Component
  const NavigationBar = () => (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img 
              src="/smartwaste-logo.png" 
              alt="SmartWaste Logo" 
              className="w-16 h-16 object-contain"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
            />
            <div>
              <h1 className="text-xl font-bold text-slate-800">SmartWaste</h1>
              <p className="text-xs text-slate-500">Commune de Fianarantsoa</p>
            </div>
          </div>

          <div className="hidden md:flex space-x-1">
            <button onClick={() => setCurrentPage('home')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'home' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Accueil</button>
            <button onClick={() => setCurrentPage('bins')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'bins' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Mes Poubelles</button>
            <button onClick={() => setCurrentPage('map')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'map' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Carte</button>
            <button onClick={() => setCurrentPage('alerts')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'alerts' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Alertes</button>
            <button onClick={() => setCurrentPage('reports')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'reports' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Rapports</button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="text-slate-600" size={20} />
              <span className="text-sm text-slate-700">{user?.username}</span>
            </div>
            <button
              onClick={() => { localStorage.removeItem('sw_token'); window.location.href = '/'; }}
              className="hidden md:block px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  // Home Page
  const HomePage = () => {
    const criticalBins = assignedBins.filter(b => b.fill_level >= 90);
    const attentionBins = assignedBins.filter(b => b.fill_level >= 70 && b.fill_level < 90);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-slate-800">Tableau de bord</h2>
          <div className="text-sm text-slate-600">
            Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>

        {/* Stats Cards - UNIQUEMENT pour les poubelles assignées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Trash2 className="text-emerald-600" size={24} />
              <span className="text-3xl font-bold text-slate-800">{assignedBins.length}</span>
            </div>
            <p className="text-sm text-slate-600">Mes poubelles</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-red-600" size={24} />
              <span className="text-3xl font-bold text-red-600">{criticalBins.length}</span>
            </div>
            <p className="text-sm text-slate-600">Critiques (≥90%)</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-yellow-600" size={24} />
              <span className="text-3xl font-bold text-yellow-600">{attentionBins.length}</span>
            </div>
            <p className="text-sm text-slate-600">Attention (70-89%)</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-emerald-600" size={24} />
              <span className="text-3xl font-bold text-emerald-600">
                {assignedBins.filter(b => b.fill_level < 70).length}
              </span>
            </div>
            <p className="text-sm text-slate-600">Normales (&lt;70%)</p>
          </div>
        </div>

        {/* Mes Poubelles Assignées */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Mes Poubelles Assignées</h3>
          {assignedBins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedBins.map((bin) => (
                <div 
                  key={bin.bin_id}
                  onClick={() => {
                    setSelectedBin(bin);
                    setCurrentPage('bin-detail');
                  }}
                  className="p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md"
                  style={{
                    borderColor: bin.fill_level >= 90 ? '#ef4444' : bin.fill_level >= 70 ? '#eab308' : '#22c55e',
                    backgroundColor: bin.fill_level >= 90 ? '#fee2e2' : bin.fill_level >= 70 ? '#fef3c7' : '#dcfce7'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{bin.bin_id}</h4>
                    <span className="text-2xl font-bold">{bin.fill_level}%</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{bin.location}</p>
                  <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${bin.fill_level}%`,
                        backgroundColor: bin.fill_level >= 90 ? '#ef4444' : bin.fill_level >= 70 ? '#eab308' : '#22c55e'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-lg">Aucune poubelle ne vous est assignée</p>
              <p className="text-slate-400 text-sm mt-2">Contactez l'administrateur pour obtenir des assignations</p>
            </div>
          )}
        </div>

        {/* Alertes Récentes - UNIQUEMENT pour les poubelles assignées */}
        {alerts.filter(a => a.status === 'active').length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6">
            <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
              <Bell className="mr-2" size={24} />
              Alertes Actives ({alerts.filter(a => a.status === 'active').length})
            </h3>
            <div className="space-y-3">
              {alerts.filter(a => a.status === 'active').slice(0, 3).map((alert, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{alert.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(alert.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage('alerts')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Voir toutes les alertes
            </button>
          </div>
        )}
      </div>
    );
  };

  // Bins Page - UNIQUEMENT les poubelles assignées
  const BinsPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Mes Poubelles</h2>
        <div className="text-sm text-slate-600">
          {assignedBins.length} poubelle{assignedBins.length > 1 ? 's' : ''} assignée{assignedBins.length > 1 ? 's' : ''}
        </div>
      </div>
      
      {assignedBins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedBins.map((bin) => {
            const fillColor = bin.fill_level >= 90 ? 'red' : bin.fill_level >= 70 ? 'yellow' : 'green';
            
            return (
              <div
                key={bin.bin_id}
                onClick={() => {
                  setSelectedBin(bin);
                  setCurrentPage('bin-detail');
                }}
                className="bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md"
                style={{
                  borderColor: fillColor === 'red' ? '#ef4444' : fillColor === 'yellow' ? '#eab308' : '#22c55e'
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-slate-800">{bin.bin_id}</h3>
                    <p className="text-sm text-slate-600 flex items-center mt-1">
                      <MapPin size={14} className="mr-1" />
                      {bin.location}
                    </p>
                  </div>
                  <Trash2 
                    className={fillColor === 'red' ? 'text-red-500' : fillColor === 'yellow' ? 'text-yellow-500' : 'text-green-500'} 
                    size={28} 
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Remplissage</span>
                      <span className="font-bold text-slate-800">{bin.fill_level}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: `${bin.fill_level}%`,
                          backgroundColor: fillColor === 'red' ? '#ef4444' : fillColor === 'yellow' ? '#eab308' : '#22c55e'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-xs text-slate-600">Batterie</p>
                      <p className="font-bold text-slate-800">{bin.battery}%</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-xs text-slate-600">Signal</p>
                      <p className="font-bold text-slate-800 text-sm">{bin.signal_quality}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Trash2 className="mx-auto text-slate-300 mb-4" size={64} />
          <h3 className="text-xl font-bold text-slate-600 mb-2">Aucune poubelle assignée</h3>
          <p className="text-slate-500">Contactez l'administrateur pour obtenir des assignations de poubelles</p>
        </div>
      )}
    </div>
  );

  // Map Page avec Routing - UNIQUEMENT les poubelles assignées
  const MapPage = () => {
    const fianarantsoa = [-21.4531, 47.0856];
    const [userLocation, setUserLocation] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [mapCenter, setMapCenter] = useState(fianarantsoa);
    const [mapZoom, setMapZoom] = useState(13);
    const [localSelectedBin, setLocalSelectedBin] = useState(null);

    // Composant pour gérer le centrage de la carte
    const MapController = ({ center, zoom }) => {
      const map = useMap();
      
      useEffect(() => {
        if (center) {
          map.setView(center, zoom, { animate: true });
        }
      }, [center, zoom, map]);
      
      return null;
    };

    // Obtenir la position de l'utilisateur
    useEffect(() => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = [position.coords.latitude, position.coords.longitude];
            setUserLocation(coords);
            setMapCenter(coords);
            setMapZoom(14);
            console.log("Position utilisateur:", coords);
          },
          (error) => {
            console.warn("Erreur de géolocalisation:", error.message);
            setUserLocation(fianarantsoa);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        console.warn("Géolocalisation non supportée");
        setUserLocation(fianarantsoa);
      }
    }, []);

    // Calculer la route entre deux points
    const calculateRoute = async (start, end) => {
      setIsLoadingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoordinates(coordinates);
        } else {
          setRouteCoordinates([start, end]);
        }
      } catch (error) {
        console.error("Erreur lors du calcul de la route:", error);
        setRouteCoordinates([start, end]);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    // Calculer la route quand une poubelle est sélectionnée
    useEffect(() => {
      if (localSelectedBin && userLocation) {
        const binCoords = [localSelectedBin.latitude, localSelectedBin.longitude];
        calculateRoute(userLocation, binCoords);
        setMapCenter(binCoords);
        setMapZoom(15);
      } else {
        setRouteCoordinates([]);
      }
    }, [localSelectedBin, userLocation]);

    // Créer des icônes personnalisées pour les poubelles
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
          <g transform="translate(15, 13)" stroke="white" stroke-width="1" fill="none">
            <path d="M -2 -2 L 2 -2 M -2 0 L 2 0 M -1 2 L 1 2 L 0 4 L 0 5 L -2 5 L 2 5"/>
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

    // Créer une icône pour la position de l'utilisateur
    const createUserIcon = () => {
      const iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="13" fill="#3b82f6" stroke="white" stroke-width="3"/>
          <circle cx="15" cy="15" r="6" fill="white"/>
        </svg>
      `;

      return L.icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(iconSvg)}`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
      });
    };

    const getFillColor = (fillLevel) => {
      if (fillLevel >= 95) return '#ff6b6b';
      if (fillLevel >= 80) return '#ffd93d';
      return '#6bcf7f';
    };

    const calculateDistance = (coord1, coord2) => {
      if (!coord1 || !coord2) return null;
      
      const R = 6371;
      const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
      const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(2)} km`;
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Carte de Mes Poubelles</h2>
            <p className="text-sm text-gray-600 mt-1">
              {localSelectedBin 
                ? `Itinéraire vers ${localSelectedBin.bin_id}` 
                : `${assignedBins.length} poubelle${assignedBins.length > 1 ? 's' : ''} assignée${assignedBins.length > 1 ? 's' : ''}`}
            </p>
          </div>
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
            <p className="font-medium">📍 Calcul de l'itinéraire en cours...</p>
          </div>
        )}

        {assignedBins.length === 0 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
            <p className="font-medium">⚠️ Aucune poubelle ne vous est assignée. Contactez l'administrateur.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200" style={{ height: '600px' }}>
            {assignedBins.length > 0 ? (
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                scrollWheelZoom={true} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapController center={mapCenter} zoom={mapZoom} />
                
                {/* Marqueur de la position de l'utilisateur */}
                {userLocation && (
                  <Marker
                    position={userLocation}
                    icon={createUserIcon()}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-blue-600">📍 Votre position</h3>
                        <p className="text-xs text-gray-600">
                          {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Route entre l'utilisateur et la poubelle sélectionnée */}
                {routeCoordinates.length > 0 && (
                  <Polyline
                    positions={routeCoordinates}
                    color="#dc2626"
                    weight={4}
                    opacity={0.7}
                    dashArray="10, 10"
                  />
                )}
                
                {/* Marqueurs des poubelles ASSIGNÉES uniquement */}
                {assignedBins.map((bin) => (
                  <Marker
                    key={bin.bin_id}
                    position={[bin.latitude, bin.longitude]}
                    icon={createBinIcon(bin.fill_level)}
                    eventHandlers={{
                      click: () => {
                        setLocalSelectedBin(bin);
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
                            📏 Distance: {calculateDistance(userLocation, [bin.latitude, bin.longitude])}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            setSelectedBin(bin);
                            setCurrentPage('bin-detail');
                          }}
                          className="mt-2 w-full py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs font-semibold"
                        >
                          Voir détails
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
                <div className="text-center">
                  <Trash2 className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-lg font-medium">Aucune poubelle assignée</p>
                  <p className="text-sm mt-2">Contactez l'administrateur pour obtenir des assignations</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 overflow-y-auto border border-gray-200" style={{ height: '600px' }}>
            <h3 className="text-lg font-bold mb-4">Détails</h3>
            
            {userLocation && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <span className="mr-2">📍</span> Votre position
                </h4>
                <p className="text-xs text-gray-600">
                  Lat: {userLocation[0].toFixed(6)}<br/>
                  Long: {userLocation[1].toFixed(6)}
                </p>
              </div>
            )}
            
            {localSelectedBin ? (
              <div className="space-y-4">
                <div className="pb-4 border-b">
                  <h4 className="font-bold text-lg">{localSelectedBin.bin_id}</h4>
                  <p className="text-sm text-gray-700">{localSelectedBin.location}</p>
                  {userLocation && (
                    <p className="text-sm text-blue-600 font-semibold mt-2">
                      📏 Distance: {calculateDistance(userLocation, [localSelectedBin.latitude, localSelectedBin.longitude])}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Remplissage:</span>
                    <span className="font-bold">{Math.round(localSelectedBin.fill_level)}%</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${localSelectedBin.fill_level}%`,
                        backgroundColor: getFillColor(localSelectedBin.fill_level)
                      }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4">
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="text-xs font-semibold">Batterie</span>
                    <p className="font-bold">{Math.round(localSelectedBin.battery)}%</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <span className="text-xs font-semibold">Signal</span>
                    <p className="font-bold text-sm">{localSelectedBin.signal_quality}</p>
                  </div>
                </div>

                {routeCoordinates.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-semibold">
                      ✓ Itinéraire affiché en rouge sur la carte
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setLocalSelectedBin(null);
                    setRouteCoordinates([]);
                  }}
                  className="w-full mt-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
                >
                  Effacer la sélection
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-400 mb-4">
                  {assignedBins.length > 0 
                    ? 'Cliquez sur une poubelle pour voir l\'itinéraire' 
                    : 'Aucune poubelle à afficher'}
                </p>
                {userLocation && assignedBins.length > 0 && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    L'itinéraire sera tracé depuis votre position actuelle vers la poubelle sélectionnée
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Alerts Page Wrapper
  const AlertsPageWrapper = () => (
    <AlertsPage alerts={alerts} onResolveAlert={handleResolveAlert} />
  );

  // Reports Page - UNIQUEMENT pour les poubelles assignées
  const ReportsPage = () => {
    const avgFillLevel = assignedBins.length > 0 
      ? (assignedBins.reduce((sum, bin) => sum + bin.fill_level, 0) / assignedBins.length).toFixed(1)
      : 0;

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-800">Rapports de Mes Poubelles</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-blue-600" size={24} />
              <span className="text-3xl font-bold text-slate-800">{avgFillLevel}%</span>
            </div>
            <p className="text-sm text-slate-600">Taux de remplissage moyen</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-emerald-600" size={24} />
              <span className="text-3xl font-bold text-slate-800">{collections.length}</span>
            </div>
            <p className="text-sm text-slate-600">Collectes récentes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Trash2 className="text-purple-600" size={24} />
              <span className="text-3xl font-bold text-slate-800">{assignedBins.length}</span>
            </div>
            <p className="text-sm text-slate-600">Mes poubelles</p>
          </div>
        </div>

        {/* Table des collectes - UNIQUEMENT pour les poubelles assignées */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Historique de Mes Collectes</h3>
          {collections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Poubelle</th>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Opérateur</th>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Volume</th>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Niveau</th>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {collections.map((col, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800">{col.bin_id}</td>
                      <td className="py-3 px-4 text-slate-600">{col.operator}</td>
                      <td className="py-3 px-4 font-semibold text-blue-600">{col.volume_collected}L</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          col.percentage >= 90 ? 'bg-red-100 text-red-700' :
                          col.percentage >= 70 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {col.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{new Date(col.timestamp).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Aucune collecte récente pour vos poubelles
            </div>
          )}
        </div>
      </div>
    );
  };

  // Page de détail d'une poubelle
  const BinDetailPage = () => {
    if (!selectedBin) return <HomePage />;

    const binAlerts = alerts.filter(a => a.bin_id === selectedBin.bin_id && a.status === 'active');
    const fillColor = selectedBin.fill_level >= 90 ? 'red' : selectedBin.fill_level >= 70 ? 'yellow' : 'green';

    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage('bins')}
            className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition"
          >
            ← Retour
          </button>
        </div>

        {/* Carte d'information principale */}
        <div className={`rounded-xl overflow-hidden shadow-lg border-2 ${
          fillColor === 'red' ? 'border-red-500' :
          fillColor === 'yellow' ? 'border-yellow-500' :
          'border-green-500'
        }`}>
          <div className={`px-8 py-6 ${
            fillColor === 'red' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
            fillColor === 'yellow' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
            'bg-gradient-to-r from-green-500 to-emerald-600'
          }`}>
            <h1 className="text-3xl font-bold text-white mb-2">{selectedBin.bin_id}</h1>
            <p className="text-white/90 flex items-center space-x-2">
              <MapPin size={18} />
              <span className="text-lg">{selectedBin.location}</span>
            </p>
          </div>

          <div className="bg-white p-8">
            {/* Niveau de remplissage */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <span className="text-lg font-semibold text-slate-700">Niveau de Remplissage</span>
                <span className="text-4xl font-bold text-slate-800">{selectedBin.fill_level}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-6 rounded-full transition-all ${
                    fillColor === 'red' ? 'bg-red-500' :
                    fillColor === 'yellow' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${selectedBin.fill_level}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-slate-600">
                <span>Volume actuel: {selectedBin.current_volume}L</span>
                <span>Capacité: {selectedBin.capacity}L</span>
              </div>
            </div>

            {/* Grille d'informations */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <Battery className={selectedBin.battery >= 50 ? 'text-green-600 mb-3' : 'text-red-600 mb-3'} size={28} />
                <p className="text-sm text-slate-600 mb-1">Batterie</p>
                <p className="text-3xl font-bold text-slate-800">{selectedBin.battery}%</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <Thermometer className="text-blue-600 mb-3" size={28} />
                <p className="text-sm text-slate-600 mb-1">Température</p>
                <p className="text-3xl font-bold text-slate-800">{selectedBin.temperature}°C</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <Signal className="text-purple-600 mb-3" size={28} />
                <p className="text-sm text-slate-600 mb-1">Signal</p>
                <p className="text-2xl font-bold text-slate-800">{selectedBin.signal_quality}</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <Calendar className="text-orange-600 mb-3" size={28} />
                <p className="text-sm text-slate-600 mb-1">Dernière collecte</p>
                <p className="text-lg font-bold text-slate-800">{selectedBin.last_collection || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertes pour cette poubelle */}
        {binAlerts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6">
            <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center space-x-2">
              <AlertTriangle size={24} />
              <span>Alertes Actives ({binAlerts.length})</span>
            </h3>
            <div className="space-y-3">
              {binAlerts.map((alert, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-lg">{alert.title}</p>
                      <p className="text-slate-700 mt-1">{alert.description}</p>
                      <p className="text-sm text-slate-500 mt-2">
                        {new Date(alert.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {alert.status === 'active' && (
                      <button
                        onClick={() => handleResolveAlert(idx)}
                        className="ml-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold text-sm whitespace-nowrap"
                      >
                        ✓ Résoudre
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setCurrentPage('map');
            }}
            className="flex-1 py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition flex items-center justify-center space-x-2 text-lg"
          >
            <MapPin size={24} />
            <span>Localiser sur la carte</span>
          </button>
          <button
            onClick={() => setCurrentPage('alerts')}
            className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition flex items-center justify-center space-x-2 text-lg"
          >
            <Bell size={24} />
            <span>Gérer les alertes</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <NavigationBar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {currentPage === 'home' ? <HomePage /> :
         currentPage === 'bins' ? <BinsPage /> :
         currentPage === 'map' ? <MapPage /> :
         currentPage === 'alerts' ? <AlertsPageWrapper /> :
         currentPage === 'reports' ? <ReportsPage /> :
         currentPage === 'bin-detail' ? <BinDetailPage /> :
         <HomePage />}
      </main>

      <Footer />
    </div>
  );
};

export default SimpleUserDashboard;