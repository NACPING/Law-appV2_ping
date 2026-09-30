import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../theme/colors';

const DARK_MODE_KEY = 'darkMode';

const ThemeContext = createContext({ isDark: false, colors: lightColors, setDarkMode: () => {} });

// Dark mode (Settings) — เลือกเองในแอป ไม่ตามการตั้งค่าของเครื่อง · เก็บไว้ในเครื่อง (ไม่ผูกกับบัญชี)
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY)
      .then((value) => setIsDark(value === '1'))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // ให้ส่วนที่ระบบวาดเอง (หน้าต่าง Alert, คีย์บอร์ด, ตัวเลือกรูป) เป็นโหมดเดียวกับแอป
  useEffect(() => {
    try {
      Appearance.setColorScheme?.(isDark ? 'dark' : 'light');
    } catch {
      // บางแพลตฟอร์ม (เว็บ) ไม่รองรับ — ไม่กระทบสีในแอป
    }
  }, [isDark]);

  const setDarkMode = useCallback((value) => {
    setIsDark(value);
    AsyncStorage.setItem(DARK_MODE_KEY, value ? '1' : '0').catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ isDark, colors: isDark ? darkColors : lightColors, setDarkMode }),
    [isDark, setDarkMode]
  );

  // รออ่านค่าที่บันทึกไว้ก่อน ไม่งั้นหน้าจอจะกระพริบเป็นสีขาวก่อนเปลี่ยนเป็นมืด
  if (!ready) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// สร้าง StyleSheet จากสีของธีมปัจจุบัน — factory = (colors) => StyleSheet.create({...}) ประกาศไว้นอก component
export function useThemedStyles(factory) {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
