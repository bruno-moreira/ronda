import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const COMPUTER_HOST_IP = '10.107.20.214';

let currentServerUrl = `http://${COMPUTER_HOST_IP}:3000`;

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.manifestHeaders?.['expo-host'];
  
  if (hostUri) {
    const ipAddress = hostUri.split(':')[0];
    if (ipAddress && ipAddress !== 'localhost' && ipAddress !== '127.0.0.1') {
      return `http://${ipAddress}:3000`;
    }
  }

  if (Platform.OS === 'android') {
    return `http://${COMPUTER_HOST_IP}:3000`;
  }

  return `http://${COMPUTER_HOST_IP}:3000`;
};

currentServerUrl = getBackendUrl();

export const api = axios.create({
  baseURL: currentServerUrl,
  timeout: 10000,
});

export const updateServerUrl = (newUrl: string) => {
  let formattedUrl = newUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `http://${formattedUrl}`;
  }
  
  // Remove trailing slashes
  if (formattedUrl.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, -1);
  }

  // Add default port if no port and no path is specified and it's not https
  try {
    const urlObj = new URL(formattedUrl);
    if (!urlObj.port && urlObj.protocol === 'http:') {
      // Somente para garantir fallback em desenvolvimento caso o usuario apenas digite IP
      if (urlObj.pathname === '/' || urlObj.pathname === '') {
        formattedUrl = `${urlObj.origin}:3000`;
      }
    }
  } catch (e) {
    if (!formattedUrl.includes(':', 7)) {
      formattedUrl = `${formattedUrl}:3000`;
    }
  }

  currentServerUrl = formattedUrl;
  api.defaults.baseURL = formattedUrl;
  console.log('[API Service Sanitizado] Servidor configurado para:', currentServerUrl);
  return currentServerUrl;
};

export const getCurrentServerUrl = () => {
  return currentServerUrl;
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
