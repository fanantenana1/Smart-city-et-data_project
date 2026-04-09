import React, { useState, useEffect } from 'react';
import { Settings, Wifi, Globe, Copy, CheckCircle } from 'lucide-react';
import { getConfiguredIP, setLocalIP, DEBUG_CONFIG } from '../config';

const NetworkSettings = () => {
  const [localIP, setLocalIPLocal] = useState('');
  const [inputIP, setInputIP] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setLocalIPLocal(getConfiguredIP() || DEBUG_CONFIG.localIP || 'localhost');
  }, []);

  const handleSetIP = () => {
    if (inputIP.trim()) {
      setLocalIP(inputIP.trim());
      setInputIP('');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Bouton flottant d'accès aux paramètres */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-cyan-500 to-teal-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-110 z-40"
        title="Paramètres réseau"
      >
        <Wifi size={24} />
      </button>

      {/* Modal des paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <Settings size={28} className="text-cyan-500" />
                <span>Paramètres Réseau</span>
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Information IP actuelle */}
            <div className="mb-6 p-4 bg-cyan-50 rounded-xl border border-cyan-200">
              <p className="text-sm text-gray-600 mb-2">🌐 Adresse IP Locale Actuelle:</p>
              <div className="flex items-center justify-between gap-2">
                <code className="bg-gray-800 text-cyan-300 px-3 py-2 rounded font-mono text-sm flex-1 break-all">
                  {localIP}
                </code>
                <button
                  onClick={() => copyToClipboard(`http://${localIP}:8000`)}
                  className="bg-cyan-500 text-white p-2 rounded-lg hover:bg-cyan-600 transition"
                  title="Copier l'URL"
                >
                  {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            {/* Formulaire pour définir l'IP */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Définir une nouvelle adresse IP:
              </label>
              <input
                type="text"
                value={inputIP}
                onChange={(e) => setInputIP(e.target.value)}
                placeholder="Ex: 10.35.197.194"
                className="w-full border-2 border-gray-300 rounded-lg p-3 font-mono text-sm focus:border-cyan-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSetIP()}
              />
              <button
                onClick={handleSetIP}
                className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
              >
                Appliquer
              </button>
            </div>

            {/* Informations de débogge */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-3">🔧 Informations de Débogge:</p>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-600">Port API:</span>
                  <span className="text-gray-800">{DEBUG_CONFIG.apiPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base URL:</span>
                  <span className="text-gray-800 break-all">{DEBUG_CONFIG.baseURL}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-800 font-semibold mb-2">💡 Instructions:</p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Utilisez l'IP locale de votre PC (ex: 10.35.197.194)</li>
                <li>Le serveur doit écouter sur la même IP</li>
                <li>L'ESP32 doit être sur le même réseau WiFi</li>
                <li>Cliquez sur "Appliquer" pour recharger l'application</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkSettings;
