import th from './th';
import en from './en';

// ภาษาในแอป (Settings > Language) — ค่าเริ่มต้นภาษาไทย
// ข้อความทุกจุดอยู่ใน th.js / en.js · component ใช้ useLanguage().t — ส่วนที่ไม่ใช่ component
// (utils, apiClient) อ่านภาษาปัจจุบันจากตัวแปรในไฟล์นี้ ซึ่ง LanguageContext อัปเดตให้
const DICTS = { th, en };

export const LANGUAGES = [
  { code: 'th', label: 'ภาษาไทย' },
  { code: 'en', label: 'English' },
];
export const DEFAULT_LANGUAGE = 'th';

let current = DEFAULT_LANGUAGE;
export const setCurrentLanguage = (lang) => {
  current = DICTS[lang] ? lang : DEFAULT_LANGUAGE;
};
export const getCurrentLanguage = () => current;

// รูปแบบวันที่/เวลาของแต่ละภาษา (ไทย = พ.ศ.)
export const localeOf = (lang = current) => (lang === 'th' ? 'th-TH' : 'en-GB');

const lookup = (dict, key) => key.split('.').reduce((o, k) => o?.[k], dict);

// t('chat.title') หรือ t('profile.postCount', { count: 3 }) — ข้อความใน {ชื่อ} ถูกแทนด้วย params
// ถ้าภาษาอังกฤษยังไม่มีคำแปล ใช้ภาษาไทยแทน (ดีกว่าแสดง key)
export function translate(key, params, lang = current) {
  const value = lookup(DICTS[lang], key) ?? lookup(DICTS[DEFAULT_LANGUAGE], key);
  if (value === undefined) return key;
  if (typeof value === 'function') return value(params ?? {});
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? String(params[k]) : m));
}
