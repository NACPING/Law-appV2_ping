import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import SettingSwitch from '../../components/SettingSwitch';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useThemedStyles } from '../../context/ThemeContext';
import * as userService from '../../services/userService';

// การตั้งค่าที่เก็บไว้กับบัญชี (backend) — ใช้ร่วมกันโดยหน้า Notifications และ Posting
// items = [{ key, label, hint, defaultOn }] · defaultOn = ค่าเริ่มต้นใน backend (ใช้ระหว่างยังไม่มีค่าจริง)
// เปลี่ยนแล้วบันทึกทันที ถ้าบันทึกไม่สำเร็จคืนค่าเดิม
function AccountSwitches({ items, note }) {
  const { user, updateUser } = useAuth();
  const styles = useThemedStyles(makeStyles);
  const [saving, setSaving] = useState(null); // key ที่กำลังบันทึก
  const [error, setError] = useState('');

  const toggle = async (key, value) => {
    const before = user[key];
    updateUser({ [key]: value }); // แสดงผลทันที ไม่ต้องรอเซิร์ฟเวอร์
    setSaving(key);
    setError('');
    try {
      const { user: updated } = await userService.updateProfile({ [key]: value });
      updateUser(updated);
    } catch (e) {
      updateUser({ [key]: before });
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {items.map((item) => (
        <SettingSwitch
          key={item.key}
          label={item.label}
          hint={item.hint}
          value={user[item.key] ?? item.defaultOn}
          onValueChange={(v) => toggle(item.key, v)}
          disabled={saving === item.key}
        />
      ))}
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </ScrollView>
  );
}

// Settings > Notifications — ปิดประเภทไหน backend ไม่สร้างการแจ้งเตือนประเภทนั้น
// admin ไม่มีห้องแชท จึงไม่แสดงสวิตช์ข้อความแชท
export function NotificationSettingsScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const items = [
    { key: 'notifyPosts', label: t('prefs.notifPosts'), hint: t('prefs.notifPostsHint'), defaultOn: true },
    ...(user.role === 'ADMIN' ? [] : [{ key: 'notifyChat', label: t('prefs.notifChat'), hint: t('prefs.notifChatHint'), defaultOn: true }]),
    { key: 'notifyCases', label: t('prefs.notifCases'), hint: t('prefs.notifCasesHint'), defaultOn: true },
    // admin ไม่อยู่ในระบบผู้ติดตาม
    ...(user.role === 'ADMIN'
      ? []
      : [{ key: 'notifyFollows', label: t('prefs.notifFollows'), hint: t('prefs.notifFollowsHint'), defaultOn: true }]),
  ];
  return <AccountSwitches items={items} note={t('prefs.notifNote')} />;
}

// Settings > Posting — เฉพาะลูกความ (เมนูนี้ไม่แสดงให้ทนาย/admin)
export function PostingSettingsScreen() {
  const { t } = useLanguage();
  return (
    <AccountSwitches
      items={[{ key: 'postAnonymously', label: t('prefs.postAnonymous'), hint: t('prefs.postAnonymousHint'), defaultOn: false }]}
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingTop: 12, paddingBottom: 32 },
    error: { color: c.error, marginHorizontal: 16, marginTop: 12 },
    note: { fontSize: 12, color: c.textMuted, marginHorizontal: 16, marginTop: 12, lineHeight: 18 },
  });
