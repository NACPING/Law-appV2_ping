import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// กระดิ่งมุมขวาบน (ตาม Figma) พร้อมตัวเลขแจ้งเตือนที่ยังไม่อ่าน
export default function BellButton() {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { unreadCount } = useNotifications();
  const label = unreadCount > 0 ? t('bell.labelUnread', { count: unreadCount }) : t('bell.label');

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate('Notifications')}
      hitSlop={8}
      accessibilityLabel={label}
    >
      <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={23} color={colors.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    // เว้นที่ว่างซ้ายล่างไว้ให้ตัวเลข — ถ้าตัวเลขล้นออกนอกกรอบปุ่ม Android จะตัดขอบทิ้ง
    button: { paddingLeft: 9, paddingBottom: 7 },
    badge: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      minWidth: 17,
      height: 17,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: c.badge,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: c.background, // ขอบสีเดียวกับพื้นหลัง ให้ตัวเลขแยกจากกระดิ่ง
    },
    badgeText: { color: c.onPrimary, fontSize: 10, fontWeight: '700' },
  });
