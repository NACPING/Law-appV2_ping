import React, { useEffect, useMemo, useState } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LogoSplash from '../components/LogoSplash';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

const SPLASH_MIN_MS = 1000;

// ยังไม่ล็อกอิน -> AuthNavigator (Login/Register), ล็อกอินแล้ว -> AppNavigator (Bottom Tabs)
export default function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();
  const { isDark, colors } = useTheme();

  // สีพื้นฐานของ React Navigation (พื้นหลังหน้า, header, เส้นขอบ) ให้ตรงกับธีมของแอป
  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [isDark, colors]);

  // โชว์หน้าโลโก้อย่างน้อยสักครู่ — โหลดเร็วมากแล้วหน้าโลโก้จะแวบหายจนดูเหมือนกระพริบ
  const [minTimeDone, setMinTimeDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !minTimeDone) return <LogoSplash />;

  return (
    <NavigationContainer theme={navTheme}>
      {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
