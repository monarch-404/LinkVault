import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Helper to get token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // --- AUTH ---
  register: (email: string, password: string) => 
    axios.post(`${API_URL}/auth/register`, { email, password }),

  login: (email: string, password: string) => 
    axios.post(`${API_URL}/auth/login`, { email, password }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
  },

  // --- UPLOAD ---
  uploadText: (text: string, expiry: number, password?: string, maxViews?: number) => {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('expiry', expiry.toString());
    if (password) formData.append('password', password);
    if (maxViews) formData.append('maxViews', maxViews.toString());

    return axios.post(`${API_URL}/upload`, formData, { headers: getAuthHeader() });
  },

  uploadFile: (file: File, expiry: number, password?: string, maxViews?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('expiry', expiry.toString());
    if (password) formData.append('password', password);
    if (maxViews) formData.append('maxViews', maxViews.toString());
    
    return axios.post(`${API_URL}/upload`, formData, { headers: getAuthHeader() });
  },

  // --- CONTENT ---
  getContent: (id: string, password?: string) => 
    axios.post(`${API_URL}/content/${id}`, { password }),

  deleteContent: (id: string, token: string) => 
    axios.delete(`${API_URL}/content/${id}`, { data: { token } }),

  // --- USER HISTORY ---
  getHistory: () => 
    axios.get(`${API_URL}/user/history`, { headers: getAuthHeader() })
};