import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, Check, MapPin, Battery, Wifi, AlertTriangle, ChevronRight, Droplet, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { fetchUsers } from '../api';
const BinsManagementPage = ({ bins, onAddBin, onUpdateBin, onDeleteBin, onViewDetails }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBin, setEditingBin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [realTimeBins, setRealTimeBins] = useState({});
  const [previousBins, setPreviousBins] = useState({});
  const wsRef = useRef(null);
  const [formData, setFormData] = useState({
    bin_id: '',
    location: '',
    address: '',
    capacity: 240,
    latitude: -21.4531,
    longitude: 47.0856,
    fill_level: 0,
    battery: 100,
    temperature: 25,
    signal_quality: 'Excellent',
    status: 'normal'
  });
  const API_URL = 'http://localhost:8000/api';
  useEffect(() => {
    loadUsers();
    setupWebSocket();
    startPolling();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  // Configuration WebSocket pour mises à jour temps réel
  const setupWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;
      ws.onopen = () => {
        console.log('WebSocket connecté - Temps réel activé');
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'bin_update' && message.data) {
            const binId = message.data.bin_id;
            console.log(`Mise à jour temps réel: ${binId}`, message.data);
            // Sauvegarder données précédentes
            setPreviousBins(prev => ({
              ...prev,
              [binId]: realTimeBins[binId] || message.data
            }));
            // Mettre à jour avec nouvelles données
            setRealTimeBins(prev => ({
              ...prev,
              [binId]: message.data
            }));
          }
        } catch (err) {
          console.error('Erreur parsing WebSocket:', err);
        }
      };
      ws.onerror = (error) => {
        console.warn('WebSocket error:', error);
      };
      ws.onclose = () => {
        console.log('WebSocket déconnecté - Reconnexion dans 5s...');
        setTimeout(setupWebSocket, 5000);
      };
    } catch (err) {
      console.warn('WebSocket non disponible:', err);
    }
  };
  // Polling régulier pour synchroniser avec MongoDB
  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/bins`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          const binsMap = {};
          data.forEach(bin => {
            binsMap[bin.bin_id] = bin;
          });
          setRealTimeBins(binsMap);
        }
      } catch (err) {
        console.error('Erreur polling:', err);
      }
    }, 5000); // Polling toutes les 5 secondes
    return () => clearInterval(interval);
  };
  const loadUsers = async () => {
    try {
      const response = await fetchUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
    }
  };
  const getAssignedUser = (binId) => {
    for (const user of users) {
      if (user.assigned_bins && user.assigned_bins.includes(binId)) {
        return user;
      }
    }
    return null;
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'attention':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };
  const getStatusLabel = (status) => {
    switch (status) {
      case 'critical':
        return '🔴 Critique';
      case 'attention':
        return '🟡 Attention';
      case 'offline':
        return '⚫ Hors ligne';
      default:
        return '🟢 Normal';
    }
  };
  const getSignalColor = (signalQuality) => {
    if (!signalQuality) return 'text-gray-500';
    if (signalQuality.includes('Excellent')) return 'text-green-600';
    if (signalQuality.includes('Bon')) return 'text-blue-600';
    if (signalQuality.includes('Moyen')) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getFillLevelColor = (fillLevel) => {
    if (fillLevel >= 95) return 'bg-red-500';
    if (fillLevel >= 80) return 'bg-yellow-500';
    if (fillLevel >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };
  // Fonction pour obtenir la tendance
  const getTrend = (binId, field) => {
    const current = realTimeBins[binId]?.[field];
    const previous = previousBins[binId]?.[field];
    if (!current || !previous) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };
  // Icône de tendance
  const TrendIcon = ({ binId, field }) => {
    const trend = getTrend(binId, field);
    if (trend === 'up') return <TrendingUp size={14} className="text-red-500 ml-1" />;
    if (trend === 'down') return <TrendingDown size={14} className="text-green-500 ml-1" />;
    return <Minus size={14} className="text-gray-400 ml-1" />;
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: isNaN(value) ? value : parseFloat(value)
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!formData.bin_id || !formData.location) {
      setError('Veuillez remplir les champs obligatoires');
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem('sw_token');
      if (editingBin) {
        const response = await fetch(`${API_URL}/bin/${editingBin}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la mise à jour');
        }
        const result = await response.json();
        onUpdateBin(editingBin, formData);
        alert(result.message || 'Poubelle mise à jour avec succès!');
      } else {
        const response = await fetch(`${API_URL}/bins`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la création');
        }
        const result = await response.json();
        onAddBin(formData);
        alert(result.message || 'Poubelle créée avec succès!');
      }
      resetForm();
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setFormData({
      bin_id: '',
      location: '',
      address: '',
      capacity: 240,
      latitude: -21.4531,
      longitude: 47.0856,
      fill_level: 0,
      battery: 100,
      temperature: 25,
      signal_quality: 'Excellent',
      status: 'normal'
    });
    setEditingBin(null);
    setShowForm(false);
    setError(null);
  };
  const handleEdit = (bin) => {
    setFormData(bin);
    setEditingBin(bin.bin_id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };
  const handleDelete = async (binId) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${binId}?`)) {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('sw_token');
        const response = await fetch(`${API_URL}/bin/${binId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la suppression');
        }
        const result = await response.json();
        onDeleteBin(binId);
        alert(result.message || 'Poubelle supprimée avec succès!');
      } catch (err) {
        setError(`Erreur: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };
  // Combiner les données des props avec les données temps réel
  const getCombinedBinData = () => {
    return bins.map(bin => {
      const realtimeData = realTimeBins[bin.bin_id];
      return realtimeData || bin;
    });
  };
  // Trier les poubelles par ordre décroissant de remplissage (le plus plein en premier)
  const getSortedBins = () => {
    const combined = getCombinedBinData();
    return combined.sort((a, b) => {
      // Trier par fill_level décroissant (100% → 0%)
      const fillA = parseFloat(a.fill_level) || 0;
      const fillB = parseFloat(b.fill_level) || 0;
      return fillB - fillA; // Ordre décroissant
    });
  };
  const combinedBins = getSortedBins();
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              Gestion des Poubelles
              <span className="ml-3 flex items-center text-sm bg-white/20 px-3 py-1 rounded-full">
                <Activity size={16} className="mr-1 animate-pulse" />
                TEMPS RÉEL
              </span>
            </h1>
            <p className="text-cyan-100">
              Gestion complète des {combinedBins.length} poubelles de Fianarantsoa. 
              Les valeurs se mettent à jour automatiquement depuis les ESP32.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-cyan-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition"
          >
            <Plus size={20} />
            <span>Ajouter</span>
          </button>
        </div>
      </div>
      {/* Indicateur WebSocket */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${wsRef.current?.readyState === WebSocket.OPEN ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {wsRef.current?.readyState === WebSocket.OPEN ? '🔴 EN DIRECT - Données ESP32' : '⚫ Déconnecté'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingDown className="text-blue-600" size={16} />
              <span className="text-xs font-semibold text-blue-800">TRI AUTOMATIQUE : Plus plein → Moins plein</span>
            </div>
            <p className="text-xs text-gray-500">
              Les valeurs des potentiomètres ESP32 s'affichent en temps réel
            </p>
          </div>
        </div>
      </div>
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Poubelles</p>
              <p className="text-3xl font-bold text-cyan-600">{combinedBins.length}</p>
            </div>
            <div className="text-cyan-200 text-4xl">📊</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Normales</p>
              <p className="text-3xl font-bold text-green-600">
                {combinedBins.filter(b => b.status === 'normal').length}
              </p>
            </div>
            <div className="text-green-200 text-4xl">🟢</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Attention</p>
              <p className="text-3xl font-bold text-yellow-600">
                {combinedBins.filter(b => b.status === 'attention').length}
              </p>
            </div>
            <div className="text-yellow-200 text-4xl">🟡</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Critique</p>
              <p className="text-3xl font-bold text-red-600">
                {combinedBins.filter(b => b.status === 'critical').length}
              </p>
            </div>
            <div className="text-red-200 text-4xl">🔴</div>
          </div>
        </div>
      </div>
      {/* Formulaire Ajouter/Éditer - INCHANGÉ */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border p-8 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingBin ? 'Modifier la Poubelle' : 'Nouvelle Poubelle'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Poubelle *
                </label>
                <input
                  type="text"
                  name="bin_id"
                  value={formData.bin_id}
                  onChange={handleInputChange}
                  placeholder="ex: PBL-1"
                  disabled={editingBin !== null}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Localisation *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="ex: Avenue de l'Indépendance"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Adresse complète"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Capacité (Litres)
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Remplissage (%)
                </label>
                <input
                  type="number"
                  name="fill_level"
                  min="0"
                  max="100"
                  value={formData.fill_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Batterie (%)
                </label>
                <input
                  type="number"
                  name="battery"
                  min="0"
                  max="100"
                  value={formData.battery}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Température (°C)
                </label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Signal WiFi
                </label>
                <select
                  name="signal_quality"
                  value={formData.signal_quality}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option>Excellent</option>
                  <option>Bon</option>
                  <option>Moyen</option>
                  <option>Faible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="attention">Attention</option>
                  <option value="critical">Critique</option>
                  <option value="offline">Hors ligne</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold flex items-center space-x-2 transition disabled:opacity-50"
              >
                <Check size={18} />
                <span>{editingBin ? 'Mettre à jour' : 'Créer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Liste des poubelles AVEC TEMPS RÉEL */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {combinedBins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID / Localisation</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">État</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Remplissage
                    <span className="ml-1 text-xs text-blue-500">(POT1)</span>
                    <TrendingDown size={12} className="inline ml-1 text-blue-600" title="Trié du plus plein au moins plein" />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Batterie
                    <span className="ml-1 text-xs text-purple-500">(POT2)</span>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Température
                    <span className="ml-1 text-xs text-orange-500">(POT3)</span>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Signal WiFi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Utilisateur assigné</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {combinedBins.map((bin, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    {/* Position dans le classement */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-red-100 text-red-700' :
                          index === 1 ? 'bg-orange-100 text-orange-700' :
                          index === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                    </td>
                    {/* ID et Localisation */}
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-cyan-100 p-2 rounded-lg relative">
                          <Droplet className="text-cyan-600" size={20} />
                          {realTimeBins[bin.bin_id] && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{bin.bin_id}</p>
                          <div className="flex items-center text-gray-600 text-sm mt-1">
                            <MapPin size={14} className="mr-1" />
                            {bin.location}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{bin.address}</p>
                        </div>
                      </div>
                    </td>
                    {/* État */}
                    <td className="px-6 py-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(bin.status)}`}>
                        {getStatusLabel(bin.status)}
                      </span>
                    </td>
                    {/* Remplissage AVEC TENDANCE */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm font-semibold text-gray-700">
                              {bin.fill_level.toFixed(1)}%
                            </span>
                            <TrendIcon binId={bin.bin_id} field="fill_level" />
                          </div>
                          <span className="text-xs text-gray-500">{bin.current_volume || 0}L / {bin.capacity}L</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${getFillLevelColor(bin.fill_level)}`}
                            style={{ width: `${Math.min(bin.fill_level, 100)}%` }}
                          >
                            {realTimeBins[bin.bin_id] && (
                              <div className="h-full w-full animate-pulse opacity-30 bg-white"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Batterie AVEC TENDANCE */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Battery
                          size={18}
                          className={bin.battery > 50 ? 'text-green-600' : bin.battery > 20 ? 'text-yellow-600' : 'text-red-600'}
                        />
                        <span className="font-semibold">{bin.battery.toFixed(1)}%</span>
                        <TrendIcon binId={bin.bin_id} field="battery" />
                      </div>
                    </td>
                    {/* Température AVEC TENDANCE */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="font-semibold">{bin.temperature.toFixed(1)}°C</span>
                        <TrendIcon binId={bin.bin_id} field="temperature" />
                      </div>
                    </td>
                    {/* Signal WiFi */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Wifi size={18} className={getSignalColor(bin.signal_quality)} />
                        <span className="text-sm text-gray-700">{bin.signal_quality}</span>
                      </div>
                    </td>
                    {/* Utilisateur assigné */}
                    <td className="px-6 py-4">
                      {(() => {
                        const assignedUser = getAssignedUser(bin.bin_id);
                        return assignedUser ? (
                          <div>
                            <p className="font-medium text-gray-800">{assignedUser.full_name || assignedUser.username}</p>
                            <p className="text-sm text-gray-500">@{assignedUser.username}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Non assigné</span>
                        );
                      })()}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => onViewDetails(bin.bin_id)}
                          className="text-cyan-600 hover:bg-cyan-100 p-2 rounded-lg transition flex items-center justify-center font-semibold text-sm"
                          title="Voir les détails"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(bin)}
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition flex items-center justify-center font-semibold text-sm"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(bin.bin_id)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition flex items-center justify-center font-semibold text-sm"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <AlertTriangle className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 text-lg mb-4">Aucune poubelle disponible</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Plus size={20} />
              <span>Créer la première poubelle</span>
            </button>
          </div>
        )}
      </div>
      {/* Instructions ESP32 */}
<div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
  <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
    <Activity className="mr-2" size={20} />
    Contrôle ESP32 - Capteurs Ultrason
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Niveau du bac */}
    <div className="bg-white rounded-lg p-4 border border-blue-100">
      <p className="font-semibold text-blue-800 mb-2 flex items-center">
        Niveau du bac
        <TrendingUp size={14} className="ml-2 text-red-500" />
      </p>
      <p className="text-sm text-gray-600">
        Mesure via capteur ultrason (GPIO 34/35) → Distance convertie en %
      </p>
      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
        &gt;95% = Alerte critique + Email
      </div>
    </div>

    {/* Température ambiante */}
    <div className="bg-white rounded-lg p-4 border border-blue-100">
      <p className="font-semibold text-orange-800 mb-2 flex items-center">
        Température
        <Minus size={14} className="ml-2 text-gray-400" />
      </p>
      <p className="text-sm text-gray-600">
        Mesure via capteur DHT22/DS18B20 (GPIO 32) → 10-50°C
      </p>
      <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-800">
        ℹSurveillance température ambiante
      </div>
    </div>
  </div>

  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
    <p className="text-sm text-green-800">
      <strong>Temps réel activé :</strong> Les valeurs se mettent à jour automatiquement toutes les 3 secondes depuis vos ESP32.
      Les flèches indiquent si la valeur augmente ⬆ou diminue ⬇.
    </p>
  </div>
</div>

      {/* Légende */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">Légende des États</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Normal (&lt;80%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Attention (80-94%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Critique (≥95%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700">Mise à jour temps réel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BinsManagementPage;