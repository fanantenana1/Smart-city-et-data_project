import React from 'react';
import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Colonne Entreprise */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center space-x-2">
              <div className="bg-cyan-951 p-2 rounded-lg">
                <span className="text-white text-lg">
                   <img 
              src="/smartwaste-logo.png" 
              alt="SmartWaste Logo" 
              className="w-16 h-16 object-contain"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
            />
                </span>
              </div>
              <span>SmartWaste</span>
            </h3>
            <p className="text-sm text-gray-400">
              Système intelligent de gestion des déchets pour la Commune de Fianarantsoa
            </p>
          </div>

          {/* Colonne Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin size={18} className="text-cyan-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Adresse</p>
                  <p className="text-gray-400">Commune de Fianarantsoa</p>
                  <p className="text-gray-400">Fianarantsoa, Madagascar</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-cyan-500 flex-shrink-0" />
                <p className="text-gray-400">+261 38 06 114 15</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-cyan-500 flex-shrink-0" />
                <p className="text-gray-400">info@fianarantsoa.mg</p>
              </div>
            </div>
          </div>

          {/* Colonne Liens Utiles */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-gray-400 hover:text-cyan-400 transition">Tableau de Bord</a></li>
              <li><a href="/map" className="text-gray-400 hover:text-cyan-400 transition">Carte en Direct</a></li>
              <li><a href="/alerts" className="text-gray-400 hover:text-cyan-400 transition">Alertes et Rapports</a></li>
              <li><a href="/settings" className="text-gray-400 hover:text-cyan-400 transition">Configuration</a></li>
              <li><a href="/docs" className="text-gray-400 hover:text-cyan-400 transition">Documentation</a></li>
            </ul>
          </div>

          {/* Colonne Réseaux Sociaux */}
          <div>
            <h4 className="text-white font-semibold mb-4">Suivez-nous</h4>
            <div className="flex space-x-4 mb-6">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-cyan-600 p-3 rounded-lg transition">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-cyan-600 p-3 rounded-lg transition">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-cyan-600 p-3 rounded-lg transition">
                <Linkedin size={20} />
              </a>
            </div>
            <p className="text-xs text-gray-500">
              Contribuant au développement durable de Fianarantsoa
            </p>
          </div>
        </div>

        {/* Ligne de Séparation */}
        <div className="border-t border-gray-800 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-gray-400">
              <p className="font-semibold text-white mb-2">À Propos du Projet</p>
              <p>SmartWaste est une solution IoT innovante développée pour optimiser la gestion des déchets urbains.</p>
            </div>
            <div className="text-gray-400">
              <p className="font-semibold text-white mb-2">Technologie</p>
              <p>Utilise des capteurs IoT ESP32, une API FastAPI, et une interface React moderne pour la gestion en temps réel.</p>
            </div>
            <div className="text-gray-400">
              <p className="font-semibold text-white mb-2">Objectifs</p>
              <p>Réduire les coûts de collecte, améliorer l'efficacité environnementale et moderniser la ville.</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; 2024-2026 Commune de Fianarantsoa. Tous droits réservés.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/privacy" className="hover:text-cyan-400 transition">Politique de Confidentialité</a>
            <a href="/terms" className="hover:text-cyan-400 transition">Conditions d'Utilisation</a>
            <a href="/legal" className="hover:text-cyan-400 transition">Mentions Légales</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
