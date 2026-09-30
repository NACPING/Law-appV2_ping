import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// เส้นคั่น "or" + ปุ่ม Facebook / Google / Apple (ยังไม่ผูก OAuth)
export default function SocialLogin() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>{t('auth.or')}</Text>
        <View style={styles.divider} />
      </View>
      <View style={styles.row}>
        {['facebook', 'google', 'apple'].map((name) => (
          <TouchableOpacity key={name} style={styles.btn} accessibilityLabel={t('auth.loginWith', { provider: name })}>
            <FontAwesome name={name} size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
    divider: { flex: 1, height: 1, backgroundColor: c.textFaint },
    dividerText: { marginHorizontal: 10, color: c.textMuted },
    row: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
    btn: { padding: 6 },
  });
