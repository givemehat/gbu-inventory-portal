// Gautam Buddha University - Stores & Purchase Portal API Client
const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

export function getToken() {
  return localStorage.getItem('gbu_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('gbu_token', token);
  } else {
    localStorage.removeItem('gbu_token');
  }
}

export function getCurrentUser() {
  const user = localStorage.getItem('gbu_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('gbu_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('gbu_user');
  }
}

export function logout() {
  setToken(null);
  setCurrentUser(null);
  window.location.href = '/login';
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = options.headers || {};

  const token = getToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && path !== '/api/auth/login') {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errMsg = `Request failed (${response.status})`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        if (typeof errData.detail === 'string') {
          errMsg = errData.detail;
        } else if (Array.isArray(errData.detail)) {
          errMsg = errData.detail.map(d => `${d.loc?.slice(-1)[0] || 'field'}: ${d.msg}`).join(', ');
        }
      }
    } catch {
      // Non-json response
    }
    throw new Error(errMsg);
  }

  // Handle CSV downloads or empty responses
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  // Health check for Render waking up detection
  health: () => request('/api/health'),

  // Auth
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const data = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    setToken(data.access_token);
    setCurrentUser(data.user);
    return data;
  },
  me: () => request('/api/auth/me'),

  // Master Data
  getCategories: () => request('/api/categories'),
  addCategory: (name) => request('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),

  getItems: (params = {}) => {
    const q = new URLSearchParams();
    if (params.q) q.append('q', params.q);
    if (params.low) q.append('low', 'true');
    if (params.category_id) q.append('category_id', params.category_id);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request(`/api/items${qs}`);
  },
  getItem: (id) => request(`/api/items/${id}`),
  addItem: (data) => request('/api/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  editItem: (id, data) => request(`/api/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  getVendors: () => request('/api/vendors'),
  addVendor: (data) => request('/api/vendors', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Stores
  issueStock: (data) => request('/api/stock/issue', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getTransactions: (params = {}) => {
    const q = new URLSearchParams();
    if (params.item_id) q.append('item_id', params.item_id);
    if (params.kind) q.append('kind', params.kind);
    if (params.limit) q.append('limit', params.limit);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request(`/api/transactions${qs}`);
  },

  // Indents
  getIndents: (status = '') => {
    const qs = status ? `?status=${status}` : '';
    return request(`/api/indents${qs}`);
  },
  getIndent: (id) => request(`/api/indents/${id}`),
  createIndent: (data) => request('/api/indents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  decideIndent: (id, approve, remark = '') => request(`/api/indents/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ approve, remark }),
  }),

  // Purchase Orders
  getPOs: () => request('/api/purchase-orders'),
  getPO: (id) => request(`/api/purchase-orders/${id}`),
  createPO: (data) => request('/api/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  receiveGoods: (id, lines) => request(`/api/purchase-orders/${id}/receive`, {
    method: 'POST',
    body: JSON.stringify({ lines }),
  }),

  // Write-offs
  getWriteOffs: () => request('/api/writeoffs'),
  createWriteOff: (data) => request('/api/writeoffs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  decideWriteOff: (id, approve, remark = '') => request(`/api/writeoffs/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ approve, remark }),
  }),

  // Dashboard & Reports
  getDashboard: () => request('/api/dashboard'),
  downloadStockReport: async () => {
    const blob = await request('/api/reports/stock.csv');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GBU_Stock_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
  downloadTxnReport: async () => {
    const blob = await request('/api/reports/transactions.csv');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GBU_Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  // Audit
  getAuditLogs: () => request('/api/audit'),
};
