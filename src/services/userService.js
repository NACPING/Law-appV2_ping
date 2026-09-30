import { request } from './apiClient';
import { appendFile } from '../utils/formFile';

// หน้า Profile — { user, stats: { postCount, commentCount, caseCount }, posts, comments }
export const getProfile = (userId) => request(`/users/${userId}`);

// แก้ไขโปรไฟล์ของตัวเอง: firstName, lastName, phone, bio (+ about, showContact เฉพาะทนาย) — คืน { user }
export const updateProfile = (data) => request('/users/me', { method: 'PATCH', body: data });

// asset = รูปจาก expo-image-picker — คืน { user }
export async function updateAvatar(asset) {
  const form = new FormData();
  await appendFile(form, 'avatar', asset, {
    fallbackName: 'avatar.jpg',
    fallbackType: 'image/jpeg',
    maxBytes: 5 * 1024 * 1024, // ตรงกับขีดจำกัดของ backend
  });
  return request('/users/me/avatar', { method: 'PUT', body: form });
}

export const removeAvatar = () => request('/users/me/avatar', { method: 'DELETE' });

export const changePassword = ({ currentPassword, newPassword }) =>
  request('/users/me/password', { method: 'PUT', body: { currentPassword, newPassword } });
