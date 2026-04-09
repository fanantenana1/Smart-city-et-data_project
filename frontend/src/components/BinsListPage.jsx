import React, { useEffect } from 'react';
import { MapPin, Battery, Wifi, AlertTriangle, ChevronRight, Droplet, Bell } from 'lucide-react';

const BinsListPage = ({ bins, onSelectBin, onViewDetails }) => {
  // Mettre à jour le favicon avec les notifications
  useEffect(() => {
    const criticalCount = bins.filter(b => b.status === 'critical').length;
    const attentionCount = bins.filter(b => b.status === 'attention').length;
    const totalAlerts = criticalCount + attentionCount;
    
    if (totalAlerts > 0) {
      updateFavicon(totalAlerts);
    }
  }, [bins]);

  const updateFavicon = (count) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 64);
    
    // Badge rond
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(50, 14, 14, 0, 2 * Math.PI);
    ctx.fill();
    
    // Texte
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count.toString(), 50, 14);
    
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.rel = 'shortcut icon';
    link.href = canvas.toDataURL();
    document.head.appendChild(link);
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Liste des Poubelles Intelligentes</h1>
        <p className="text-cyan-100">
          Gestion complète des {bins.length} poubelles de Fianarantsoa. 
          Consultez le statut, le niveau de remplissage et les détails de chaque bac.
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Poubelles</p>
              <p className="text-3xl font-bold text-cyan-600">{bins.length}</p>
            </div>
            <div className="text-cyan-200 text-4xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Normales</p>
              <p className="text-3xl font-bold text-green-600">
                {bins.filter(b => b.status === 'normal').length}
              </p>
            </div>
            <div className="text-green-200 text-4xl">🟢</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border relative">
          <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {bins.filter(b => b.status === 'attention').length}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Attention</p>
              <p className="text-3xl font-bold text-yellow-600">
                {bins.filter(b => b.status === 'attention').length}
              </p>
            </div>
            <div className="text-yellow-200 text-4xl">🟡</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border relative">
          <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {bins.filter(b => b.status === 'critical').length}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Critique</p>
              <p className="text-3xl font-bold text-red-600">
                {bins.filter(b => b.status === 'critical').length}
              </p>
            </div>
            <div className="text-red-200 text-4xl">🔴</div>
          </div>
        </div>
      </div>

      {/* Liste des poubelles */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID / Localisation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">État</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Remplissage</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Batterie</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Signal WiFi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Température</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bins.map((bin, index) => (
                <tr key={index} className="hover:bg-gray-50 transition">
                  {/* ID et Localisation */}
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-cyan-100 p-2 rounded-lg">
                        <Droplet className="text-cyan-600" size={20} />
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

                  {/* Remplissage */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">{bin.fill_level.toFixed(1)}%</span>
                        <span className="text-xs text-gray-500">{bin.current_volume}L / {bin.capacity}L</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getFillLevelColor(bin.fill_level)}`}
                          style={{ width: `${Math.min(bin.fill_level, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Batterie */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Battery
                        size={18}
                        className={bin.battery > 50 ? 'text-green-600' : bin.battery > 20 ? 'text-yellow-600' : 'text-red-600'}
                      />
                      <span className="font-semibold">{bin.battery.toFixed(1)}%</span>
                    </div>
                  </td>

                  {/* Signal WiFi */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Wifi size={18} className={getSignalColor(bin.signal_quality)} />
                      <span className="text-sm text-gray-700">{bin.signal_quality}</span>
                    </div>
                  </td>

                  {/* Température */}
                  <td className="px-6 py-4">
                    <span className="font-semibold">{bin.temperature.toFixed(1)}°C</span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onViewDetails(bin.bin_id)}
                      className="inline-flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition font-semibold"
                    >
                      <span>Détails</span>
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message si aucune poubelle */}
      {bins.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border">
          <AlertTriangle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 text-lg">Aucune poubelle disponible</p>
        </div>
      )}

      {/* Légende */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">📋 Légende des États</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Normal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">À 80%+</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Critique 95%+</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Hors ligne</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinsListPage;
