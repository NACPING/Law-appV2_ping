import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import KeyboardAware from '../../components/KeyboardAware';
import AuthInput from '../../components/AuthInput';
import * as userService from '../../services/userService';
import { useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Settings > Privacy and security — เปลี่ยนรหัสผ่าน (ต้องยืนยันรหัสเดิม)
export default function ChangePasswordScreen() {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('profile.errFillAll'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('profile.errNewShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('profile.errNewMismatch'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { message } = await userService.changePassword({ currentPassword, newPassword });
      setSuccess(message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAware style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('profile.changePassword')}</Text>
        <AuthInput icon="lock" placeholder={t('profile.currentPassword')} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
        <AuthInput icon="key" placeholder={t('profile.newPassword')} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        <AuthInput icon="key" placeholder={t('profile.confirmNewPassword')} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <TouchableOpacity style={[styles.button, saving && styles.disabled]} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('profile.changePassword')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAware>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { padding: 20 },
    title: { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 14 },
    error: { color: c.error, marginBottom: 12 },
    success: { color: c.success, marginBottom: 12 },
    button: {
      backgroundColor: c.primary,
      borderRadius: 24,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    disabled: { opacity: 0.7 },
    buttonText: { color: c.onPrimary, fontSize: 15, fontWeight: '700' },
  });
