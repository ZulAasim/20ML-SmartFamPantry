// services/api.js
import axios from 'axios';

// !!! IMPORTANT: Replace with your backend's actual IP address or domain !!!

const API_PORT = 8000 

const API_BASE_URL = 'http://MACHINEIPADDR:8000'; // Example: REPLACE THIS WITH YOUR MACHINE'S ACTUAL IP

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  return config;
});

export const groceryApi = {
  addItem: (itemData) => {
    return api.post('/groceries', itemData);
  },
  getItems: (familyId) => {
    return api.get(`/groceries/${familyId}`);
  },
  // --- CRITICAL FIX HERE ---
  deleteItem: (familyId, itemId) => {
    return api.delete(`/groceries/${familyId}/${itemId}`); // CORRECTED LINE
  },
};
