// StudyFlow API Service
// Communicates with the Express backend at http://localhost:5000

const API_BASE = 'http://localhost:5000/api';

// Token and User session storage helpers
export function getToken() {
  return sessionStorage.getItem('studyflow_token');
}

export function getUser() {
  const userStr = sessionStorage.getItem('studyflow_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  sessionStorage.setItem('studyflow_token', token);
  sessionStorage.setItem('studyflow_user', JSON.stringify(user));
}

export function clearAuth() {
  sessionStorage.removeItem('studyflow_token');
  sessionStorage.removeItem('studyflow_user');
}

// Internal authorized fetch helper
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Health Check ──
export async function checkHealth() {
  return request('/health');
}

// ── Authentication ──
export async function registerUser({ name, email, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUser({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function googleLogin(credential) {
  return request('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

// ── Tasks CRUD ──
export async function fetchTasks() {
  return request('/tasks');
}

export async function createTask(taskData) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function updateTask(id, taskData) {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });
}

export async function deleteTask(id) {
  return request(`/tasks/${id}`, {
    method: 'DELETE',
  });
}
