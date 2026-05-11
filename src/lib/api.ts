const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // If we are in production (Vercel), use relative path
  if (import.meta.env.PROD) return '/api';
  // Fallback for local development
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();


export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || 'Something went wrong');
  }

  return response.json();
};

export default apiFetch;
