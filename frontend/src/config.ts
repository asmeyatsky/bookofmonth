import { Platform } from 'react-native';

// API Configuration
// In production, set REACT_NATIVE_API_URL environment variable or update this default
const DEV_API_URL = Platform.select({
    android: 'http://10.0.2.2:8000/api',
    ios: 'http://127.0.0.1:8000/api',
    default: 'http://127.0.0.1:8000/api',
});

export const API_BASE_URL = DEV_API_URL!;
export const AUTH_API_URL = `${API_BASE_URL}/users`;

// Request timeout in milliseconds
export const REQUEST_TIMEOUT_MS = 15000;
