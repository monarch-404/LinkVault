import axios from 'axios';

// Ensure this points to your running backend
const API_URL = 'http://localhost:5000/api'; 

export const uploadText = async (text: string, expiry: number) => {
  const formData = new FormData();
  formData.append('text', text);
  // CHANGE: key is now 'expirySeconds'
  formData.append('expirySeconds', expiry.toString()); 

  return axios.post(`${API_URL}/upload`, formData);
};

export const uploadFile = async (file: File, expiry: number) => {
  const formData = new FormData();
  formData.append('file', file);
  // CHANGE: key is now 'expirySeconds'
  formData.append('expirySeconds', expiry.toString());
  
  return axios.post(`${API_URL}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' } // Optional with axios+formData but good practice
  });
};

export const getContent = async (id: string) => {
  return axios.get(`${API_URL}/content/${id}`);
};