import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLanguage, translate } from '../i18n';

export const TOKEN_KEY = 'userToken';
const API_PORT = 5000;

// หา URL ของ backend อัตโนมัติ:
// 1) ใช้ EXPO_PUBLIC_API_URL ถ้าตั้งไว้ในไฟล์ .env
// 2) มือถือ: ใช้ IP เดียวกับเครื่องที่รัน Expo (มือถือเรียก localhost ของคอมไม่ได้)
// 3) เว็บ: ใช้ hostname ของหน้าเว็บ
function resolveBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const hostUri = Constants.expoConfig?.hostUri; // เช่น "192.168.1.38:8081"
  let host = hostUri ? hostUri.split(':')[0] : 'localhost';
  if (Platform.OS === 'web' && typeof window !== 'undefined') host = window.location.hostname;
  return `http://${host}:${API_PORT}/api`;
}

export const API_BASE_URL = resolveBaseUrl();
// ที่อยู่เซิร์ฟเวอร์ (ไม่มี /api) สำหรับ socket.io
export const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// เรียก API แล้วคืน JSON; ถ้า status ไม่ใช่ 2xx จะ throw Error พร้อมข้อความจาก backend
export async function request(path, { method = 'GET', body } = {}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  // FormData (อัปโหลดไฟล์): ห้ามตั้ง Content-Type เอง ให้ fetch ใส่ boundary ให้
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  headers['Accept-Language'] = getCurrentLanguage(); // backend ตอบข้อความ error เป็นภาษาที่ผู้ใช้เลือก

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    // แนบสาเหตุจริงไว้ด้วย — error ตอนส่งไม่ได้แปลว่าเน็ตหลุดเสมอ (เช่น อ่านไฟล์แนบไม่ได้)
    const detail = err?.message ? `\n(${err.message})` : '';
    throw new Error(`${translate('errors.network')}${detail}`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || translate('errors.generic'));
    error.status = response.status;
    throw error;
  }
  return data;
}
