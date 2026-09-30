import { request } from './apiClient';

// การแจ้งเตือนในแอป (กระดิ่ง)
export const getNotifications = () => request('/notifications'); // { notifications, unreadCount }
export const getUnreadCount = () => request('/notifications/unread-count'); // { unreadCount }
export const markRead = (id) => request(`/notifications/${id}/read`, { method: 'PATCH' });
export const markAllRead = () => request('/notifications/read-all', { method: 'PATCH' });
