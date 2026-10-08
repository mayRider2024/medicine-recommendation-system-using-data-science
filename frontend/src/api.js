import axios from 'axios';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return 'http://localhost:8000/api';
  const clean = url.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const diagnosisAPI = {
  diagnose: ({ symptoms, language = 'en', answers = {} }) =>
    api.post('/diagnose', { symptoms, language, answers }, { timeout: 45000 }),
  getSymptoms: (language = 'en') =>
    api.get('/symptoms', { params: { language } }),
};

export const medicinesAPI = {
  getMedicinesForDisease: (diseaseId, language = 'en') =>
    api.get(`/medicines/${diseaseId}`, { params: { language } }),
};

export const interactionsAPI = {
  checkInteractions: (medicine_ids) =>
    api.post('/check-interactions', { medicine_ids }),
};

export const prescriptionsAPI = {
  generatePrescription: (disease_id, disease_name, medicines, language = 'en') =>
    api.post('/generate-prescription', { disease_id, disease_name, medicines, language }),
};

export const transcriptionAPI = {
  transcribeAudio: (audioFile, language = 'en') => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('language', language);
    return axios.post(`${API_BASE_URL}/transcribe`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;

