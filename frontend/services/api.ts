
// Base URL for your backend API is now sourced from constants
import { API_BASE_URL, API_ENDPOINT_PREFIX } from '../constants';
const FULL_API_URL = `${API_BASE_URL}${API_ENDPOINT_PREFIX}`;

interface RequestOptions extends RequestInit {
  // You can add custom options if needed
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('greenShieldToken');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type for FormData, browser handles it with boundary
  if (options.body && !(options.body instanceof FormData)) {
     if (!headers.has('Content-Type')) {
        headers.append('Content-Type', 'application/json');
     }
     // Only stringify if it's not already a string (e.g. for raw text payloads if any)
     if (typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
     }
  }
  
  options.headers = headers;

  // Ensure endpoint starts with a slash if not already present
  const requestEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${FULL_API_URL}${requestEndpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}. No JSON error body.` , status: response.status }));
    const error: any = new Error(errorData.message || `API request failed with status ${response.status}`);
    error.response = response; 
    error.data = errorData; 
    error.status = response.status;
    throw error;
  }

  const contentType = response.headers.get("content-type");
  if (response.status === 204) { // No Content
    return null as unknown as Promise<T>;
  }
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json() as Promise<T>;
  } else {
    // For non-JSON responses, attempt to return text.
    // Could be an empty string if body is truly empty but not 204.
    return response.text() as unknown as Promise<T>;
  }
}

export const apiService = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body?: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'PUT', body }),
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),
};