import React, { useEffect, useState } from "react";
import { Trash2, Bell, MapPin, CheckCircle, AlertTriangle, TrendingUp, Cpu, Zap, Thermometer, Radio, Battery } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import NetworkSettings from "./NetworkSettings";
import Footer from "./Footer";
import BinsManagementPage from "./BinsManagementPage";
import MapPage from "./MapPage";
import ReportsPage from "./ReportsPage";
import UserManagementPage from "./UserManagementPage";
import { fetchBins, fetchCollections, fetchAlerts, fetchStatistics } from "../api";
import MapPageAutoRouting from './MapPageAutoRouting';
export default function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState('home');
  const [bins, setBins] = useState([]);
  const [collections, setCollections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [selectedBin, setSelectedBin] = useState(null);
  const [user] = useState({ role: 'admin' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [binsRes, collectionsRes, alertsRes, statsRes] = await Promise.all([
        fetchBins(),
        fetchCollections(),
        fetchAlerts(),
        fetchStatistics()
      ]);
      setBins(binsRes.data || []);
      setCollections(collectionsRes.data || []);
      setAlerts(alertsRes.data || []);
      setStatistics(statsRes.data || {});
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const addBin = (bin) => {
    setBins([...bins, bin]);
  };

  const updateBin = (updatedBin) => {
    setBins(bins.map(b => b.bin_id === updatedBin.bin_id ? updatedBin : b));
  };

  const deleteBin = (binId) => {
    setBins(bins.filter(b => b.bin_id !== binId));
  };

  const resolveAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  // Navigation
  const Navigation = () => (
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
            <button onClick={() => setCurrentPage('bins')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'bins' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Poubelles</button>
            <button onClick={() => setCurrentPage('map')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'map' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Carte</button>
            <button onClick={() => setCurrentPage('alerts')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'alerts' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Alertes</button>
            <button onClick={() => setCurrentPage('reports')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'reports' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Rapports</button>
            <button onClick={() => setCurrentPage('exports')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'exports' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}>Exports</button>
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
          <button onClick={() => setCurrentPage('reports')} className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold">Rapports</button>
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
  const [selectedAlerts, setSelectedAlerts] = useState(new Set());
  const [showMultiDeleteConfirm, setShowMultiDeleteConfirm] = useState(false);

  const toggleSelectAlert = (index) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedAlerts(newSelected);
  };

  const handleMultipleDelete = async () => {
    if (selectedAlerts.size === 0) return;
    try {
      const indicesToDelete = Array.from(selectedAlerts);
      const response = await fetch('http://localhost:8000/api/alerts/delete-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(indicesToDelete),
      });
      if (response.ok) {
        setSelectedAlerts(new Set());
        setShowMultiDeleteConfirm(false);
        loadData();
      } else {
        alert('Erreur lors de la suppression des alertes');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur réseau lors de la suppression');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  const AlertsPage = () => {
    const activeAlerts = alerts.filter(a => a.status === 'active');
    return (
      <div className="space-y-6 pb-20">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border rounded-lg p-4 text-center">
            {/*<Bell className="mx-auto mb-2 text-gray-600" size={24} />*/}
            <p className="text-2xl font-bold">{alerts.length}</p>
            <p className="text-sm text-gray-600">Total Alertes</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            {/*<AlertTriangle className="mx-auto mb-2 text-red-600" size={24} />*/}
            <p className="text-2xl font-bold text-red-600">{alerts.filter(a => a.type === 'urgent').length}</p>
            <p className="text-sm text-red-700">Urgentes</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            {/*<AlertTriangle className="mx-auto mb-2 text-yellow-600" size={24} />*/}
            <p className="text-2xl font-bold text-yellow-600">{alerts.filter(a => a.type === 'important').length}</p>
            <p className="text-sm text-yellow-700">Importantes</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            {/*<Bell className="mx-auto mb-2 text-blue-600" size={24} />*/}
            <p className="text-2xl font-bold text-blue-600">{alerts.filter(a => a.type === 'info').length}</p>
            <p className="text-sm text-blue-700">Informations</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            {/*<CheckCircle className="mx-auto mb-2 text-green-600" size={24} />*/}
            <p className="text-2xl font-bold text-green-600">{alerts.filter(a => a.status === 'resolved').length}</p>
            <p className="text-sm text-green-700">Résolues</p>
          </div>
        </div>

        {/* Modal de suppression */}
        {showMultiDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold">Confirmer la suppression</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Supprimer <span className="font-bold text-red-600">{selectedAlerts.size}</span> alerte(s) ?
              </p>
              <div className="flex space-x-3">
                <button onClick={handleMultipleDelete} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">
                  Supprimer
                </button>
                <button onClick={() => setShowMultiDeleteConfirm(false)} className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tableau simplifié */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-white">
            <h3 className="text-2xl font-bold text-blue-900">Alert Actives</h3>
          </div>

          {/* En-tête tableau */}
          <div className="bg-gray-200 border-b-2 border-gray-300">
            <div className="grid grid-cols-12 gap-4 px-2 py-4 items-center">
              <div className="col-span-1"></div>
              <div className="col-span-3"><h4 className="text-xl font-bold text-black">Status</h4></div>
              <div className="col-span-4"><h4 className="text-xl font-bold text-black">Poubelle</h4></div>
              <div className="col-span-3"><h4 className="text-xl font-bold text-black">Date</h4></div>
              <div className="col-span-1 flex justify-center">
                {selectedAlerts.size > 0 ? (
                  <button onClick={() => setShowMultiDeleteConfirm(true)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    <Trash2 size={24} />
                  </button>
                ) : (
                  <Trash2 size={24} className="text-blue-600" />
                )}
              </div>
            </div>
          </div>

          {/* Lignes */}
          <div className="divide-y divide-gray-300">
            {activeAlerts.map((alert, idx) => (
              <div key={idx} className={`grid grid-cols-12 gap-4 px-6 py-5 items-center transition-all ${
                selectedAlerts.has(idx) ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              } hover:bg-gray-100 cursor-pointer`}>
                <div className="col-span-1 flex justify-center">
                  <button onClick={(e) => { e.stopPropagation(); toggleSelectAlert(idx); }} className="p-1 hover:bg-gray-200 rounded">
                    {selectedAlerts.has(idx) ? (
                      <CheckCircle size={28} className="text-blue-600" strokeWidth={2.5} />
                    ) : (
                      <div className="w-7 h-7 border-2 border-gray-400 rounded"></div>
                    )}
                  </button>
                </div>
                <div className="col-span-3">
                  <span className={`text-lg font-bold ${
                    alert.type === 'urgent' ? 'text-red-600' : alert.type === 'important' ? 'text-orange-500' : 'text-blue-600'
                  }`}>
                    {alert.type === 'urgent' ? 'Urgent' : alert.type === 'important' ? 'Important' : 'Info'}
                  </span>
                </div>
                <div className="col-span-4">
                  <span className="text-xl font-bold text-black">{alert.bin_id}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-lg text-gray-700">{formatDate(alert.timestamp)}</span>
                </div>
                <div className="col-span-1"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton flottant */}
        {selectedAlerts.size > 0 && (
          <div className="fixed bottom-6 right-6 z-40">
            <button onClick={() => setShowMultiDeleteConfirm(true)} className="flex items-center space-x-3 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-2xl">
              <Trash2 size={24} />
              <span className="font-bold text-lg">Supprimer ({selectedAlerts.size})</span>
            </button>
          </div>
        )}
      </div>
    );
  };

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

  // Page Exports
  const ExportsPage = () => {
    const [exporting, setExporting] = useState({});
    const [exportStatus, setExportStatus] = useState({});

    const handleExport = async (endpoint, format) => {
      setExporting(prev => ({ ...prev, [format]: true }));
      setExportStatus(prev => ({ ...prev, [format]: 'En cours...' }));

      try {
        const token = localStorage.getItem('sw_token');
        const response = await fetch(`http://localhost:8000${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `export_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          setExportStatus(prev => ({ ...prev, [format]: 'Téléchargé avec succès' }));
        } else {
          setExportStatus(prev => ({ ...prev, [format]: 'Erreur lors du téléchargement' }));
        }
      } catch (error) {
        console.error('Erreur export:', error);
        setExportStatus(prev => ({ ...prev, [format]: 'Erreur réseau' }));
      } finally {
        setExporting(prev => ({ ...prev, [format]: false }));
      }
    };

    const exportOptions = [
      {
        title: 'Export Complet JSON',
        description: 'Toutes les données du système (poubelles, historiques, prédictions, utilisateurs)',
        endpoint: '/api/export/json',
        format: 'json',
        icon: '',
        color: 'bg-blue-500 hover:bg-blue-600'
      },
      {
        title: 'Export Poubelles CSV',
        description: 'Liste complète des poubelles avec leurs caractéristiques',
        endpoint: '/api/export/csv/poubelles',
        format: 'poubelles.csv',
        icon: '',
        color: 'bg-green-500 hover:bg-green-600'
      },
      {
        title: 'Export Historiques CSV',
        description: 'Historique complet des collectes et interventions',
        endpoint: '/api/export/csv/historiques',
        format: 'historiques.csv',
        icon: '',
        color: 'bg-purple-500 hover:bg-purple-600'
      },
      {
        title: 'Export Prédictions CSV',
        description: 'Prédictions de remplissage et recommandations de collecte',
        endpoint: '/api/export/csv/predictions',
        format: 'predictions.csv',
        icon: '',
        color: 'bg-orange-500 hover:bg-orange-600'
      },
      {
        title: 'Export Utilisateurs CSV',
        description: 'Liste des utilisateurs et leurs permissions',
        endpoint: '/api/export/csv/utilisateurs',
        format: 'utilisateurs.csv',
        icon: '',
        color: 'bg-cyan-500 hover:bg-cyan-600'
      },
      {
        title: 'Export SQLite',
        description: 'Base de données complète au format SQLite',
        endpoint: '/api/export/sqlite',
        format: 'sqlite',
        icon: '',
        color: 'bg-indigo-500 hover:bg-indigo-600'
      },
      {
        title: 'Export SQL Dump',
        description: 'Script SQL pour recréer la base de données',
        endpoint: '/api/export/sql-dump',
        format: 'sql',
        icon: '',
        color: 'bg-red-500 hover:bg-red-600'
      },
      {
        title: 'Export Excel',
        description: 'Classeur Excel avec toutes les données organisées',
        endpoint: '/api/export/excel',
        format: 'xlsx',
        icon: '',
        color: 'bg-emerald-500 hover:bg-emerald-600'
      }
    ];

    return (
      <div className="space-y-6 pb-20">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <TrendingUp className="text-emerald-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exports de Données</h1>
              <p className="text-gray-600">Téléchargez vos données SmartWaste dans différents formats</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-blue-600" size={20} />
                <span className="font-semibold text-blue-800">Données en temps réel</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">Toutes les données sont à jour</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={20} />
                <span className="font-semibold text-green-800">Formats multiples</span>
              </div>
              <p className="text-sm text-green-600 mt-1">JSON, CSV, Excel, SQLite, SQL</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-purple-600" size={20} />
                <span className="font-semibold text-purple-800">Sécurisé</span>
              </div>
              <p className="text-sm text-purple-600 mt-1">Authentification requise</p>
            </div>
          </div>
        </div>

        {/* Options d'export */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exportOptions.map((option, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleExport(option.endpoint, option.format)}
                    disabled={exporting[option.format]}
                    className={`w-full ${option.color} text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                  >
                    {exporting[option.format] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Export en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Télécharger</span>
                      </>
                    )}
                  </button>

                  {exportStatus[option.format] && (
                    <div className={`text-sm text-center p-2 rounded ${
                      exportStatus[option.format].includes('') ? 'bg-green-50 text-green-700' :
                      exportStatus[option.format].includes('') ? 'bg-red-50 text-red-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {exportStatus[option.format]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section d'information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold mb-4">ℹ Informations sur les Exports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Formats Disponibles</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>JSON:</strong> Format structuré pour les développeurs</li>
                <li><strong>CSV:</strong> Format tableur compatible Excel/LibreOffice</li>
                <li><strong>Excel:</strong> Classeur avec feuilles organisées</li>
                <li><strong>SQLite:</strong> Base de données portable</li>
                <li><strong>SQL Dump:</strong> Script pour recréer la base</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Utilisation Recommandée</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Analyse:</strong> Excel ou CSV pour les rapports</li>
                <li><strong>Sauvegarde:</strong> JSON ou SQLite</li>
                <li><strong>Migration:</strong> SQL Dump</li>
                <li><strong>Développement:</strong> JSON pour l'intégration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        ) : currentPage === 'exports' ? (
          <ExportsPage />
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