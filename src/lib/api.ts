// API utility functions

/**
 * Get the base URL for API calls
 * In development: http://localhost:3000
 * In production: current domain
 */
export function getApiBaseUrl(): string {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // Fallback to current location if running in browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Default fallback for development
  return 'http://localhost:3000';
}

/**
 * Make an API call with proper error handling
 */
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  console.log(`🌐 [API] Calling: ${url}`);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}