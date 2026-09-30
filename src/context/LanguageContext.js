import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LANGUAGE, localeOf, setCurrentLanguage, translate } from '../i18n';

const LANGUAGE_KEY = 'language';

const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  locale: localeOf(DEFAULT_LANGUAGE),
  t: (key, params) => translate(key, params, DEFAULT_LANGUAGE),
  setLanguage: () => {},
});

// Language (Settings) — เก็บไว้ในเครื่อง (ไม่ผูกกับบัญชี) · เปลี่ยนแล้วทุกหน้าที่ใช้ t() แสดงผลใหม่ทันที
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((saved) => {
        if (saved) {
          setCurrentLanguage(saved);
          setLang(saved);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setLanguage = useCallback((next) => {
    // อัปเดตตัวแปรกลางก่อน render ใหม่ — utils และ apiClient (header Accept-Language) จะได้ใช้ภาษาใหม่ทันที
    setCurrentLanguage(next);
    setLang(next);
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ lang, locale: localeOf(lang), t: (key, params) => translate(key, params, lang), setLanguage }),
    [lang, setLanguage]
  );

  // รออ่านค่าที่บันทึกไว้ก่อน ไม่งั้นจะเห็นภาษาไทยแวบหนึ่งก่อนเปลี่ยนเป็นอังกฤษ
  if (!ready) return null;
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
