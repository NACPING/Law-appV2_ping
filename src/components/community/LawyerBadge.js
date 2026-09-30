import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// light = อยู่บนป้ายชื่อสีกรม
export default function LawyerBadge({ author, light = false }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  if (author?.role !== 'LAWYER') return null;
  return <Text style={[styles.badge, light && styles.light]}>{t('common.lawyer')}</Text>;
}

const makeStyles = (c) =>
  StyleSheet.create({
    badge: { fontSize: 11, color: c.textMuted, marginLeft: 6 },
    light: { color: c.onPrimaryMuted },
  });
