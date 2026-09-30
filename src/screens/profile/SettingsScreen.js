import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { confirmAction } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGES } from '../../i18n';

// หน้า Settings ตาม Figma — แสดงเฉพาะเมนูที่ใช้งานได้จริง (ตกลงกับเจ้าของแล้ว)
// เมนูอื่นใน Figma (Notifications, Posting, Reading) ยังไม่ทำ
export default function SettingsScreen({ navigation }) {
  const { t, lang } = useLanguage();
  const { colors, isDark, setDarkMode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { logout } = useAuth();

  const handleLogout = async () => {
    const ok = await confirmAction(t('settings.logout'), t('settings.logoutConfirm'), t('settings.logout'));
    if (ok) logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>{t('settings.account')}</Text>
      <Row icon="user" label={t('settings.accountRow')} onPress={() => navigation.navigate('EditProfile')} />
      <Row icon="lock" label={t('settings.privacy')} onPress={() => navigation.navigate('ChangePassword')} />

      <Text style={styles.section}>{t('settings.preferences')}</Text>
      {/* แตะได้ทั้งแถว — สวิตช์เล็กกดยากบนมือถือ */}
      <TouchableOpacity
        style={styles.row}
        onPress={() => setDarkMode(!isDark)}
        activeOpacity={0.6}
        accessibilityRole="switch"
        accessibilityState={{ checked: isDark }}
        accessibilityLabel={t('settings.darkMode')}
      >
        <Feather name="moon" size={18} color={colors.text} style={styles.rowIcon} />
        <Text style={styles.rowLabel}>{t('settings.darkMode')}</Text>
        <Switch
          value={isDark}
          onValueChange={setDarkMode}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor="#fff"
        />
      </TouchableOpacity>
      <Row
        icon="globe"
        label={t('settings.language')}
        value={LANGUAGES.find((l) => l.code === lang)?.label}
        onPress={() => navigation.navigate('Language')}
      />

      <Text style={styles.section}>{t('settings.support')}</Text>
      <Row icon="help-circle" label={t('settings.help')} onPress={() => navigation.navigate('Help')} />

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={18} color={colors.text} />
        <Text style={styles.logoutText}>{t('settings.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// value = ค่าปัจจุบันที่แสดงหน้าลูกศร (เช่น ภาษาที่เลือก)
function Row({ icon, label, value, onPress }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <Feather name={icon} size={18} color={colors.text} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Feather name="chevron-right" size={20} color={colors.text} />
    </TouchableOpacity>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: 32 },
    section: { fontSize: 12, color: c.textMuted, marginTop: 18, marginBottom: 4, marginHorizontal: 16 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      marginTop: -StyleSheet.hairlineWidth,
    },
    rowIcon: { width: 26 },
    rowLabel: { flex: 1, fontSize: 14, color: c.text },
    rowValue: { fontSize: 13, color: c.textMuted, marginRight: 4 },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 48,
      marginHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: c.surfaceAlt,
      borderRadius: 4,
    },
    logoutText: { color: c.text, fontWeight: '600' },
  });
