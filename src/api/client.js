const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Lightweight API client for the portfolio backend.
 *
 * Errors carry `status` and `details` when the server answered, and `offline: true` when
 * it could not be reached, timed out, or answered with something that is not the API
 * (a host's error page, say) — so a form can offer another way to get in touch.
 * `timeout` (ms) defaults to 20 s; the free host can take most of a minute to wake up.
 */
async function request(path, { timeout = 20000, headers, ...options } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...headers },
      signal: controller.signal,
    });
  } catch (err) {
    const error = new Error(err.name === 'AbortError' ? 'The server took too long to answer.' : 'Could not reach the server.');
    error.offline = true;
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || !json) {
    const error = new Error(json?.error?.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.details = json?.error?.details;
    error.offline = !json;
    throw error;
  }

  return json;
}

export const api = {
  // Contact (allowed extra time: it may have to wake the server)
  submitContact: (data) =>
    request('/contact', { method: 'POST', body: JSON.stringify(data), timeout: 75000 }),

  // Ratings
  getRatings: (page = 1, limit = 10) =>
    request(`/ratings?page=${page}&limit=${limit}`),

  getRatingStats: () =>
    request('/ratings/stats'),

  submitRating: (data) =>
    request('/ratings', { method: 'POST', body: JSON.stringify(data), timeout: 75000 }),

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
