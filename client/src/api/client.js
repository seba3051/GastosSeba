const TOKEN_KEY = 'gastosseba_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    setToken(null);
    // Recarga para volver al login si el token expiró.
    if (!path.startsWith('/auth')) window.location.reload();
  }

  if (!res.ok) {
    let message = 'Error de red';
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      /* respuesta sin cuerpo */
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

function qs(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
}

export const api = {
  // Auth
  authStatus: () => request('GET', '/auth/status'),
  register: (email, password) => request('POST', '/auth/register', { email, password }),
  login: (email, password) => request('POST', '/auth/login', { email, password }),

  // Categorías
  getCategories: (type) => request('GET', `/categories${qs({ type })}`),
  createCategory: (data) => request('POST', '/categories', data),
  updateCategory: (id, data) => request('PUT', `/categories/${id}`, data),
  deleteCategory: (id) => request('DELETE', `/categories/${id}`),

  // Movimientos
  getTransactions: (params) => request('GET', `/transactions${qs(params)}`),
  createTransaction: (data) => request('POST', '/transactions', data),
  updateTransaction: (id, data) => request('PUT', `/transactions/${id}`, data),
  deleteTransaction: (id) => request('DELETE', `/transactions/${id}`),

  // Reportes
  summary: (params) => request('GET', `/reports/summary${qs(params)}`),
  byCategory: (params) => request('GET', `/reports/by-category${qs(params)}`),
  monthly: (year) => request('GET', `/reports/monthly${qs({ year })}`),
  compare: (params) => request('GET', `/reports/compare${qs(params)}`),
  budgets: (month) => request('GET', `/reports/budgets${qs({ month })}`),
};
