import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { LANGUAGES } from '../../i18n';

// Settings > Language — เลือกแล้วมีผลทันทีทั้งแอป (ชื่อภาษาแสดงเป็นภาษาของตัวเองเสมอ จะได้หาเจอแม้อ่านภาษาปัจจุบันไม่ออก)
export default function LanguageScreen() {
  const { lang, setLanguage } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <ScrollView style={styles.container} accessibilityRole="radiogroup">
      {LANGUAGES.map((l) => {
        const selected = l.code === lang;
        return (
          <TouchableOpacity
            key={l.code}
            style={styles.row}
            onPress={() => setLanguage(l.code)}
            activeOpacity={0.6}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.selected]}>{l.label}</Text>
            {selected && <Feather name="check" size={20} color={colors.accent} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, paddingTop: 12 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      marginTop: -StyleSheet.hairlineWidth,
    },
    label: { flex: 1, fontSize: 15, color: c.text },
    selected: { color: c.accent, fontWeight: '700' },
  });
