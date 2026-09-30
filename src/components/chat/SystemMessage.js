import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { localeOf } from '../../i18n';
import { systemMessageText } from '../../utils/labels';
import { useLanguage } from '../../context/LanguageContext';

const formatTime = (d) =>
  new Date(d).toLocaleString(localeOf(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// ข้อความระบบกลางห้องแชท เช่น "ทนายขอปิดเคส", "ลูกความยินยอม — ปิดเคสแล้ว"
export default function SystemMessage({ message }) {
  useLanguage(); // render ใหม่เมื่อเปลี่ยนภาษา (ข้อความจาก utils ใช้ภาษาปัจจุบัน)
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        <Ionicons name="information-circle-outline" size={14} color={colors.icon} />
        <Text style={styles.text}>{systemMessageText(message)}</Text>
      </View>
      <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    row: { alignItems: 'center', marginVertical: 10, paddingHorizontal: 24 },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.surfaceAlt,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    text: { fontSize: 12, color: c.text, flexShrink: 1, textAlign: 'center' },
    time: { fontSize: 10, color: c.textFaint, marginTop: 3 },
  });
