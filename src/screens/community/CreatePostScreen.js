import React, { useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import KeyboardAware from '../../components/KeyboardAware';
import { useAuth } from '../../context/AuthContext';
import * as postService from '../../services/postService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const MAX_TITLE = 150;

// Use Case: Posting (extend: create post)
export default function CreatePostScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState([]); // assets จาก expo-image-picker
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef(null);
  const [contentTop, setContentTop] = useState(0);

  // แตะช่องรายละเอียดแล้วเลื่อนหน้าให้ทั้งช่องอยู่เหนือคีย์บอร์ด (รอคีย์บอร์ดขึ้นก่อน)
  // คู่กับ maxHeight ของช่อง — ข้อความยาวเลื่อนอยู่ในช่อง ไม่ไหลลงไปใต้คีย์บอร์ด
  const scrollToContent = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(contentTop - 12, 0), animated: true }), 300);
  };

  const remaining = postService.MAX_IMAGES - images.length;

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7, // ย่อขนาดไฟล์ก่อนอัปโหลด (และแปลง HEIC เป็น JPEG)
    });
    if (result.canceled) return;
    setImages((prev) => [...prev, ...result.assets].slice(0, postService.MAX_IMAGES));
    setError('');
  };

  const removeImage = (uri) => setImages((prev) => prev.filter((img) => img.uri !== uri));

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError(t('community.errTitleContent'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await postService.createPost({ title: title.trim(), content: content.trim(), isAnonymous, images });
      navigation.goBack(); // หน้า feed จะโหลดใหม่เองเมื่อกลับไป
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  // กันไว้อีกชั้น (ปุ่ม + ถูกซ่อนสำหรับทนายอยู่แล้ว และ backend ก็ปฏิเสธ)
  if (user?.role !== 'CLIENT') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.hint}>{t('community.lawyerCannotPost')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAware style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>{t('community.title')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('community.titlePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={MAX_TITLE}
        />

        <View onLayout={(e) => setContentTop(e.nativeEvent.layout.y)}>
          <Text style={styles.label}>{t('community.content')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('community.contentPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            onFocus={scrollToContent}
            multiline
            textAlignVertical="top"
            maxLength={5000}
          />
        </View>

        <Text style={styles.label}>
          {t('community.images')} <Text style={styles.hint}>({images.length}/{postService.MAX_IMAGES})</Text>
        </Text>
        <View style={styles.imageGrid}>
          {images.map((img) => (
            <View key={img.uri} style={styles.imageTile}>
              <Image source={{ uri: img.uri }} style={styles.imageThumb} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage(img.uri)}
                hitSlop={8}
                accessibilityLabel={t('community.removeImage')}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {remaining > 0 && (
            <TouchableOpacity style={[styles.imageTile, styles.addTile]} onPress={pickImages} accessibilityLabel={t('community.addImage')}>
              <Ionicons name="image-outline" size={26} color={colors.accent} />
              <Text style={styles.addText}>{t('community.addImage')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Text style={styles.switchLabel}>{t('community.anonymous')}</Text>
            <Text style={styles.hint}>{t('community.anonymousHint')}</Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor="#fff"
          />
        </View>

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <TouchableOpacity style={[styles.button, saving && styles.disabled]} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('community.submit')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAware>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
    flex: { flex: 1 },
    scroll: { padding: 20 },
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
    textArea: { minHeight: 160, maxHeight: 220 },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    imageTile: { width: 76, height: 76, borderRadius: 8 },
    imageThumb: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: c.surfaceAlt },
    removeBtn: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addTile: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primaryLight,
    },
    addText: { fontSize: 11, color: c.accent, marginTop: 2 },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    switchLabel: { fontSize: 14, color: c.text, fontWeight: '600' },
    hint: { fontSize: 12, color: c.textMuted, marginTop: 2 },
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
