import { request } from './apiClient';
import { appendFile } from '../utils/formFile';

// Use Case: Chat (เฉพาะลูกความและทนายของเคส)
// { chat, messages (ใหม่ → เก่า), hasMore }
export const getMessages = (requestId, before) =>
  request(`/chats/${requestId}/messages${before ? `?before=${encodeURIComponent(before)}` : ''}`);

// ส่งข้อความและ/หรือไฟล์แนบ 1 ไฟล์ (รูปภาพ หรือ PDF)
export async function sendMessage(requestId, { text, file }) {
  const form = new FormData();
  if (text) form.append('text', text);
  if (file) {
    const isPdf = file.kind === 'pdf';
    await appendFile(form, 'file', file, {
      fallbackName: isPdf ? 'document.pdf' : 'image.jpg',
      fallbackType: isPdf ? 'application/pdf' : 'image/jpeg',
      maxBytes: 10 * 1024 * 1024, // ตรงกับขีดจำกัดของ backend
    });
  }
  return request(`/chats/${requestId}/messages`, { method: 'POST', body: form }); // { message }
}
