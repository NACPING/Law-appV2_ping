import AsyncStorage from '@react-native-async-storage/async-storage';

// Settings > Reading preferences — เก็บไว้ในเครื่อง (เหมือนธีม/ภาษา) ไม่ผูกกับบัญชี
const PREFS_KEY = 'readingPrefs';
const pageKey = (ebookId) => `readingPage:${ebookId}`;

export const DEFAULT_READING_PREFS = { rememberPage: true, darkPages: false };

// อ่านไม่ได้ (เช่น ข้อมูลเสีย) → ใช้ค่าเริ่มต้น ไม่ให้ตัวอ่าน PDF เปิดไม่ขึ้นเพราะเรื่องนี้
export async function getReadingPrefs() {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    return { ...DEFAULT_READING_PREFS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return DEFAULT_READING_PREFS;
  }
}

export async function setReadingPrefs(prefs) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
}

// หน้าที่อ่านค้างไว้ของหนังสือแต่ละเล่ม (1 = ยังไม่เคยอ่าน)
export async function getLastPage(ebookId) {
  const n = Number(await AsyncStorage.getItem(pageKey(ebookId)).catch(() => null));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export const saveLastPage = (ebookId, page) => AsyncStorage.setItem(pageKey(ebookId), String(page)).catch(() => {});
