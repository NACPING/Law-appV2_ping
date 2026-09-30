import { request } from './apiClient';

// Use Case: Lawyer_request
export const getRequests = (status) => request(`/lawyer-requests${status ? `?status=${status}` : ''}`); // { requests }
export const getRequest = (id) => request(`/lawyer-requests/${id}`); // { request }

// ลูกความ
export const createRequest = ({ subject, events, message }) =>
  request('/lawyer-requests', { method: 'POST', body: { subject, events, message } });
export const cancelRequest = (id) => request(`/lawyer-requests/${id}`, { method: 'DELETE' });

// ปิดเคส (ยินยอมทั้งสองฝ่าย): ทนายขอปิด / ยกเลิกคำขอ → ลูกความยินยอมหรือไม่ยินยอม
export const requestCloseCase = (id) => request(`/lawyer-requests/${id}/close`, { method: 'PATCH' });
export const cancelCloseCase = (id) => request(`/lawyer-requests/${id}/close/cancel`, { method: 'PATCH' });
export const respondCloseCase = (id, accept) =>
  request(`/lawyer-requests/${id}/close/respond`, { method: 'PATCH', body: { accept } });

// admin
export const getLawyers = () => request('/lawyer-requests/lawyers'); // { lawyers }
export const approveRequest = (id, lawyerId) =>
  request(`/lawyer-requests/${id}/approve`, { method: 'PATCH', body: { lawyerId } });
export const rejectRequest = (id, reason) =>
  request(`/lawyer-requests/${id}/reject`, { method: 'PATCH', body: { reason } });
