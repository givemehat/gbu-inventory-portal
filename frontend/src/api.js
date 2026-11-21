import {
  MOCK_USERS,
  MOCK_CATEGORIES,
  MOCK_VENDORS,
  MOCK_ITEMS,
  MOCK_DASHBOARD,
  MOCK_NOTICES,
  MOCK_POS,
  MOCK_INDENTS,
  MOCK_WRITEOFFS,
  MOCK_TRANSACTIONS,
  MOCK_CONSUMPTION_BY_DEPT,
  MOCK_ABC_ANALYSIS,
  MOCK_VENDOR_PERFORMANCE,
  MOCK_STOCK_FORECAST,
  MOCK_AUDIT_LOGS,
} from './mockData';

// Gautam Buddha University - Stores & Purchase Portal API Client
const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

function isStaticHost() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('github.io') || !API_BASE;
}

function getMockResponse(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const cleanPath = path.split('?')[0];

  // System & Health
  if (cleanPath === '/api/health') return { status: 'ok', preview: true };
  if (cleanPath === '/api/ready') return { status: 'ready', database: 'connected' };
  if (cleanPath === '/api/config') return { environment: 'preview', version: '2.4.0' };
  if (cleanPath === '/api/admin/integrity-check') return { ok: true, message: 'All database ledgers and balances verified healthy' };

  // Auth
  if (cleanPath === '/api/auth/me') return getCurrentUser() || MOCK_USERS['store@gbu.demo'];

  // Master Data
  if (cleanPath === '/api/categories') return [...MOCK_CATEGORIES];
  if (cleanPath === '/api/vendors') return [...MOCK_VENDORS];
  if (cleanPath === '/api/items') {
    if (method === 'POST') {
      const data = options.body ? JSON.parse(options.body) : {};
      const newItem = { id: `it-${Date.now()}`, ...data, qty: data.qty || 0, price: data.price || 0, value: (data.qty || 0) * (data.price || 0) };
      MOCK_ITEMS.unshift(newItem);
      return newItem;
    }
    return { items: MOCK_ITEMS, total: MOCK_ITEMS.length, page: 1, page_size: 25, total_pages: 1 };
  }
  if (cleanPath.startsWith('/api/items/')) {
    const id = cleanPath.replace('/api/items/', '');
    const item = MOCK_ITEMS.find(it => String(it.id) === String(id) || String(it.code) === String(id)) || MOCK_ITEMS[0];
    return { ...item };
  }

  // Dashboard & Reports
  if (cleanPath === '/api/dashboard') return { ...MOCK_DASHBOARD };
  if (cleanPath === '/api/reports/consumption-by-dept') return { ...MOCK_CONSUMPTION_BY_DEPT };
  if (cleanPath === '/api/reports/abc-analysis') return { ...MOCK_ABC_ANALYSIS };
  if (cleanPath === '/api/reports/vendor-performance') return [...MOCK_VENDOR_PERFORMANCE];
  if (cleanPath === '/api/analytics/stock-forecast') return { ...MOCK_STOCK_FORECAST };
  if (cleanPath === '/api/reports/bin-card') {
    return {
      item: MOCK_ITEMS[0],
      current_balance: 180,
      entries: [
        { date: '2026-11-20', ref: 'PO/2026-27/0001', kind: 'IN', in_qty: 100, out_qty: 0, balance: 200, note: 'Intake' },
        { date: '2026-11-21', ref: 'ISS-1021', kind: 'OUT', in_qty: 0, out_qty: 20, balance: 180, note: 'Issued to School of ICT' },
      ],
    };
  }
  if (cleanPath === '/api/reports/stock-as-of') {
    return {
      date: new Date().toISOString().slice(0, 10),
      total_items: MOCK_ITEMS.length,
      total_stock_value: 239080,
      items: MOCK_ITEMS,
    };
  }
  if (cleanPath.includes('.csv')) {
    const csvContent = 'Code,Name,Category,Quantity,Unit,Price,Total Value\n' +
      MOCK_ITEMS.map(i => `"${i.code}","${i.name}","${i.category}",${i.qty},"${i.unit}",${i.price},${i.value}`).join('\n');
    return new Blob([csvContent], { type: 'text/csv' });
  }

  // Transactions & Stock
  if (cleanPath === '/api/transactions') {
    return { items: MOCK_TRANSACTIONS, total: MOCK_TRANSACTIONS.length, page: 1, page_size: 25, total_pages: 1 };
  }
  if (cleanPath === '/api/stock/issue') {
    return { success: true, message: 'Stock issued successfully (preview)', ref: `ISS-${Date.now()}` };
  }

  // Indents
  if (cleanPath === '/api/indents') {
    if (method === 'POST') {
      const data = options.body ? JSON.parse(options.body) : {};
      const newIndent = {
        id: `ind-${Date.now()}`,
        no: `IND/2026-27/${String(MOCK_INDENTS.length + 1).padStart(4, '0')}`,
        dept: data.dept || 'School of ICT',
        by: 'Current User',
        status: 'PENDING',
        date: new Date().toISOString().slice(0, 10),
        items_count: data.lines?.length || 1,
        purpose: data.purpose || 'Departmental requisition',
        lines: data.lines || [],
      };
      MOCK_INDENTS.unshift(newIndent);
      return newIndent;
    }
    return { items: MOCK_INDENTS, total: MOCK_INDENTS.length, page: 1, page_size: 25, total_pages: 1 };
  }
  if (cleanPath.startsWith('/api/indents/')) {
    const id = cleanPath.split('/')[3];
    const ind = MOCK_INDENTS.find(i => String(i.id) === String(id)) || MOCK_INDENTS[0];
    if (cleanPath.endsWith('/decision')) {
      const data = options.body ? JSON.parse(options.body) : {};
      ind.status = data.approve ? 'APPROVED' : 'REJECTED';
      return { success: true, status: ind.status };
    }
    if (cleanPath.endsWith('/cancel')) {
      ind.status = 'CANCELLED';
      return { success: true, status: 'CANCELLED' };
    }
    if (cleanPath.endsWith('/copy')) {
      return { ...ind, id: `ind-${Date.now()}`, no: `IND/COPY/${ind.no}` };
    }
    return { ...ind };
  }

  // Purchase Orders
  if (cleanPath === '/api/purchase-orders') {
    if (method === 'POST') {
      const data = options.body ? JSON.parse(options.body) : {};
      const newPO = {
        id: `po-${Date.now()}`,
        no: `PO/2026-27/${String(MOCK_POS.length + 1).padStart(4, '0')}`,
        vendor: 'Sharma Stationers, Noida',
        by: 'Store Officer',
        status: 'OPEN',
        date: new Date().toISOString().slice(0, 10),
        total: 15000,
        lines: data.lines || [],
      };
      MOCK_POS.unshift(newPO);
      return newPO;
    }
    return { items: MOCK_POS, total: MOCK_POS.length, page: 1, page_size: 25, total_pages: 1 };
  }
  if (cleanPath.startsWith('/api/purchase-orders/')) {
    const id = cleanPath.split('/')[3];
    const po = MOCK_POS.find(p => String(p.id) === String(id)) || MOCK_POS[0];
    if (cleanPath.endsWith('/receive')) {
      po.status = 'RECEIVED';
      return { success: true, message: 'Stock received and ledgers updated' };
    }
    return { ...po };
  }

  // Write-offs
  if (cleanPath === '/api/writeoffs') {
    if (method === 'POST') {
      const data = options.body ? JSON.parse(options.body) : {};
      const newWO = {
        id: `wo-${Date.now()}`,
        no: `WO/2026-27/${String(MOCK_WRITEOFFS.length + 1).padStart(4, '0')}`,
        item: data.item_name || 'Broken Equipment',
        item_code: 'EQP-001',
        qty: data.qty || 1,
        reason: data.reason || 'Damaged during relocation',
        status: 'PENDING',
        proposed_by: 'Store Officer',
        date: new Date().toISOString().slice(0, 10),
      };
      MOCK_WRITEOFFS.unshift(newWO);
      return newWO;
    }
    return { items: MOCK_WRITEOFFS, total: MOCK_WRITEOFFS.length, page: 1, page_size: 25, total_pages: 1 };
  }
  if (cleanPath.startsWith('/api/writeoffs/') && cleanPath.endsWith('/decision')) {
    const id = cleanPath.split('/')[3];
    const wo = MOCK_WRITEOFFS.find(w => String(w.id) === String(id)) || MOCK_WRITEOFFS[0];
    const data = options.body ? JSON.parse(options.body) : {};
    wo.status = data.approve ? 'APPROVED' : 'REJECTED';
    return { success: true, status: wo.status };
  }

  // Notices
  if (cleanPath === '/api/notices') {
    if (method === 'POST') {
      const data = options.body ? JSON.parse(options.body) : {};
      const newNotice = { id: `not-${Date.now()}`, ref_no: `GBU/S&P/${new Date().getFullYear()}/CIR-${MOCK_NOTICES.length + 1}`, date: new Date().toISOString().slice(0, 10), ...data };
      MOCK_NOTICES.unshift(newNotice);
      return newNotice;
    }
    return [...MOCK_NOTICES];
  }
  if (cleanPath.startsWith('/api/notices/') && method === 'DELETE') {
    return { success: true };
  }

  // Audit Logs
  if (cleanPath === '/api/audit') {
    return { items: MOCK_AUDIT_LOGS, total: MOCK_AUDIT_LOGS.length, page: 1, page_size: 25, total_pages: 1 };
  }

  return undefined;
}

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
  const base = import.meta.env.BASE_URL || '/';
  window.location.href = base.endsWith('/') ? `${base}login` : `${base}/login`;
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

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && path !== '/api/auth/login') {
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      if ((response.status === 404 || response.status === 405) && isStaticHost()) {
        const mockRes = getMockResponse(path, options);
        if (mockRes !== undefined) return mockRes;
      }

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
  } catch (err) {
    if (isStaticHost() || err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed')) {
      const mockRes = getMockResponse(path, options);
      if (mockRes !== undefined) return mockRes;
    }
    throw err;
  }
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
    try {
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
    } catch (err) {
      if (isStaticHost() || (email && email.includes('@'))) {
        const user = MOCK_USERS[email] || {
          id: 'usr-demo-' + Math.random().toString(36).slice(2, 6),
          name: email.split('@')[0].toUpperCase(),
          email,
          role: email.includes('dir') ? 'approver' : (email.includes('admin') ? 'admin' : (email.includes('dept') ? 'dept' : 'store')),
          dept: 'Stores & Purchase',
        };
        const mockData = {
          access_token: 'gbu-mock-jwt-token-' + Date.now(),
          user,
        };
        setToken(mockData.access_token);
        setCurrentUser(mockData.user);
        return mockData;
      }
      throw err;
    }
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
