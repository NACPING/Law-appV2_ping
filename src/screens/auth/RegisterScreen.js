import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import KeyboardAware from '../../components/KeyboardAware';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '../../components/AuthHeader';
import AuthInput from '../../components/AuthInput';
import DatePickerField from '../../components/DatePickerField';
import * as authService from '../../services/authService';
import { useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// label/placeholder = key ใน i18n (แปลตอนแสดงผล)
const ROLES = [
  { value: 'client', label: 'auth.roleClient' },
  { value: 'lawyer', label: 'auth.roleLawyer' },
];

const FIELDS = [
  { key: 'idCardOrPass', icon: 'credit-card', placeholder: 'auth.idCard' },
  { key: 'firstName', icon: 'user', placeholder: 'auth.firstName' },
  { key: 'lastName', icon: 'user', placeholder: 'auth.lastName' },
  { key: 'email', icon: 'mail', placeholder: 'auth.email', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'password', icon: 'lock', placeholder: 'auth.password', secureTextEntry: true },
  { key: 'confirmPassword', icon: 'lock', placeholder: 'auth.confirmPassword', secureTextEntry: true },
  { key: 'phone', icon: 'phone', placeholder: 'auth.phone', keyboardType: 'phone-pad' },
];

// วันเกิดไม่ใช่ช่องพิมพ์ (เลือกจาก DatePickerField) จึงไม่อยู่ใน FIELDS — เก็บเป็น 'YYYY-MM-DD'
const INITIAL_FORM = FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), { role: 'client', dob: '' });

// คืน key ของข้อความผิดพลาดใน i18n ('' = ผ่าน)
function validate(form) {
  if (!form.idCardOrPass || !form.firstName || !form.lastName || !form.email || !form.password) {
    return 'auth.errRequired';
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) return 'auth.errEmailFormat';
  if (form.password.length < 6) return 'auth.errPasswordShort';
  if (form.password !== form.confirmPassword) return 'auth.errPasswordMismatch';
  if (form.dob && !DATE_PATTERN.test(form.dob)) return 'auth.errDob';
  return '';
}

export default function RegisterScreen({ navigation }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    const error = validate(form);
    if (error) {
      setErrorMessage(t(error));
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await authService.register({ ...payload, email: payload.email.trim() });
      Alert.alert(t('auth.registerSuccessTitle'), t('auth.registerSuccessBody'));
      // popTo = ย้อนกลับไปหน้า Login เดิม (navigate ใน v7 จะซ้อนหน้าใหม่)
      navigation.popTo('Login', { registeredEmail: payload.email.trim() });
    } catch (err) {
      setErrorMessage(err.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAware style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AuthHeader title={t('auth.signUpTitle')} />

          {/* เลือกบทบาทตอนสมัคร: Client / Lawyer */}
          <View style={styles.roleRow} accessibilityRole="radiogroup">
            {ROLES.map((r) => {
              const selected = form.role === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.roleBtn, selected && styles.roleBtnSelected]}
                  onPress={() => handleChange('role', r.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.roleText, selected && styles.roleTextSelected]}>{t(r.label)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {FIELDS.map(({ key, placeholder, ...inputProps }) => (
            <AuthInput
              key={key}
              {...inputProps}
              placeholder={t(placeholder)}
              value={form[key]}
              onChangeText={(text) => handleChange(key, text)}
            />
          ))}
          <DatePickerField value={form.dob} onChange={(dob) => handleChange('dob', dob)} placeholder={t('auth.dob')} />

          {errorMessage ? (
            <Text style={styles.error} accessibilityRole="alert">
              {errorMessage}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('auth.signUp')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.popTo('Login')}>
            <Text style={styles.loginText}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAware>
    </SafeAreaView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    roleRow: {
      flexDirection: 'row',
      backgroundColor: c.primaryLight,
      borderRadius: 24,
      padding: 4,
      marginBottom: 16,
    },
    roleBtn: { flex: 1, height: 36, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    roleBtnSelected: { backgroundColor: c.primary },
    roleText: { color: c.accent, fontWeight: '600' },
    roleTextSelected: { color: c.onPrimary },
    error: { color: c.error, marginBottom: 8, fontSize: 13 },
    button: {
      backgroundColor: c.primary,
      borderRadius: 24,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: c.onPrimary, fontSize: 15, fontWeight: '700' },
    loginLink: { alignSelf: 'center', paddingVertical: 10 },
    loginText: { fontSize: 14, color: c.text },
  });
