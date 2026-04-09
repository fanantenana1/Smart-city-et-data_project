import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Check, MapPin, Battery, Wifi, Thermometer } from 'lucide-react';
const BinsCrudPage = ({ bins, onAddBin, onUpdateBin, onDeleteBin }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBin, setEditingBin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
      if (editingBin) {
        // Mise à jour
        const token = localStorage.getItem('sw_token');
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
        // Création
        const token = localStorage.getItem('sw_token');
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
  const getStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'attention':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };
  const getStatusLabel = (status) => {
    switch (status) {
      case 'critical':
        return '🔴 Critique';
      case 'attention':
        return '🟡 Attention';
      default:
        return '🟢 Normal';
    }
  };
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestion des Poubelles</h1>
            <p className="text-cyan-100">
              Ajoutez, modifiez ou supprimez les poubelles de Fianarantsoa ({bins.length} poubelles)
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
      {/* Formulaire Ajouter/Éditer */}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID Poubelle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Poubelle *
                </label>
                <input
                  type="text"
                  name="bin_id"
                  value={formData.bin_id}
                  onChange={handleInputChange}
                  placeholder="ex: BIN-047"
                  disabled={editingBin !== null}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100"
                  required
                />
              </div>
              {/* Localisation */}
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
              {/* Adresse */}
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
              {/* Capacité */}
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
              {/* Remplissage */}
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
              {/* Batterie */}
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
              {/* Température */}
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
              {/* Signal WiFi */}
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
              {/* Latitude */}
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
              {/* Longitude */}
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
              {/* Statut */}
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
            {/* Boutons */}
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
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold flex items-center space-x-2 transition"
              >
                <Check size={18} />
                <span>{editingBin ? 'Mettre à jour' : 'Créer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Liste des poubelles */}
      {bins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bins.map((bin) => (
            <div
              key={bin.bin_id}
              className={`rounded-xl p-6 border shadow-sm hover:shadow-md transition ${getStatusColor(bin.status)}`}
            >
              {/* En-tête carte */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{bin.bin_id}</h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin size={14} className="mr-1" />
                    {bin.location}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(bin.status)}`}>
                  {getStatusLabel(bin.status)}
                </span>
              </div>
              {/* Adresse */}
              <p className="text-xs text-gray-600 mb-4">{bin.address}</p>
              {/* Informations */}
              <div className="space-y-3 mb-4">
                {/* Remplissage */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">Remplissage</span>
                    <span>{bin.fill_level.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${Math.min(bin.fill_level, 100)}%` }}
                    ></div>
                  </div>
                </div>
                {/* Batterie */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold flex items-center">
                    <Battery size={14} className="mr-1" />
                    Batterie
                  </span>
                  <span>{bin.battery.toFixed(1)}%</span>
                </div>
                {/* Température */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold flex items-center">
                    <Thermometer size={14} className="mr-1" />
                    Température
                  </span>
                  <span>{bin.temperature.toFixed(1)}°C</span>
                </div>
                {/* Signal */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold flex items-center">
                    <Wifi size={14} className="mr-1" />
                    Signal
                  </span>
                  <span className="text-xs">{bin.signal_quality}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(bin)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-1 transition"
                >
                  <Edit size={16} />
                  <span>Éditer</span>
                </button>
                <button
                  onClick={() => handleDelete(bin.bin_id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-1 transition"
                >
                  <Trash2 size={16} />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center border">
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
  );
};
export default BinsCrudPage;y