import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import KeyboardAware from '../../components/KeyboardAware';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '../../components/AuthHeader';
import AuthInput from '../../components/AuthInput';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import { useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation, route }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // กรอก email ให้อัตโนมัติเมื่อกลับมาจากหน้าสมัครสมาชิก
  useEffect(() => {
    if (route.params?.registeredEmail) setEmail(route.params.registeredEmail);
  }, [route.params?.registeredEmail]);

  // Use Case: Login -> include "verify password", extend "display login error"
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage(t('auth.errFillLogin'));
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrorMessage(t('auth.errEmailFormat'));
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      const { token, user } = await authService.login({ email: email.trim(), password });
      await login(token, user); // isLoggedIn = true -> RootNavigator สลับไปหน้า Bottom Tabs
    } catch (error) {
      setErrorMessage(error.message || t('auth.loginFailed'));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAware style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AuthHeader title={t('auth.loginTitle')} />

          <AuthInput
            icon="mail"
            placeholder={t('auth.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <AuthInput
            icon="lock"
            placeholder={t('auth.password')}
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          {errorMessage ? (
            <Text style={styles.error} accessibilityRole="alert">
              {errorMessage}
            </Text>
          ) : null}

          <TouchableOpacity style={styles.signUpLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signUpText}>{t('auth.signUp')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('auth.login')}</Text>}
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
    error: { color: c.error, marginBottom: 8, fontSize: 13 },
    signUpLink: { alignSelf: 'center', paddingVertical: 12, marginBottom: 24 },
    signUpText: { fontSize: 15, fontWeight: '600', color: c.text },
    button: {
      backgroundColor: c.primary,
      borderRadius: 24,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: c.onPrimary, fontSize: 15, fontWeight: '700' },
  });
