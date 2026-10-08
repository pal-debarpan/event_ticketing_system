const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const TOKEN_STORAGE_KEY = 'eventpass_organizer_token';

export const getAuthToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    return null;
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to set auth token in localStorage', e);
  }
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear auth token', e);
  }
};

/**
 * Standardized request wrapper that preserves HTTP status codes and response bodies.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    return {
      ok: false,
      status: 0,
      data: { error: 'Network error or server unreachable', message: networkError.message },
      networkError: true,
    };
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text ? { text } : null;
    } catch (e) {
      data = null;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export const api = {
  // Public Events
  async getEvents() {
    return request('/events', { method: 'GET' });
  },

  async getEventById(id) {
    return request(`/events/${id}`, { method: 'GET' });
  },

  async registerForEvent(id, { name, email }) {
    return request(`/events/${id}/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
  },

  // Organizer Auth
  async loginOrganizer({ email, password }) {
    return request('/organizers/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getCurrentOrganizer() {
    return request('/organizers/me', { method: 'GET' });
  },

  // Ticket Verification (Requires Organizer Auth)
  async verifyTicket({ token, ticketId }) {
    const body = {};
    if (ticketId) body.ticketId = ticketId;
    else body.token = token;
    return request('/tickets/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Event Management (Requires Organizer Auth)
  async createEvent({ name, description, venue, event_date, capacity }) {
    return request('/events', {
      method: 'POST',
      body: JSON.stringify({ name, description, venue, event_date, capacity }),
    });
  },
};

export default api;
