import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

// กันคีย์บอร์ดบังช่องพิมพ์ — ใช้แทน KeyboardAvoidingView ทุกหน้า
// Android รุ่นใหม่ (Expo 57) แสดงแอปแบบเต็มจอ (edge-to-edge) หน้าจอจึงไม่หดเองเมื่อคีย์บอร์ดขึ้น
// ต้องใช้ behavior="padding" ทั้ง iOS และ Android และชดเชยความสูงของ header ด้านบน
export default function KeyboardAware({ style, children }) {
  const headerHeight = useHeaderHeight();
  return (
    <KeyboardAvoidingView
      style={style}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      keyboardVerticalOffset={headerHeight}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
