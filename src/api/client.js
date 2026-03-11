const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Lightweight API client for the portfolio backend.
 */
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    const error = new Error(json?.error?.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.details = json?.error?.details;
    throw error;
  }

  return json;
}

export const api = {
  // Contact
  submitContact: (data) =>
    request('/contact', { method: 'POST', body: JSON.stringify(data) }),

  // Ratings
  getRatings: (page = 1, limit = 10) =>
    request(`/ratings?page=${page}&limit=${limit}`),

  getRatingStats: () =>
    request('/ratings/stats'),

  submitRating: (data) =>
    request('/ratings', { method: 'POST', body: JSON.stringify(data) }),

  // YouTube
  getVideos: () =>
    request('/youtube/videos'),

  // LinkedIn
  getLinkedInPosts: () =>
    request('/linkedin/posts'),

  // Health
  healthCheck: () =>
    request('/health'),
};
