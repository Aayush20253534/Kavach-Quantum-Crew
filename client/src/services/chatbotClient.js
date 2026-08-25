import axios from 'axios';
import { getAccessToken } from './apiClient';

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

export const sendChatbotMessage = async (payload) => {
  const response = await chatbotClient.post('/chatbot/messages', payload);
  return response.data?.data ?? response.data;
};

export default chatbotClient;
