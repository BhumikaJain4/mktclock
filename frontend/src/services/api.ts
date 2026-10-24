/**
 * Unified API Client with automatic credentials and keepalive support
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface RequestOptions extends RequestInit {
  keepalive?: boolean;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Include persistent token from localStorage if available (supports cookie and Bearer fallback)
  const token = typeof window !== 'undefined' ? localStorage.getItem('sanctum_session_token') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensures session cookie is transmitted
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Body not JSON
    }
    const error = new Error(errorDetail);
    (error as any).status = response.status;
    throw error;
  }

  // Handle 204 or empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
