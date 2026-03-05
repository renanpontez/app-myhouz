import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  IHttpClient,
  RequestConfig,
  HttpResponse,
} from './http-client.interface';
import { IStorage, STORAGE_KEYS } from '../storage';
import { supabase } from '../supabase/client';

/**
 * Factory para criar instância do HttpClient usando Axios
 */
export const createHttpClient = (storage: IStorage, baseURL: string = ''): IHttpClient => {
  const client: AxiosInstance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Helper functions
  const normalizeError = (error: unknown): Error => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      const isHtml = typeof data === 'string' && data.trimStart().startsWith('<');
      const message =
        (!isHtml && typeof data === 'string' ? data : null) ||
        data?.message ||
        data?.error ||
        error.message ||
        'An unexpected error occurred';
      const normalizedError = new Error(message);
      (normalizedError as Error & { status?: number; responseData?: unknown }).status =
        error.response?.status;
      (normalizedError as Error & { responseData?: unknown }).responseData = data;
      return normalizedError;
    }
    return error instanceof Error ? error : new Error('Unknown error');
  };

  const toHttpResponse = <T>(response: AxiosResponse<T>): HttpResponse<T> => ({
    data: response.data,
    status: response.status,
    headers: response.headers as Record<string, string>,
  });

  const toAxiosConfig = (config?: RequestConfig): AxiosRequestConfig => {
    if (!config) return {};
    return {
      headers: config.headers,
      params: config.params,
      timeout: config.timeout,
    };
  };

  // Setup interceptors
  const setupInterceptors = (): void => {
    // Request interceptor — auto-attach token, handle FormData
    client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = storage.getString(STORAGE_KEYS.AUTH_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor — 401 auto-refresh via Supabase
    client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const { data: { session } } = await supabase.auth.refreshSession();
            if (session) {
              storage.setString(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
              originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
              return client(originalRequest);
            }
          } catch {
            storage.delete(STORAGE_KEYS.AUTH_TOKEN);
            storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
          }
        }

        return Promise.reject(normalizeError(error));
      }
    );
  };

  // Inicializa interceptors
  setupInterceptors();

  // HTTP methods
  const get = async <T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> => {
    const response = await client.get<T>(url, toAxiosConfig(config));
    return toHttpResponse(response);
  };

  const post = async <T, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> => {
    const response = await client.post<T>(url, data, toAxiosConfig(config));
    return toHttpResponse(response);
  };

  const put = async <T, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> => {
    const response = await client.put<T>(url, data, toAxiosConfig(config));
    return toHttpResponse(response);
  };

  const patch = async <T, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> => {
    const response = await client.patch<T>(url, data, toAxiosConfig(config));
    return toHttpResponse(response);
  };

  const del = async <T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> => {
    const response = await client.delete<T>(url, toAxiosConfig(config));
    return toHttpResponse(response);
  };

  const setAuthToken = (token: string | null): void => {
    if (token) {
      storage.setString(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      storage.delete(STORAGE_KEYS.AUTH_TOKEN);
    }
  };

  const setBaseUrl = (url: string): void => {
    client.defaults.baseURL = url;
  };

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    setAuthToken,
    setBaseUrl,
  };
};
