import { auth } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Centralised API client.
 * - Automatically attaches the Firebase ID token to every request
 * - Throws on non-2xx responses with a useful error message
 * - Redirects to /signin on 401 (expired token)
 */
async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get fresh Firebase token
  const user = auth.currentUser;
  let token: string | null = null;
  if (user) {
    token = await user.getIdToken();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired — redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data as T;
}

// ── Typed API methods ─────────────────────────────────────────────────────────
export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),

  patch: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  /** For FormData uploads — lets browser set the multipart boundary */
  postForm: <T>(endpoint: string, formData: FormData) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {} as Record<string, string>,
    }),

  /** For SSE / streaming responses — returns the raw Response so caller can read body */
  postStream: async (endpoint: string, body?: unknown): Promise<Response> => {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).message || `API Error: ${response.status}`);
    }
    return response;
  },

  /** For legacy form upload (alias) */
  upload: <T>(endpoint: string, formData: FormData) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {} as Record<string, string>,
    }),
};

export { API_BASE };
