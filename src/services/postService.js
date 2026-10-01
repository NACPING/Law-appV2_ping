import { request } from './apiClient';
import { appendFile } from '../utils/formFile';

export const MAX_IMAGES = 5;

// Use Case: Posting
// feed = 'following' → แท็บ "ติดตาม" (โพสต์ของคนที่ติดตาม + โพสต์ที่คนที่ติดตามไปคอมเมนต์)
export const getPosts = (feed) => request(feed ? `/posts?feed=${feed}` : '/posts'); // { posts }
export const getPost = (id) => request(`/posts/${id}`); // { post, comments }
export const deletePost = (id) => request(`/posts/${id}`, { method: 'DELETE' });

// extend: create post — images = assets จาก expo-image-picker
export async function createPost({ title, content, isAnonymous, images = [] }) {
  const form = new FormData();
  form.append('title', title);
  form.append('content', content);
  form.append('isAnonymous', String(isAnonymous));

  for (const [i, asset] of images.entries()) {
    await appendFile(form, 'images', asset, {
      fallbackName: `image-${i}.jpg`,
      fallbackType: 'image/jpeg',
      maxBytes: 5 * 1024 * 1024, // ตรงกับขีดจำกัดของ backend
    });
  }

  return request('/posts', { method: 'POST', body: form });
}

// extend: create comment (parentId = ตอบกลับคอมเมนต์)
export const addComment = (postId, { content, parentId }) =>
  request(`/posts/${postId}/comments`, { method: 'POST', body: { content, parentId } });

export const deleteComment = (postId, commentId) =>
  request(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }); // { commentCount }
