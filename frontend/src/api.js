import axios from "axios";
import { API_URLS, API_CONFIG, DEBUG_CONFIG } from "./config";

// Utiliser la configuration centralisée
const BASE = 'http://localhost:8000';

if (DEBUG_CONFIG.logAPI) {
  console.log('🌐 API Configuration:', {
    BASE_URL: BASE,
    LOCAL_IP: DEBUG_CONFIG.localIP,
    PORT: DEBUG_CONFIG.apiPort,
  });
}

export const api = axios.create({
  baseURL: BASE,
  ...API_CONFIG,
});

console.log('Axios baseURL set to:', BASE);

// attach token automatically
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('sw_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Token retrieval error:', e);
  }
  
  if (DEBUG_CONFIG.logAPI) {
    console.log('📤 API Request:', config.url);
  }

  console.log('Request full URL:', (config.baseURL || '') + config.url);

  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => {
    if (DEBUG_CONFIG.logAPI) {
      console.log('📥 API Response:', response.config.url, response.status);
      console.log('Response data preview:', response.data ? (typeof response.data === 'string' ? response.data.substring(0, 100) : JSON.stringify(response.data).substring(0, 100)) : 'no data');
    }
    return response;
  },
  (error) => {
    if (DEBUG_CONFIG.logAPI) {
      console.error('❌ API Error:', error.config?.url, error.response?.status);
    }
    return Promise.reject(error);
  }
);

// Helper methods
export const fetchBins = () => api.get(API_URLS.BINS);
export const fetchBin = (id) => api.get(API_URLS.BIN(id));
export const fetchAlerts = () => api.get(API_URLS.ALERTS);
export const fetchStatistics = () => api.get(API_URLS.STATISTICS);
export const fetchCollections = (limit = 100, offset = 0) => 
  api.get(`${API_URLS.COLLECTIONS}?limit=${limit}&offset=${offset}`);
export const postLogin = (username, password) => 
  api.post(API_URLS.AUTH_LOGIN, { username, password });
export const postRegister = (username, email, password) => 
  api.post(API_URLS.AUTH_REGISTER, { username, email, password });
export const fetchUsers = () => api.get(API_URLS.USERS);
export const approveUser = (username) => api.post(API_URLS.USER_APPROVE(username));
export const rejectUser = (username) => api.post(API_URLS.USER_REJECT(username));
export const updateUser = (username, data) => api.put(API_URLS.USER_UPDATE(username), data);
export const deleteUser = (username) => api.delete(API_URLS.USER_DELETE(username));
export const fetchUserBins = (username) => api.get(API_URLS.USER_BINS(username));
export const assignBinToUser = (username, binId) => api.post(API_URLS.USER_BIN_ASSIGN(username, binId));
export const unassignBinFromUser = (username, binId) => api.delete(API_URLS.USER_BIN_ASSIGN(username, binId));
export const fetchLatest = () => api.get(API_URLS.STATISTICS);
export const fetchHistory = (limit = 20) => api.get(`${API_URLS.COLLECTIONS}?limit=${limit}&offset=0`);

export default api;
