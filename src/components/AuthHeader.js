import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// หัวหน้าจอ: ชื่อหน้า + โลโก้นกพิราบ + สโลแกน
export default function AuthHeader({ title }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <FontAwesome5 name="dove" size={48} color={colors.text} style={styles.logo} />
      <Text style={styles.subtitle}>{t('auth.slogan')}</Text>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    header: { alignItems: 'center', marginBottom: 28 },
    title: { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 20 },
    logo: { marginBottom: 8 },
    subtitle: { fontSize: 13, color: c.accent, fontWeight: '600' },
  });
