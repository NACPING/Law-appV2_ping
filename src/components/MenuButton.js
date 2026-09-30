import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// ปุ่ม ☰ มุมซ้ายบนของหน้าแรกทุกแท็บ (ตาม Figma) — เปิดหน้า Settings
// Settings อยู่ใน Stack บนสุด (AppNavigator) จึงเปิดได้จากทุกแท็บ และกดย้อนกลับมาหน้าเดิม
export default function MenuButton() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Settings')} hitSlop={10} accessibilityLabel={t('nav.settings')}>
      <Ionicons name="menu" size={26} color={colors.text} />
    </TouchableOpacity>
  );
}
