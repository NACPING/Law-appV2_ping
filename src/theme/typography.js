import { Platform } from 'react-native';

// ฟอนต์หัวข้อบนสุดของทุกหน้า (ชื่อหน้า) — แบบเดียวกับ "Communication" ใน Figma
// ใช้ฟอนต์ serif ที่มีในเครื่องอยู่แล้ว ไม่ต้องโหลดฟอนต์เพิ่ม
export const headerTitleStyle = {
  fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'Georgia, serif' }),
  fontSize: 20,
};
