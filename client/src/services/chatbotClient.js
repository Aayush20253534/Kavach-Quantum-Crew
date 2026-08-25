import axios from 'axios';
import { getAccessToken, refreshSession } from './apiClient';

export const AI_SERVICE_URL = (
  import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:4200'
).replace(/\/$/, '');

const chatbotClient = axios.create({
  baseURL: `${AI_SERVICE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

chatbotClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

chatbotClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const { accessToken } = await refreshSession();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return chatbotClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export const sendChatbotMessage = async (payload) => {
  const response = await chatbotClient.post('/chatbot/messages', payload);
  return response.data?.data ?? response.data;
};

export const getChatbotHistory = async () => {
  const response = await chatbotClient.get('/chatbot/history');
  return response.data?.data ?? response.data;
};

export const clearChatbotHistory = async () => {
  const response = await chatbotClient.delete('/chatbot/history');
  return response.data?.data ?? response.data;
};

export default chatbotClient;
