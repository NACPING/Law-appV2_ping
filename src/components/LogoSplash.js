import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// หน้าโลโก้ตอนเปิดแอป (ระหว่างโหลดข้อมูลการล็อกอิน)
// หน้าโหลดของระบบ/Expo Go ขึ้นก่อนแอปอ่านค่า Dark mode ได้ จึงทำหน้านี้เองให้นกเปลี่ยนสีตามธีมของแอป:
// โหมดมืด = นกสีขาว, โหมดสว่าง = นกสีกรม
export default function LogoSplash() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <FontAwesome5 name="dove" size={88} color={isDark ? colors.text : colors.primary} />
      <Text style={styles.name}>LegalMate</Text>
      <Text style={styles.slogan}>{t('auth.slogan')}</Text>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    name: { marginTop: 18, fontSize: 26, fontWeight: '700', color: c.text },
    slogan: { marginTop: 6, fontSize: 13, fontWeight: '600', color: c.accent },
  });
