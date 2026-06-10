import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ML_BASE = import.meta.env.VITE_ML_URL || 'http://localhost:8000';

export const api = axios.create({ baseURL: API_BASE });
export const mlApi = axios.create({ baseURL: ML_BASE });

export const fetchProducts = async (cursor?: string, search?: string, limit = 20) => {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  if (search) params.append('search', search);
  params.append('limit', limit.toString());
  const res = await api.get(`/products?${params.toString()}`);
  return res.data;
};

export const fetchProduct = async (productId: string) => {
  const res = await api.get(`/products/${productId}`);
  return res.data;
};

export const fetchPriceHistory = async (productId: string, days = 90) => {
  const res = await api.get(`/price-history/${productId}?days=${days}`);
  return res.data;
};

export const compareProducts = async (productIds: string[]) => {
  const res = await api.get(`/compare?ids=${productIds.join(',')}`);
  return res.data;
};

export const checkDuplicate = async (title1: string, title2: string) => {
  const res = await mlApi.post('/dedup/check', { title1, title2 });
  return res.data;
};