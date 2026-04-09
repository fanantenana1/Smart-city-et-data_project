import React, { useState, useEffect } from 'react';
import { CheckCircle, Trash2, Search, CheckSquare, Square } from 'lucide-react';

const AlertsPage = ({ alerts, onResolveAlert, onDeleteAlert, onSelectBin, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [selectedAlerts, setSelectedAlerts] = useState(new Set());
  const [showMultiDeleteConfirm, setShowMultiDeleteConfirm] = useState(false);

  // Réinitialiser la sélection quand les filtres changent
  useEffect(() => {
    setSelectedAlerts(new Set());
  }, [filterType, filterStatus, searchTerm]);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.bin_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Gestion de la sélection
  const toggleSelectAlert = (index) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedAlerts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.size === filteredAlerts.length) {
      setSelectedAlerts(new Set());
    } else {
      const allIndices = filteredAlerts.map((_, idx) => idx);
      setSelectedAlerts(new Set(allIndices));
    }
  };

  const handleMultipleDelete = async () => {
    if (selectedAlerts.size === 0) return;

    try {
      const indicesToDelete = Array.from(selectedAlerts).map(filteredIndex => {
        const alert = filteredAlerts[filteredIndex];
        return alerts.findIndex(a => 
          a.bin_id === alert.bin_id && 
          a.timestamp === alert.timestamp
        );
      });

      const response = await fetch('http://localhost:8000/api/alerts/delete-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(indicesToDelete),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${result.deleted_count} alerte(s) supprimée(s)`);
        setSelectedAlerts(new Set());
        setShowMultiDeleteConfirm(false);
        window.location.reload();
      } else {
        alert('Erreur lors de la suppression des alertes');
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
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

  return (
    <div className="space-y-6 pb-20">
      {/* En-tête avec statistiques */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Alertes et Notifications</h2>
          <p className="text-gray-600 mt-1">Gérez tous les alertes du système</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-red-500">{alerts.filter(a => a.status === 'active').length}</p>
          <p className="text-sm text-gray-600">Alertes actives</p>
        </div>
      </div>

      {/* Statistiques des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-gray-600 mb-1">Alertes Urgentes</p>
          <p className="text-2xl font-bold text-red-600">{alerts.filter(a => a.type === 'urgent' && a.status === 'active').length}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-sm text-gray-600 mb-1">Alertes Importantes</p>
          <p className="text-2xl font-bold text-yellow-600">{alerts.filter(a => a.type === 'important' && a.status === 'active').length}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Informations</p>
          <p className="text-2xl font-bold text-blue-600">{alerts.filter(a => a.type === 'info' && a.status === 'active').length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Résolues</p>
          <p className="text-2xl font-bold text-green-600">{alerts.filter(a => a.status === 'resolved').length}</p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par ID, titre ou localisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtre par type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Tous les types</option>
            <option value="urgent">Urgents</option>
            <option value="important">Importants</option>
            <option value="info">Informations</option>
          </select>

          {/* Filtre par statut */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="resolved">Résolues</option>
          </select>
        </div>
      </div>

      {/* Modal de confirmation de suppression multiple */}
      {showMultiDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer <span className="font-bold text-red-600">{selectedAlerts.size}</span> alerte(s) sélectionnée(s) ? 
              Cette action est irréversible.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleMultipleDelete}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold flex items-center justify-center space-x-2"
              >
                <Trash2 size={18} />
                <span>Supprimer tout</span>
              </button>
              <button
                onClick={() => setShowMultiDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE SIMPLIFIÉE - EXACTEMENT COMME L'IMAGE */}
      {filteredAlerts.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Titre de la section */}
          <div className="px-6 py-4 border-b bg-white">
            <h3 className="text-2xl font-bold text-blue-900">Alert Actives</h3>
          </div>

          {/* En-tête du tableau - FOND GRIS */}
          <div className="bg-gray-200 border-b-2 border-gray-300">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
              {/* Checkbox vide pour alignement */}
              <div className="col-span-1"></div>
              
              {/* Colonnes */}
              <div className="col-span-3">
                <h4 className="text-xl font-bold text-black">Status</h4>
              </div>
              <div className="col-span-4">
                <h4 className="text-xl font-bold text-black">Poubelle</h4>
              </div>
              <div className="col-span-3">
                <h4 className="text-xl font-bold text-black">Date</h4>
              </div>
              
              {/* Icône de corbeille */}
              <div className="col-span-1 flex justify-center">
                {selectedAlerts.size > 0 ? (
                  <button
                    onClick={() => setShowMultiDeleteConfirm(true)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                    title={`Supprimer ${selectedAlerts.size} alerte(s)`}
                  >
                    <Trash2 size={24} />
                  </button>
                ) : (
                  <Trash2 size={24} className="text-blue-600" />
                )}
              </div>
            </div>
          </div>

          {/* Corps du tableau - LIGNES SIMPLES */}
          <div className="divide-y divide-gray-300">
            {filteredAlerts.map((alert, idx) => (
              <div
                key={alert.id || idx}
                className={`grid grid-cols-12 gap-4 px-6 py-5 items-center transition-all ${
                  selectedAlerts.has(idx) 
                    ? 'bg-blue-50' 
                    : idx % 2 === 0 
                    ? 'bg-gray-50' 
                    : 'bg-white'
                } hover:bg-gray-100 cursor-pointer`}
                onClick={() => {
                  if (onSelectBin && onNavigate && (alert.type === 'urgent' || alert.type === 'important')) {
                    const bin = {
                      bin_id: alert.bin_id,
                      location: alert.location,
                      address: alert.location,
                      fill_level: alert.fill_level || 0,
                      battery: alert.battery || 0,
                      temperature: alert.temperature || 0,
                      signal_quality: alert.signal_quality || 'N/A',
                      latitude: alert.latitude || 0,
                      longitude: alert.longitude || 0,
                      capacity: alert.capacity || 100,
                      current_volume: alert.current_volume || 0,
                      last_collection: alert.last_collection || 'N/A'
                    };
                    onSelectBin(bin);
                    onNavigate('bin-detail');
                  }
                }}
              >
                {/* Checkbox */}
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectAlert(idx);
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition"
                  >
                    {selectedAlerts.has(idx) ? (
                      <CheckSquare size={28} className="text-blue-600" strokeWidth={2.5} />
                    ) : (
                      <Square size={28} className="text-gray-400" strokeWidth={2.5} />
                    )}
                  </button>
                </div>

                {/* Status - Texte coloré simple */}
                <div className="col-span-3">
                  <span className={`text-lg font-bold ${
                    alert.type === 'urgent' 
                      ? 'text-red-600' 
                      : alert.type === 'important'
                      ? 'text-orange-500'
                      : 'text-blue-600'
                  }`}>
                    {alert.type === 'urgent' ? 'Urgent' : alert.type === 'important' ? 'Important' : 'Info'}
                  </span>
                </div>

                {/* Poubelle - ID simple */}
                <div className="col-span-4">
                  <span className="text-xl font-bold text-black">{alert.bin_id}</span>
                </div>

                {/* Date - Format exact */}
                <div className="col-span-3">
                  <span className="text-lg text-gray-700">{formatDate(alert.timestamp)}</span>
                </div>

                {/* Espace vide pour alignement avec l'icône de corbeille */}
                <div className="col-span-1"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center border">
          <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
          <p className="text-gray-600 text-lg font-semibold">Aucune alerte trouvée</p>
          <p className="text-gray-500 text-sm mt-1">Tous les poubelles se portent bien!</p>
        </div>
      )}

      {/* Bouton flottant de suppression */}
      {selectedAlerts.size > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowMultiDeleteConfirm(true)}
            className="flex items-center space-x-3 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-2xl transition-all transform hover:scale-105 font-bold text-lg"
          >
            <Trash2 size={24} />
            <span>Supprimer ({selectedAlerts.size})</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;