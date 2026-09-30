import { request } from './apiClient';

// Use Case: Login (include: verify password — ตรวจที่ backend)
// คืนค่า { token, user }
export function login({ email, password }) {
  return request('/auth/login', { method: 'POST', body: { email, password } });
}

// Use Case: Register — role: 'client' | 'lawyer'
export function register(data) {
  return request('/auth/register', { method: 'POST', body: data });
}

export function getMe() {
  return request('/auth/me');
}
