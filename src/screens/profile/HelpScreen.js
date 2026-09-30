import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Settings > Help and support — วิธีใช้งานแต่ละส่วนของแอปแบบสั้นๆ (คำถาม-คำตอบอยู่ใน i18n: help)
export default function HelpScreen() {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {t('help').map((topic) => (
        <View key={topic.q} style={styles.card}>
          <Text style={styles.q}>{topic.q}</Text>
          <Text style={styles.a}>{topic.a}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 32 },
    card: { borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 14, marginBottom: 10 },
    q: { fontSize: 14, fontWeight: '700', color: c.accent, marginBottom: 6 },
    a: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
