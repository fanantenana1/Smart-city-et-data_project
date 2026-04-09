import React, { useState, useEffect } from 'react';
import { Trash2, Battery, Thermometer, Wifi, MapPin, Clock, User, TrendingUp } from 'lucide-react';

const BinDetailPage = ({ bins, selectedBin, onBack }) => {
  const [bin, setBin] = useState(selectedBin);

  if (!bin) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-gray-600">Sélectionnez une poubelle pour voir les détails</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
          ← Retour
        </button>
        <h2 className="text-3xl font-bold">{bin.bin_id}</h2>
        <span className={`px-4 py-2 rounded-full text-white text-sm font-semibold ${
          bin.fill_level >= 95 ? 'bg-red-500' : bin.fill_level >= 80 ? 'bg-yellow-500' : 'bg-green-500'
        }`}>
          {bin.fill_level >= 95 ? 'Critique' : bin.fill_level >= 80 ? 'Attention' : 'Normal'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations de localisation */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
            <MapPin className="text-cyan-500" />
            <span>Localisation</span>
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Emplacement</p>
              <p className="font-semibold text-gray-800">{bin.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Adresse</p>
              <p className="font-semibold text-gray-800">{bin.address}</p>
            </div>
            <div className="pt-3 border-t space-y-2">
              <p className="text-sm text-gray-600">Coordonnées GPS</p>
              <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                <p>Lat: {bin.latitude.toFixed(6)}</p>
                <p>Lon: {bin.longitude.toFixed(6)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* État actuel */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-bold mb-4">État Actuel</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
              <p className="text-sm text-gray-600 mb-1">Taux de Remplissage</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold text-cyan-600">{bin.fill_level}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    bin.fill_level >= 95 ? 'bg-red-500' : bin.fill_level >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${bin.fill_level}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-2">{bin.current_volume} / {bin.capacity} litres</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-gray-600">Batterie</p>
                <p className="text-xl font-bold text-blue-600">{bin.battery}%</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                <p className="text-xs text-gray-600">Température</p>
                <p className="text-xl font-bold text-orange-600">{bin.temperature}°C</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-xs text-gray-600">Capacité</p>
                <p className="text-xl font-bold text-green-600">{bin.capacity}L</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Données techniques détaillées */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold mb-4">Données Techniques (ESP32)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 mb-2 flex items-center space-x-1">
              <Wifi size={16} />
              <span>Signal WiFi</span>
            </p>
            <p className="font-semibold text-purple-700">{bin.signal_quality}</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-2 flex items-center space-x-1">
              <Battery size={16} />
              <span>État Batterie</span>
            </p>
            <p className="font-semibold text-blue-700">
              {bin.battery >= 80 ? '✓ Bon' : bin.battery >= 50 ? '△ Moyen' : '✗ Faible'}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-2 flex items-center space-x-1">
              <Thermometer size={16} />
              <span>Température Capteur</span>
            </p>
            <p className="font-semibold text-red-700">{bin.temperature.toFixed(1)}°C</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-2 flex items-center space-x-1">
              <Clock size={16} />
              <span>Dernière Mise à Jour</span>
            </p>
            <p className="font-semibold text-green-700">À l'instant</p>
          </div>
        </div>
      </div>

      {/* Historique des collectes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold mb-4">Historique des Collectes</h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">Dernière collecte</p>
                <p className="text-sm text-gray-600">{bin.last_collection || 'N/A'}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">Complétée</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-semibold flex items-center justify-center space-x-2">
          <span>✓</span>
          <span>Marquer comme Collectée</span>
        </button>
        <button className="bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center justify-center space-x-2">
          <span>📍</span>
          <span>Voir sur la Carte</span>
        </button>
        <button className="bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold flex items-center justify-center space-x-2">
          <span>⚠️</span>
          <span>Signaler un Problème</span>
        </button>
      </div>
    </div>
  );
};

export default BinDetailPage;
