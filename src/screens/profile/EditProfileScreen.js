import React, { useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import KeyboardAware from '../../components/KeyboardAware';
import Avatar from '../../components/community/Avatar';
import { useAuth } from '../../context/AuthContext';
import * as userService from '../../services/userService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { confirmAction } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

const MAX_BIO = 150;
const MAX_ABOUT = 1000;

// Settings > Account — แก้ไขรูป ชื่อ เบอร์โทร คำแนะนำตัว (+ รายละเอียดทนาย)
// อีเมล เลขบัตร และบทบาทแก้ไม่ได้
export default function EditProfileScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user, updateUser } = useAuth();
  const isLawyer = user.role === 'LAWYER';
  const scrollRef = useRef(null);
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    phone: user.phone ?? '',
    bio: user.bio ?? '',
    about: user.about ?? '',
    showContact: Boolean(user.showContact),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  // เปลี่ยนรูปมีผลทันที (ไม่ต้องกดบันทึก) — backend ลบไฟล์รูปเก่าให้
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, // ย่อขนาดไฟล์ก่อนอัปโหลด (และแปลง HEIC เป็น JPEG)
    });
    if (result.canceled) return;
    setAvatarBusy(true);
    setError('');
    try {
      const { user: updated } = await userService.updateAvatar(result.assets[0]);
      updateUser(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    const ok = await confirmAction(t('profile.removePhotoTitle'), t('profile.removePhotoConfirm'), t('common.delete'));
    if (!ok) return;
    setAvatarBusy(true);
    setError('');
    try {
      const { user: updated } = await userService.removeAvatar();
      updateUser(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError(t('profile.errName'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { firstName, lastName, phone, bio, about, showContact } = form;
      const { user: updated } = await userService.updateProfile({
        firstName,
        lastName,
        phone,
        bio,
        ...(isLawyer && { about, showContact }),
      });
      updateUser(updated);
      navigation.goBack(); // หน้า Profile โหลดใหม่เองเมื่อกลับไป
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <KeyboardAware style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarBlock}>
          <Avatar author={user} size={96} />
          {avatarBusy ? (
            <ActivityIndicator style={styles.avatarActions} color={colors.accent} />
          ) : (
            <View style={styles.avatarActions}>
              <TouchableOpacity onPress={pickAvatar} hitSlop={6}>
                <Text style={styles.link}>{t('profile.changePhoto')}</Text>
              </TouchableOpacity>
              {user.avatarUrl ? (
                <TouchableOpacity onPress={removeAvatar} hitSlop={6}>
                  <Text style={[styles.link, styles.danger]}>{t('profile.removePhoto')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>

        <Field label={t('profile.firstName')} value={form.firstName} onChangeText={set('firstName')} maxLength={50} />
        <Field label={t('profile.lastName')} value={form.lastName} onChangeText={set('lastName')} maxLength={50} />
        <Field label={t('profile.phone')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" maxLength={20} />
        <Field
          label={t('profile.bio', { n: form.bio.length, max: MAX_BIO })}
          value={form.bio}
          onChangeText={set('bio')}
          placeholder={t('profile.bioPlaceholder')}
          maxLength={MAX_BIO}
          multiline
          scrollRef={scrollRef}
        />

        {isLawyer && (
          <>
            <Field
              label={t('profile.about', { n: form.about.length, max: MAX_ABOUT })}
              value={form.about}
              onChangeText={set('about')}
              placeholder={t('profile.aboutPlaceholder')}
              maxLength={MAX_ABOUT}
              multiline
              tall
              scrollRef={scrollRef}
            />
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.switchLabel}>{t('profile.showContact')}</Text>
                <Text style={styles.hint}>{t('profile.showContactHint')}</Text>
              </View>
              <Switch
                value={form.showContact}
                onValueChange={set('showContact')}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
          </>
        )}

        <Text style={styles.label}>{t('profile.emailReadonly')}</Text>
        <Text style={styles.readonly}>{user.email}</Text>

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <TouchableOpacity style={[styles.button, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('common.save')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAware>
  );
}

// ช่องหลายบรรทัดมีความสูงสูงสุด (ข้อความยาวเลื่อนอยู่ในช่อง) — ถ้าปล่อยให้ขยายเรื่อยๆ
// ตำแหน่งที่พิมพ์จะไหลลงไปใต้คีย์บอร์ด · แตะช่องแล้วเลื่อนหน้าให้ทั้งช่องอยู่เหนือคีย์บอร์ด
function Field({ label, tall, multiline, scrollRef, ...inputProps }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [top, setTop] = useState(0);
  const scrollIntoView = () => {
    // รอคีย์บอร์ดขึ้นและ KeyboardAware หดพื้นที่เสร็จก่อน
    setTimeout(() => scrollRef?.current?.scrollTo({ y: Math.max(top - 12, 0), animated: true }), 300);
  };

  return (
    <View onLayout={(e) => setTop(e.nativeEvent.layout.y)}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline, tall && styles.tall]}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : undefined}
        onFocus={multiline ? scrollIntoView : undefined}
        {...inputProps}
      />
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    scroll: { padding: 20 },
    avatarBlock: { alignItems: 'center', marginBottom: 20 },
    avatarActions: { flexDirection: 'row', gap: 24, marginTop: 10, minHeight: 20 },
    link: { color: c.accent, fontWeight: '600', fontSize: 14 },
    danger: { color: c.error },
    label: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 6 },
    input: {
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: c.text,
      marginBottom: 16,
    },
    multiline: { minHeight: 70, maxHeight: 110 },
    tall: { minHeight: 140, maxHeight: 200 },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    switchLabel: { fontSize: 14, color: c.text, fontWeight: '600' },
    hint: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    readonly: { fontSize: 14, color: c.textMuted, marginBottom: 20 },
    error: { color: c.error, marginBottom: 12 },
    button: {
      backgroundColor: c.primary,
      borderRadius: 24,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: { opacity: 0.7 },
    buttonText: { color: c.onPrimary, fontSize: 15, fontWeight: '700' },
  });
