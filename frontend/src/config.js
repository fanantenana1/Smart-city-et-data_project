/**
 * Configuration pour le frontend SmartWaste
 * Gère les adresses IP locales et distantes
 */

// Déterminer l'adresse IP locale du réseau
const getLocalIP = () => {
  // Utiliser localhost pour éviter les problèmes CORS
  return 'localhost';
};

// Configuration de base
const API_PORT = process.env.REACT_APP_API_PORT || '8000';
const LOCAL_IP = getLocalIP();

// URLs de l'API
export const API_URLS = {
  // Adresse de base pour les requêtes API
  BASE_URL: process.env.REACT_APP_API_BASE || `http://${LOCAL_IP}:${API_PORT}`,
  
  // Adresse pour la communication ESP32/WebSocket (doit être sur le même réseau)
  DEVICE_BASE_URL: `http://${LOCAL_IP}:${API_PORT}`,
  
  // Endpoints principaux
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  BINS: '/api/bins',
  BIN: (id) => `/api/bin/${id}`,
  ALERTS: '/api/alerts',
  STATISTICS: '/api/statistics',
  COLLECTIONS: '/api/collections',
  USERS: '/api/users',
  USER_APPROVE: (username) => `/api/users/${username}/approve`,
  USER_REJECT: (username) => `/api/users/${username}/reject`,
  USER_UPDATE: (username) => `/api/users/${username}`,
  USER_DELETE: (username) => `/api/users/${username}`,
  USER_BINS: (username) => `/api/users/${username}/bins`,
  USER_BIN_ASSIGN: (username, binId) => `/api/users/${username}/bins/${binId}`,
};

// Configuration CORS
export const API_CONFIG = {
  timeout: 5000, // Réduit à 5 secondes pour une meilleure réponse
  withCredentials: true,
};

// Variables pour déboguer
export const DEBUG_CONFIG = {
  logAPI: true,
  localIP: LOCAL_IP,
  apiPort: API_PORT,
  baseURL: `http://${LOCAL_IP}:${API_PORT}`,
};

// Fonction pour définir l'IP locale manuellement
export const setLocalIP = (ip) => {
  localStorage.setItem('local_ip', ip);
  sessionStorage.setItem('local_ip', ip);
  window.location.reload(); // Recharger pour appliquer les changements
};

// Fonction pour obtenir l'IP locale actuelle
export const getConfiguredIP = () => {
  return localStorage.getItem('local_ip') || 'localhost';
};

export default API_URLS;
