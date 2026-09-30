import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
