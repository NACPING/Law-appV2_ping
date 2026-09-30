// โทนสีหลักตามแบบ Figma — มี 2 ชุด: สว่าง (ค่าเริ่มต้น) และมืด (Dark mode ใน Settings)
// ทุกหน้าดึงสีผ่าน useTheme()/useThemedStyles() จาก context/ThemeContext ห้ามเขียนสีตรงๆ
// ยกเว้นสีที่ตั้งใจให้เหมือนกันทั้งสองโหมด เช่น ปกหนังสือ แถบสีโปรไฟล์ ตัวอักษรขาวบนปุ่มสีกรม

export const lightColors = {
  primary: '#1E2B58', // น้ำเงินกรม: พื้นปุ่ม, Tab bar, ป้ายชื่อ
  onPrimary: '#FFFFFF', // ตัวอักษร/ไอคอนบนพื้น primary
  accent: '#1E2B58', // ตัวอักษร/ไอคอนสีแบรนด์บนพื้นหลังปกติ (โหมดมืดต้องสว่างขึ้นถึงจะอ่านออก)
  primaryLight: '#E8EBF5', // พื้นป้าย/ชิปที่เลือกอยู่
  background: '#FFFFFF',
  card: '#FFFFFF', // การ์ดโพสต์/คอมเมนต์/กล่องแชท (โหมดมืดต้องสว่างกว่าพื้นหลัง เพราะเงามองไม่เห็น)
  surface: '#F4F5F9', // การ์ด/กล่องพื้นเทาอ่อน
  surfaceAlt: '#EEEEEE', // พื้นรองอีกระดับ เช่น ช่องรูปที่ยังโหลดไม่เสร็จ, แถบเลือกโหมด
  inputBg: '#F5F5F7',
  inputBorder: '#E0E0E0',
  border: '#DDDDDD',
  text: '#111111',
  textSecondary: '#333333', // เนื้อหายาว
  textMuted: '#777777',
  textFaint: '#999999', // เวลา/ข้อความรองมาก
  icon: '#555555',
  error: '#C62828',
  success: '#2E7D32',
  successBg: '#2E9E44', // พื้นปุ่มอนุมัติ
  danger: '#C62828', // พื้นปุ่มปฏิเสธ/ลบ
  badge: '#E5484D',
  tabInactive: '#A3A3A3',
  overlay: 'rgba(0,0,0,0.45)',
  shadow: '#000000',
  bubbleMine: '#F3F5FB', // กล่องข้อความแชทของเราเอง
  onPrimaryMuted: '#C9D1F0', // ตัวอักษรรองบนพื้น primary เช่น ป้าย "ทนาย" ในป้ายชื่อ
  // แถบเตือนสีเหลือง (คำขอปิดเคส)
  warningBg: '#FFF6E0',
  warningBorder: '#F3D78A',
  warningText: '#6B4700',
  warningTextSoft: '#6B5A2E',
  warningIcon: '#8A5A00',
  // กล่องเหตุผลที่ถูกปฏิเสธ
  dangerBg: '#FDECEC',
  dangerTitle: '#7A1515',
  dangerText: '#5A1A1A',
};

export const darkColors = {
  primary: '#1E2B58',
  onPrimary: '#FFFFFF',
  accent: '#9FB3F0',
  primaryLight: '#27314F',
  background: '#121417',
  card: '#1A1D23',
  surface: '#1C1F26',
  surfaceAlt: '#2A2E36',
  inputBg: '#1E2128',
  inputBorder: '#353A45',
  border: '#30343D',
  text: '#ECEDEF',
  textSecondary: '#C9CCD2',
  textMuted: '#9A9EA6',
  textFaint: '#7D828B',
  icon: '#B0B4BC',
  error: '#FF6B6B',
  success: '#5CCB75',
  successBg: '#2E8B40',
  danger: '#C62828',
  badge: '#E5484D',
  tabInactive: '#8A93B0',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
  bubbleMine: '#222A40',
  onPrimaryMuted: '#C9D1F0',
  warningBg: '#3A2F12',
  warningBorder: '#6B5520',
  warningText: '#F3D78A',
  warningTextSoft: '#D9C48E',
  warningIcon: '#E0B24A',
  dangerBg: '#3A1E1E',
  dangerTitle: '#FF9A9A',
  dangerText: '#F0C4C4',
};
