import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// ปุ่ม ☰ มุมซ้ายบนของหน้าแรกทุกแท็บ (ตาม Figma) — เปิดหน้า Settings
// Settings อยู่ใน Stack บนสุด (AppNavigator) จึงเปิดได้จากทุกแท็บ และกดย้อนกลับมาหน้าเดิม
export default function MenuButton() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Settings')} hitSlop={10} accessibilityLabel="Settings">
      <Ionicons name="menu" size={26} color={colors.text} />
    </TouchableOpacity>
  );
}
