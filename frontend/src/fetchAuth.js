// Global fetch wrapper: inject Authorization header from localStorage for API calls
const originalFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  try {
    const token = localStorage.getItem('sw_token');
    let url = typeof input === 'string' ? input : input.url;
    // If URL is relative starting with /api or targets backend host, add header
    if (token && (url.startsWith('/api') || url.includes('://10.35.197.194:8000') || url.includes('://localhost:8000') )) {
      init = init || {};
      init.headers = Object.assign({}, init.headers, {
        Authorization: `Bearer ${token}`,
      });
    }
  } catch (e) {
    // ignore
  }
  return originalFetch(input, init);
};

export default window.fetch;
