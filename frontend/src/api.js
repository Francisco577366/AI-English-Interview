const BASE = import.meta.env.VITE_API_URL || ''

function authHeaders() {
  const token = localStorage.getItem('iapage_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handle(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Ocurrió un error')
  return data
}

// --- Auth ---
export const register = (payload) =>
  fetch(`${BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(handle)

export const login = (payload) =>
  fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(handle)

export const me = () => fetch(`${BASE}/api/auth/me`, { headers: { ...authHeaders() } }).then(handle)

// Verifica si un email está registrado (recuperación manual, sin email)
export const checkEmail = (email) =>
  fetch(`${BASE}/api/auth/check-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).then(handle)

// Cambia la contraseña directamente (versión de portafolio)
export const resetPassword = (email, password) =>
  fetch(`${BASE}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(handle)

export const deleteAccount = () =>
  fetch(`${BASE}/api/auth/account`, { method: 'DELETE', headers: { ...authHeaders() } }).then(handle)

// --- Chat con IA ---
export const sendChat = (mode, messages) =>
  fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ mode, messages }),
  }).then(handle)

// --- Conversaciones guardadas ---
export const getConversations = () => fetch(`${BASE}/api/conversations`, { headers: { ...authHeaders() } }).then(handle)

export const saveConversation = (payload) =>
  fetch(`${BASE}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  }).then(handle)

export const getConversation = (id) =>
  fetch(`${BASE}/api/conversations/${id}`, { headers: { ...authHeaders() } }).then(handle)

export const renameConversation = (id, title) =>
  fetch(`${BASE}/api/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title }),
  }).then(handle)

export const deleteConversation = (id) =>
  fetch(`${BASE}/api/conversations/${id}`, { method: 'DELETE', headers: { ...authHeaders() } }).then(handle)

// --- Conversación activa (autoguardado + restauración) ---
export const getActiveConversation = (mode) =>
  fetch(`${BASE}/api/conversations/active?mode=${encodeURIComponent(mode)}`, { headers: { ...authHeaders() } }).then(handle)

export const saveActiveConversation = (payload) =>
  fetch(`${BASE}/api/conversations/active`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  }).then(handle)
