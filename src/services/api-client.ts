import axios, { type AxiosInstance, type AxiosRequestConfig, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, refreshAccessToken, logout } from './auth-service';

interface QueuedRequest {
  config: InternalAxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let requestQueue: QueuedRequest[] = [];

const processQueue = (axiosInstance: AxiosInstance, error: any, token: string | null): void => {
  requestQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else {
      if (token) {
        request.config.headers.Authorization = `Bearer ${token}`;
      }
      request.resolve(axiosInstance(request.config));
    }
  });

  requestQueue = [];
};

const formatError = (error: AxiosError): any => {
  if (error.response) {
    return {
      message: (error.response.data as any)?.message || error.message,
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      code: (error.response.data as any)?.code || 'API_ERROR',
    };
  } else if (error.request) {
    return {
      message: 'Network error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      originalError: error.message,
    };
  } else {
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }
};

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://jsonplaceholder.typicode.com',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      config.headers['X-Request-ID'] = requestId;

      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        requestId,
        timestamp: new Date().toISOString(),
        headers: config.headers,
      });

      return config;
    },
    (error) => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        requestId: response.config.headers['X-Request-ID'],
        timestamp: new Date().toISOString(),
      });

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      console.error(`[API Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        message: error.message,
        requestId: originalRequest?.headers['X-Request-ID'],
        timestamp: new Date().toISOString(),
      });

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            requestQueue.push({
              config: originalRequest,
              resolve,
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newAccessToken = await refreshAccessToken();
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(instance, null, newAccessToken);

          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(instance, refreshError, null);
          
          logout();
          
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(formatError(error));
    }
  );

  return instance;
};

const axiosInstance = createAxiosInstance();

export { axiosInstance };

export const apiClient = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },

  setAuthToken(token: string): void {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  clearAuthToken(): void {
    delete axiosInstance.defaults.headers.common['Authorization'];
  },
};
