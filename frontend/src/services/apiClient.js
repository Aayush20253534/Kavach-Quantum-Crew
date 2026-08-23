import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const ACCESS_TOKEN_KEY = 'quantum_access_token';
const EXPLICIT_SIGN_OUT_KEY = 'kavach_explicit_sign_out';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

let authFailureLatched = false;

export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.removeItem(EXPLICIT_SIGN_OUT_KEY);
    authFailureLatched = false;
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const clearAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const resetAuthFailure = () => {
  authFailureLatched = false;
};

export const isExplicitlySignedOut = () =>
  localStorage.getItem(EXPLICIT_SIGN_OUT_KEY) === '1';

// Persist an explicit user sign-out across full-page reloads. This prevents
// AuthInitializer from silently using a stale refresh cookie to sign the user
// straight back in after they deliberately signed out. A successful login
// clears this marker through setAccessToken().
export const markExplicitSignOut = () => {
  localStorage.setItem(EXPLICIT_SIGN_OUT_KEY, '1');
  authFailureLatched = true;
  clearAccessToken();
  delete apiClient.defaults.headers.common.Authorization;
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

const markAuthFailed = () => {
  authFailureLatched = true;
  clearAccessToken();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('quantum_auth_failed'));
  }
};

export const refreshSession = async () => {
  if (isExplicitlySignedOut()) {
    const error = new Error('User explicitly signed out');
    error.code = 'EXPLICIT_SIGN_OUT';
    throw error;
  }

  if (authFailureLatched) {
    const error = new Error('Authentication session is unavailable');
    error.code = 'AUTH_SESSION_UNAVAILABLE';
    throw error;
  }

  const { data } = await axios.post(
    `${API_URL}/auth/refresh`,
    {},
    { withCredentials: true },
  );

  const payload = data?.data ?? data;
  const accessToken = payload?.accessToken;
  const user = payload?.user;

  if (!accessToken) {
    throw new Error('Refresh response did not include an access token');
  }

  setAccessToken(accessToken);
  apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

  return { accessToken, user };
};

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const devRole = import.meta.env.DEV ? localStorage.getItem('DEV_ROLE') : null;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      authFailureLatched ||
      devRole
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (!token) throw error;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
    }

    isRefreshing = true;

    try {
      const { accessToken } = await refreshSession();
      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Only destroy the local session when the refresh token is actually
      // rejected. A temporary 429, network failure, or server error should not
      // sign the tourist out and make a rate-limit hiccup look like auth loss.
      const refreshStatus = refreshError?.response?.status;
      if (refreshStatus === 401 || refreshStatus === 403) {
        markAuthFailed();
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
