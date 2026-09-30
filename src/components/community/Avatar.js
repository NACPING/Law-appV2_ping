import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_URL } from '../../services/apiClient';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';

const PALETTE = ['#5C6BC0', '#26A69A', '#EF6C00', '#8D6E63', '#AB47BC', '#42A5F5'];

// backend เก็บรูปเป็น path "/uploads/..." — ต่อกับที่อยู่เซิร์ฟเวอร์ที่แอปใช้อยู่ (มือถือเรียกผ่าน IP ของคอม)
const resolveUri = (url) => (url.startsWith('/') ? `${SERVER_URL}${url}` : url);

// รูปโปรไฟล์: ใช้รูปที่อัปโหลดไว้ ถ้าไม่มีใช้ตัวอักษรแรกของชื่อ · author = null คือไม่ระบุตัวตน
export default function Avatar({ author, size = 36, borderColor }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const style = [styles.base, { width: size, height: size, borderRadius: size / 2, borderColor: borderColor ?? colors.background }];

  if (!author) {
    return (
      <View style={[style, { backgroundColor: '#9E9E9E' }]}>
        <Ionicons name="person" size={size * 0.55} color="#fff" />
      </View>
    );
  }

  if (author.avatarUrl) {
    return <Image source={{ uri: resolveUri(author.avatarUrl) }} style={[style, styles.image]} accessibilityIgnoresInvertColors />;
  }

  const bg = PALETTE[(author.id?.charCodeAt(0) ?? 0) % PALETTE.length];
  return (
    <View style={[style, { backgroundColor: bg }]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{author.firstName?.[0] ?? '?'}</Text>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    image: { backgroundColor: c.surfaceAlt },
    initial: { color: c.onPrimary, fontWeight: '700' },
  });
