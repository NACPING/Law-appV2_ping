import { request } from './apiClient';

// Use Case: Reading
export const getCategories = () => request('/ebooks/categories'); // { categories: [{ id, name, color, ebooks }] }
export const getEbook = (id) => request(`/ebooks/${id}`); // { ebook }

// extend: Search e-book
export const searchEbooks = ({ q = '', category } = {}) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  const qs = params.toString();
  return request(`/ebooks${qs ? `?${qs}` : ''}`); // { ebooks }
};

// extend: Bookmark e-book
export const getFavorites = () => request('/ebooks/favorites'); // { ebooks }
export const setFavorite = (id, isFavorite) =>
  request(`/ebooks/${id}/favorite`, { method: isFavorite ? 'PUT' : 'DELETE' }); // { isFavorite }
