import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Trash2, CheckCircle, MapPin, AlertTriangle, TrendingUp, Battery, Thermometer, Cpu, Zap, Radio } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import Footer from './components/Footer';
import NetworkSettings from './components/NetworkSettings';
import BinsManagementPage from './components/BinsManagementPage';
import MapPage from './components/MapPage';
import ReportsPage from './components/ReportsPage';
import UserManagementPage from './components/UserManagementPage';
// import BinDetailPage from './components/BinDetailPage'; // Utilise BinDetailPageWrapper à la place

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const API_URL = '/api';

const SmartWasteDashboard = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [collections, setCollections] = useState([]);
  const [user, setUser] = useState(null);
  const isInitialized = React.useRef(false);

  // Définir les fonctions fetch avec useCallback pour éviter les re-créations
  const fetchBins = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/bins`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setBins(data);
        console.log('✅ Poubelles chargées:', data.length);
      } else if (data && data.data && Array.isArray(data.data)) {
        setBins(data.data);
        console.log('✅ Poubelles chargées:', data.data.length);
      } else {
        console.warn('Format de réponse inattendu:', data);
        setBins([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des poubelles:', error);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/alerts`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setAlerts(data);
      } else if (data && data.data && Array.isArray(data.data)) {
        setAlerts(data.data);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/statistics`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStatistics(data || {});
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/collections`);
      const data = await response.json();
      setCollections(data.slice(0, 5));
    } catch (error) {
      console.error('Erreur lors du chargement des collectes:', error);
    }
  }, []);

  const loadUser = useCallback(() => {
    const token = localStorage.getItem('sw_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: payload.sub, role: payload.role });
      } catch (e) {
        console.error('Error decoding token');
      }
    }
  }, []);

  // Connexion WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws');
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'bin_update') {
          fetchBins();
        } else if (data.type === 'alert') {
          fetchAlerts();
        }
      };

      ws.onerror = (error) => {
        console.warn('WebSocket connection error:', error);
      };

      return () => {
        try {
          ws.close();
        } catch (e) {
          console.warn('Error closing WebSocket:', e);
        }
      };
    } catch (error) {
      console.warn('WebSocket not available:', error);
    }
  }, [fetchBins, fetchAlerts]);

  // Charger les données initiales et polling régulier (une seule fois au montage)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Charger immédiatement
    fetchBins();
    fetchAlerts();
    fetchStatistics();
    fetchCollections();
    loadUser();

    // Polling toutes les 3 secondes pour les bins
    const binInterval = setInterval(() => {
      fetchBins();
    }, 3000);

    // Polling toutes les 5 secondes pour les stats
    const statsInterval = setInterval(() => {
      fetchStatistics();
    }, 5000);

    // Polling toutes les 10 secondes pour les alertes
    const alertInterval = setInterval(() => {
      fetchAlerts();
    }, 10000);

    return () => {
      clearInterval(binInterval);
      clearInterval(statsInterval);
      clearInterval(alertInterval);
    };
  }, [fetchBins, fetchAlerts, fetchStatistics, fetchCollections, loadUser]);

  // Forcer le rechargement quand on navigue vers la page des poubelles
  useEffect(() => {
    if (currentPage === 'bins') {
      console.log('📍 Navigation vers la page Poubelles - rechargement');
      fetchBins();
      fetchStatistics();
    }
  }, [currentPage, fetchBins, fetchStatistics]);

  const resolveAlert = async (alertIndex) => {
    try {
      await fetch(`${API_URL}/alert/${alertIndex}/resolve`, { method: 'POST' });
      fetchAlerts();
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
    }
  };

  // Fonctions CRUD pour les poubelles
  const addBin = async (newBin) => {
    const binWithDefaults = {
      ...newBin,
      current_volume: Math.round((newBin.fill_level / 100) * newBin.capacity),
      last_update: new Date().toISOString(),
      last_collection: null
    };
    // Frontend met à jour l'état
    setBins([...bins, binWithDefaults]);
    
    // FORCER LE RECHARGEMENT DEPUIS MONGODB APRÈS 500ms
    setTimeout(() => {
      fetchBins();
      fetchStatistics();
    }, 500);
  };

  const updateBin = async (binId, updatedBin) => {
    const updatedBinWithVolume = {
      ...updatedBin,
      current_volume: Math.round((updatedBin.fill_level / 100) * updatedBin.capacity),
      last_update: new Date().toISOString()
    };
    // Frontend met à jour l'état
    setBins(bins.map(b => b.bin_id === binId ? updatedBinWithVolume : b));
    
    // FORCER LE RECHARGEMENT DEPUIS MONGODB APRÈS 500ms
    setTimeout(() => {
      fetchBins();
      fetchStatistics();
    }, 500);
  };

  const deleteBin = async (binId) => {
    // Frontend met à jour l'état
    setBins(bins.filter(b => b.bin_id !== binId));
    // Supprimer aussi les alertes associées
    setAlerts(alerts.filter(a => a.bin_id !== binId));
    
    // FORCER LE RECHARGEMENT DEPUIS MONGODB APRÈS 500ms
    setTimeout(() => {
      fetchBins();
      fetchStatistics();
    }, 500);
  };

  // Navigation
  const Navigation = () => (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Trash2 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">SmartWaste</h1>
              <p className="text-xs text-slate-500">Commune de Fianarantsoa</p>
            </div>
          </div>
          
          <div className="hidden md:flex space-x-1">
            <button onClick={() => setCurrentPage('home')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'home' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Accueil</button>
            <button onClick={() => setCurrentPage('bins')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'bins' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Poubelles</button>
            <button onClick={() => setCurrentPage('map')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'map' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Carte</button>
            <button onClick={() => setCurrentPage('alerts')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'alerts' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Alertes</button>
            <button onClick={() => setCurrentPage('reports')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'reports' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Rapports</button>
            {user && user.role === 'admin' && (
              <button onClick={() => setCurrentPage('users')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'users' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Utilisateurs</button>
            )}
            <button onClick={() => setCurrentPage('settings')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'settings' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Paramètres</button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setCurrentPage('alerts')}
              >
                <Bell size={20} />
                {alerts.filter(a => (a.type === 'urgent' || a.type === 'important') && a.status === 'active').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {alerts.filter(a => (a.type === 'urgent' || a.type === 'important') && a.status === 'active').length}
                  </span>
                )}
              </button>
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

  // Page d'accueil
  const HomePage = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Gestion Intelligente des Déchets</h1>
        <p className="text-cyan-100 mb-6">Surveillez et gérez les poubelles intelligentes de Fianarantsoa en temps réel. Optimisez les collectes et améliorez l'efficacité urbaine.</p>
        <div className="flex space-x-4">
          <button onClick={() => setCurrentPage('map')} className="bg-white text-cyan-600 px-6 py-2 rounded-lg font-semibold flex items-center space-x-2">
            <MapPin size={18} />
            <span>Voir la Carte</span>
          </button>
          <button className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold">Rapports</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Poubelles Actives</span>
            <Trash2 className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{statistics.active_bins || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Collectes Aujourd'hui</span>
            <CheckCircle className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{statistics.total_collections || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Alertes Actives</span>
            <AlertTriangle className="text-orange-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{alerts.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Efficacité</span>
            <TrendingUp className="text-purple-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{statistics.efficiency || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-bold mb-4">Activité Récente</h3>
          <div className="space-y-3">
            {collections.slice(0, 3).map((col, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="text-green-500 mt-1" size={20} />
                <div className="flex-1">
                  <p className="font-semibold">Collecte terminée - {col.bin_id}</p>
                  <p className="text-sm text-gray-600">Opérateur: {col.operator}</p>
                  <p className="text-xs text-gray-500">{col.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-bold mb-4">Alertes Prioritaires</h3>
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                alert.type === 'urgent' ? 'bg-red-50 border-red-500' :
                alert.type === 'important' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    alert.type === 'urgent' ? 'bg-red-500 text-white' :
                    alert.type === 'important' ? 'bg-yellow-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>{alert.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Page Carte - supprimée, on utilise le composant MapPage importé directement
  // MapPageWrapper removed to avoid unused variable (render MapPage directly)

  // Page Détails Poubelle
  const BinDetailPageWrapper = ({ selectedBin }) => {
    if (!selectedBin) {
      return (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-600">Sélectionnez une poubelle pour voir les détails</p>
        </div>
      );
    }
    
    return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => setSelectedBin(null)} className="text-gray-600 hover:text-gray-800">
          ← Retour
        </button>
        <div>
          <h2 className="text-2xl font-bold">Poubelle {selectedBin.bin_id}</h2>
          <p className="text-gray-600">{selectedBin.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className={`w-32 h-32 mx-auto rounded-full border-8 flex items-center justify-center ${
            selectedBin.fill_level >= 95 ? 'border-red-500' :
            selectedBin.fill_level >= 80 ? 'border-yellow-500' :
            'border-green-500'
          }`}>
            <div className="text-center">
              <p className="text-3xl font-bold">{Math.round(selectedBin.fill_level)}%</p>
              <p className="text-xs text-gray-500">Remplissage</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Capacité totale</span>
              <span className="font-semibold">{selectedBin.capacity} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volume actuel</span>
              <span className="font-semibold text-red-600">{selectedBin.current_volume} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dernière collecte</span>
              <span className="font-semibold">{selectedBin.last_collection || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-bold mb-4">État des Appareils</h3>
          <div className="space-y-4">
            {/* Microcontrôleur */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Cpu className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Microcontrôleur</p>
                  <p className="text-xs text-gray-600">ESP32 / Arduino</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Connecté</span>
            </div>

            {/* Capteur de remplissage */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <Zap className="text-purple-600" size={20} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Capteur de Remplissage</p>
                  <p className="text-xs text-gray-600">Ultrasons / Infrarouge</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Connecté</span>
            </div>

            {/* Capteur de température */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-transparent rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <Thermometer className="text-orange-600" size={20} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Capteur Température</p>
                  <p className="text-xs text-gray-600">DHT22 / LM35</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Connecté</span>
            </div>

            {/* Module WiFi / Connectivité */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-transparent rounded-lg border border-cyan-200">
              <div className="flex items-center space-x-3">
                <Radio className="text-cyan-600" size={20} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Module Connectivité</p>
                  <p className="text-xs text-gray-600">WiFi / 4G {selectedBin.signal_quality}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Connecté</span>
            </div>

            {/* Batterie */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <Battery className="text-purple-600" size={20} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Batterie</p>
                  <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${selectedBin.battery}%`}}></div>
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold">{Math.round(selectedBin.battery)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-bold mb-4">Localisation GPS</h3>
          <div className="bg-white rounded-lg h-64 mb-4 border overflow-hidden">
            <MapContainer center={[selectedBin.latitude, selectedBin.longitude]} zoom={15} scrollWheelZoom={false} style={{ height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[selectedBin.latitude, selectedBin.longitude]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{selectedBin.location}</p>
                    <p>{selectedBin.address}</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <MapPin className="text-cyan-500 mt-1" size={16} />
              <div>
                <p className="font-semibold">{selectedBin.location}</p>
                <p className="text-sm text-gray-600">{selectedBin.address}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div>
                <p className="text-xs text-gray-600">Latitude</p>
                <p className="font-mono text-sm">{selectedBin.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Longitude</p>
                <p className="font-mono text-sm">{selectedBin.longitude.toFixed(6)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Accès Véhicule */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-bold mb-4">Accès Véhicule de Collecte</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-xs font-semibold text-gray-600 mb-2">{day}</p>
                  <div className={`h-12 rounded flex items-center justify-center ${
                    idx < 5 ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'
                  }`}>
                    <span className="text-xs font-bold">{idx < 5 ? '✓' : '-'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold text-gray-800 mb-2">Derniers accès:</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Vendredi 10 Jan 2026</span>
                  <span className="text-green-600 font-semibold">09:30</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Lundi 6 Jan 2026</span>
                  <span className="text-green-600 font-semibold">10:15</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Jeudi 2 Jan 2026</span>
                  <span className="text-green-600 font-semibold">09:45</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );

  };

  // Page Alertes
  const AlertsPage = () => (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">Gestion des Alertes</h2>
        <p className="text-gray-600">Surveillez et gérez toutes les alertes concernant les poubelles et la collecte</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4 text-center">
            <Bell className="mx-auto mb-2 text-gray-600" size={24} />
            <p className="text-2xl font-bold">{alerts.length}</p>
            <p className="text-sm text-gray-600">Total Alertes</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <AlertTriangle className="mx-auto mb-2 text-red-600" size={24} />
            <p className="text-2xl font-bold text-red-600">{alerts.filter(a => a.type === 'urgent').length}</p>
            <p className="text-sm text-red-700">Urgentes</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <AlertTriangle className="mx-auto mb-2 text-yellow-600" size={24} />
            <p className="text-2xl font-bold text-yellow-600">{alerts.filter(a => a.type === 'important').length}</p>
            <p className="text-sm text-yellow-700">Importantes</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <Bell className="mx-auto mb-2 text-blue-600" size={24} />
            <p className="text-2xl font-bold text-blue-600">{alerts.filter(a => a.type === 'info').length}</p>
            <p className="text-sm text-blue-700">Informations</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="mx-auto mb-2 text-green-600" size={24} />
            <p className="text-2xl font-bold text-green-600">89</p>
            <p className="text-sm text-green-700">Résolues</p>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-4">Alertes Actives</h3>
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <div key={idx} className={`p-4 rounded-lg border-l-4 ${
              alert.type === 'urgent' ? 'bg-red-50 border-red-500' :
              alert.type === 'important' ? 'bg-yellow-50 border-yellow-500' :
              'bg-blue-50 border-blue-500'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3 flex-1">
                  <AlertTriangle className={
                    alert.type === 'urgent' ? 'text-red-500' :
                    alert.type === 'important' ? 'text-yellow-500' :
                    'text-blue-500'
                  } size={24} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        alert.type === 'urgent' ? 'bg-red-500 text-white' :
                        alert.type === 'important' ? 'bg-yellow-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>{alert.type.toUpperCase()}</span>
                      <span className="font-bold">{alert.bin_id}</span>
                      <span className="text-sm text-gray-500">Il y a {Math.floor(Math.random() * 60)} min</span>
                    </div>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-sm text-gray-700">{alert.description}</p>
                    <p className="text-xs text-gray-500 mt-1">📍 {alert.location}</p>
                    {alert.assigned_to && <p className="text-xs text-gray-600 mt-1">👤 Assigné à: {alert.assigned_to}</p>}
                  </div>
                </div>
                <button className={`px-4 py-2 rounded-lg text-white font-semibold ${
                  alert.type === 'urgent' ? 'bg-red-500 hover:bg-red-600' :
                  alert.type === 'important' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  'bg-blue-500 hover:bg-blue-600'
                }`}>
                  {alert.type === 'urgent' ? 'Collecte Urgente' : alert.type === 'important' ? 'Programmer' : 'Voir Détails'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Page Paramètres
  const SettingsPage = () => (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="text-gray-600">Configurez vos préférences de notifications et de compte</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-4">Préférences de Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded">
                  <Bell className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="font-semibold">Notifications Email</p>
                  <p className="text-sm text-gray-600">Recevez les alertes par email</p>
                </div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-full h-full bg-gray-300 peer-checked:bg-cyan-500 rounded-full peer transition-all"></div>
                <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full peer-checked:translate-x-6 transition-all"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Poubelles pleines</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Pannes techniques</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Maintenance programmée</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Rapports hebdomadaires</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4">Paramètres du Compte</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom d'utilisateur</label>
              <input type="text" defaultValue="admin.fianarantsoa" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" defaultValue="admin@smartwaste.mg" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rôle</label>
              <select className="w-full border rounded-lg px-3 py-2">
                <option>Administrateur Système</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fuseau horaire</label>
              <select className="w-full border rounded-lg px-3 py-2">
                <option>GMT+3 (Antananarivo)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold">
            Tester les Notifications
          </button>
          <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold">
            Enregistrer les Modifications
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <NetworkSettings />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentPage === 'home' ? (
          <HomePage />
        ) : currentPage === 'bins' ? (
          <BinsManagementPage
            bins={bins}
            onAddBin={addBin}
            onUpdateBin={updateBin}
            onDeleteBin={deleteBin}
            onViewDetails={(binId) => {
              const bin = bins.find(b => b.bin_id === binId);
              if (bin) {
                setSelectedBin(bin);
                setCurrentPage('bin-detail');
              }
            }}
          />
        ) : currentPage === 'map' ? (
          <MapPage bins={bins} selectedBin={selectedBin} setSelectedBin={setSelectedBin} />
        ) : currentPage === 'bin-detail' && selectedBin ? (
          <BinDetailPageWrapper selectedBin={selectedBin} />
        ) : currentPage === 'alerts' ? (
          <AlertsPage alerts={alerts} onResolveAlert={resolveAlert} onSelectBin={setSelectedBin} onNavigate={setCurrentPage} />
        ) : currentPage === 'reports' ? (
          <ReportsPage bins={bins} collections={collections} statistics={statistics} />
        ) : currentPage === 'users' ? (
          <UserManagementPage />
        ) : currentPage === 'settings' ? (
          <SettingsPage />
        ) : (
          <HomePage />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SmartWasteDashboard;