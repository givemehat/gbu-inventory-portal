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
      if (errData && errData.error && errData.error.message) {
        errMsg = errData.error.message;
      } else if (errData && errData.detail) {
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

function wrapListResponse(res) {
  if (res && Array.isArray(res.items)) {
    const arr = [...res.items];
    arr.total = res.total;
    arr.page = res.page;
    arr.pageSize = res.page_size;
    arr.totalPages = res.total_pages;
    return arr;
  }
  return res;
}

export const api = {
  // Health check for Render waking up detection
  health: () => request('/api/health'),
  ready: () => request('/api/ready'),
  getConfig: () => request('/api/config'),
  integrityCheck: () => request('/api/admin/integrity-check'),

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

  getItems: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.q) q.append('q', params.q);
    if (params.low) q.append('low', 'true');
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.page) q.append('page', params.page);
    if (params.page_size) q.append('page_size', params.page_size);
    if (params.sort) q.append('sort', params.sort);
    if (params.order) q.append('order', params.order);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await request(`/api/items${qs}`);
    return wrapListResponse(res);
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
  getTransactions: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.item_id) q.append('item_id', params.item_id);
    if (params.kind) q.append('kind', params.kind);
    if (params.page) q.append('page', params.page);
    if (params.page_size) q.append('page_size', params.page_size);
    if (params.sort) q.append('sort', params.sort);
    if (params.order) q.append('order', params.order);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await request(`/api/transactions${qs}`);
    return wrapListResponse(res);
  },

  // Indents
  getIndents: async (status = '', params = {}) => {
    const q = new URLSearchParams();
    if (status) q.append('status', status);
    if (params.dept) q.append('dept', params.dept);
    if (params.page) q.append('page', params.page);
    if (params.page_size) q.append('page_size', params.page_size);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await request(`/api/indents${qs}`);
    return wrapListResponse(res);
  },
  getIndent: (id) => request(`/api/indents/${id}`),
  createIndent: (data) => request('/api/indents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  decideIndent: (id, approve, remark = '', line_approvals = null) => request(`/api/indents/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ approve, remark, line_approvals }),
  }),
  cancelIndent: (id) => request(`/api/indents/${id}/cancel`, {
    method: 'POST',
  }),
  copyIndent: (id) => request(`/api/indents/${id}/copy`, {
    method: 'POST',
  }),

  // Purchase Orders
  getPOs: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.vendor_id) q.append('vendor_id', params.vendor_id);
    if (params.page) q.append('page', params.page);
    if (params.page_size) q.append('page_size', params.page_size);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await request(`/api/purchase-orders${qs}`);
    return wrapListResponse(res);
  },
  getPurchaseOrders: (params = {}) => api.getPOs(params),
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
  getWriteOffs: async (params = {}) => {
    const q = new URLSearchParams();
    if (typeof params === 'string') {
      if (params) q.append('status', params);
    } else {
      if (params.status) q.append('status', params.status);
      if (params.page) q.append('page', params.page);
      if (params.page_size) q.append('page_size', params.page_size);
    }
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await request(`/api/writeoffs${qs}`);
    return wrapListResponse(res);
  },
  createWriteOff: (data) => request('/api/writeoffs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  decideWriteOff: (id, approve, remark = '') => request(`/api/writeoffs/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ approve, remark }),
  }),

  // Audit
  getAudit: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.q) q.append('q', params.q);
    if (params.page) q.append('page', params.page);
    if (params.page_size) q.append('page_size', params.page_size);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await request(`/api/audit${qs}`);
    return wrapListResponse(res);
  },

  // Dashboard & Reports
  getDashboard: () => request('/api/dashboard'),
  getStockAsOf: (date) => request(`/api/reports/stock-as-of?date=${encodeURIComponent(date)}`),
  getBinCard: (itemId, fromDate = '', toDate = '') => {
    const q = new URLSearchParams({ item_id: itemId });
    if (fromDate) q.append('from_date', fromDate);
    if (toDate) q.append('to_date', toDate);
    return request(`/api/reports/bin-card?${q.toString()}`);
  },
  getConsumptionByDept: (days = 90) => request(`/api/reports/consumption-by-dept?days=${days}`),
  getAbcAnalysis: () => request('/api/reports/abc-analysis'),
  getVendorPerformance: () => request('/api/reports/vendor-performance'),
  getStockForecast: () => request('/api/analytics/stock-forecast'),

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

  // Circulars & Notices
  getNotices: () => request('/api/notices'),
  addNotice: (data) => request('/api/notices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteNotice: (id) => request(`/api/notices/${id}`, {
    method: 'DELETE',
  }),
};
