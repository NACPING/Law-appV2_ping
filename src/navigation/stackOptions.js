import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { headerTitleStyle } from '../theme/typography';

// ค่า header/พื้นหลังที่ทุก Stack ใช้ร่วมกัน (ตามธีมสว่าง/มืดปัจจุบัน)
export function useStackScreenOptions() {
  const { colors } = useTheme();
  return useMemo(
    () => ({
      headerTitleAlign: 'center',
      headerShadowVisible: false,
      headerTintColor: colors.text,
      headerBackButtonDisplayMode: 'minimal',
      headerTitleStyle,
      headerStyle: { backgroundColor: colors.background },
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors]
  );
}
