import React, { useState } from 'react';
import { Settings, Bell, Shield, Users, Wifi, Database, Save, RotateCcw, AlertTriangle } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    alertLevel: 'medium',
    emailNotifications: true,
    pushNotifications: true,
    autoCollect: false,
    criticalThreshold: 95,
    warningThreshold: 80,
    updateInterval: 5,
    timezone: 'Africa/Antananarivo',
    language: 'fr'
  });

  const [saved, setSaved] = useState(false);

  const handleSaveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold flex items-center space-x-3">
          <Settings size={32} className="text-cyan-500" />
          <span>Paramètres du Système</span>
        </h2>
      </div>

      {/* Notification de sauvegarde */}
      {saved && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <span>✓</span>
          <span>Paramètres sauvegardés avec succès</span>
        </div>
      )}

      {/* Préférences de Notifications */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <Bell className="text-blue-500" />
          <span>Notifications et Alertes</span>
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <p className="font-semibold">Notifications Email</p>
              <p className="text-sm text-gray-600">Recevoir les alertes par email</p>
            </div>
            <input 
              type="checkbox" 
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
              className="w-6 h-6 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <p className="font-semibold">Notifications Push</p>
              <p className="text-sm text-gray-600">Notifications en temps réel du navigateur</p>
            </div>
            <input 
              type="checkbox" 
              checked={settings.pushNotifications}
              onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
              className="w-6 h-6 cursor-pointer"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border">
            <label className="font-semibold block mb-2">Niveau d'Alerte</label>
            <select 
              value={settings.alertLevel}
              onChange={(e) => setSettings({...settings, alertLevel: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="low">Faible - Alertes critiques seulement</option>
              <option value="medium">Moyen - Alertes normales et critiques</option>
              <option value="high">Élevé - Toutes les notifications</option>
            </select>
          </div>
        </div>
      </div>

      {/* Seuils d'Alerte */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <AlertTriangle className="text-orange-500" />
          <span>Seuils d'Alerte</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 place-items-center">
          <div>
            <label className="font-semibold block mb-2">
              Seuil Critique (%): {settings.criticalThreshold}%
            </label>
            <input 
              type="range" 
              min="50" 
              max="100" 
              value={settings.criticalThreshold}
              onChange={(e) => setSettings({...settings, criticalThreshold: parseInt(e.target.value)})}
              className="w-full"
            />
            <p className="text-sm text-gray-600 mt-2">
              Une alerte urgente est déclenchée quand le remplissage dépasse ce seuil
            </p>
          </div>

          <div>
            <label className="font-semibold block mb-2">
              Seuil d'Avertissement (%): {settings.warningThreshold}%
            </label>
            <input 
              type="range" 
              min="30" 
              max="90" 
              value={settings.warningThreshold}
              onChange={(e) => setSettings({...settings, warningThreshold: parseInt(e.target.value)})}
              className="w-full"
            />
            <p className="text-sm text-gray-600 mt-2">
              Une alerte importante est déclenchée à ce seuil
            </p>
          </div>
        </div>
      </div>

      {/* Paramètres de Connexion IoT */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <Wifi className="text-green-500" />
          <span>Paramètres IoT/ESP32</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="font-semibold block mb-2">Intervalle de Mise à Jour (secondes)</label>
            <input 
              type="number" 
              value={settings.updateInterval}
              onChange={(e) => setSettings({...settings, updateInterval: parseInt(e.target.value)})}
              min="1"
              max="60"
              className="w-full border border-gray-300 rounded-lg p-2"
            />
            <p className="text-sm text-gray-600 mt-1">Fréquence de récupération des données des capteurs ESP32</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-semibold mb-2">Endroit de l'API ESP32</p>
            <p className="text-sm text-gray-700 font-mono bg-white p-2 rounded border">
              POST /api/bin/update
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Les capteurs ESP32 envoient les données de remplissage, batterie, température et signal à cette URL
            </p>
          </div>
        </div>
      </div>

      {/* Paramètres Régionaux */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <Database className="text-purple-500" />
          <span>Paramètres Régionaux</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 place-items-center">
          <div>
            <label className="font-semibold block mb-2">Fuseau Horaire</label>
            <select 
              value={settings.timezone}
              onChange={(e) => setSettings({...settings, timezone: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="Africa/Antananarivo">Antananarivo (UTC+3)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/Paris">Paris (UTC+1/+2)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-2">Langue</label>
            <select 
              value={settings.language}
              onChange={(e) => setSettings({...settings, language: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="mg">Malagasy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gestion des Utilisateurs */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <Users className="text-indigo-500" />
          <span>Gestion des Utilisateurs</span>
        </h3>
        
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg border flex justify-between items-center">
            <div>
              <p className="font-semibold">Administrator</p>
              <p className="text-sm text-gray-600">admin@fianarantsoa.mg</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Actif</span>
          </div>
          
          <button className="w-full border-2 border-cyan-500 text-cyan-600 py-2 rounded-lg hover:bg-cyan-50 transition font-semibold">
            + Ajouter un Utilisateur
          </button>
        </div>
      </div>

      {/* Sécurité */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
          <Shield className="text-red-500" />
          <span>Sécurité</span>
        </h3>
        
        <div className="space-y-3">
          <button className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-left font-semibold">
            Changer le Mot de Passe
          </button>
          <button className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-left font-semibold">
            Authentification à Deux Facteurs
          </button>
          <button className="w-full p-3 bg-red-100 hover:bg-red-200 rounded-lg transition text-left font-semibold text-red-700">
            Réinitialiser les Paramètres par Défaut
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button 
          onClick={handleSaveSettings}
          className="flex-1 bg-cyan-500 text-white py-3 rounded-lg hover:bg-cyan-600 transition font-semibold flex items-center justify-center space-x-2"
        >
          <Save size={20} />
          <span>Enregistrer les Modifications</span>
        </button>
        <button className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-100 transition font-semibold flex items-center justify-center space-x-2">
          <RotateCcw size={20} />
          <span>Annuler</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
