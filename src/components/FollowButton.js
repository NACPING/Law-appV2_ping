import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import * as userService from '../services/userService';
import { confirmAction } from '../utils/format';

// ปุ่มติดตาม/กำลังติดตาม (หน้าโปรไฟล์และรายชื่อผู้ติดตาม)
// เลิกติดตามต้องยืนยันก่อน กันกดพลาด · onChange(isFollowing, followerCount) ให้หน้าที่ใช้อัปเดตตัวเลข
export default function FollowButton({ userId, name, isFollowing, onChange, compact = false }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [busy, setBusy] = useState(false);

  const press = async () => {
    if (isFollowing) {
      const ok = await confirmAction(t('follow.unfollow'), t('follow.unfollowConfirm', { name }), t('follow.unfollow'));
      if (!ok) return;
    }
    setBusy(true);
    try {
      const d = isFollowing ? await userService.unfollow(userId) : await userService.follow(userId);
      onChange?.(d.isFollowing, d.followerCount);
    } catch {
      // ไม่สำเร็จ = สถานะเดิมยังถูกต้อง ไม่ต้องเปลี่ยนอะไร
    } finally {
      setBusy(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.btn, compact && styles.compact, isFollowing ? styles.outline : styles.filled]}
      onPress={press}
      disabled={busy}
      accessibilityRole="button"
      accessibilityState={{ selected: isFollowing, busy }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={isFollowing ? colors.accent : colors.onPrimary} />
      ) : (
        <Text style={[styles.text, isFollowing ? styles.outlineText : styles.filledText]}>
          {isFollowing ? t('follow.following') : t('follow.follow')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    btn: { minWidth: 110, height: 36, borderRadius: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
    compact: { minWidth: 92, height: 32, paddingHorizontal: 12 },
    filled: { backgroundColor: c.primary },
    outline: { borderWidth: 1, borderColor: c.accent, backgroundColor: c.background },
    text: { fontSize: 13, fontWeight: '700' },
    filledText: { color: c.onPrimary },
    outlineText: { color: c.accent },
  });
