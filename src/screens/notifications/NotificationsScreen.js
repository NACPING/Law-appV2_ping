import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/community/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import * as notificationService from '../../services/notificationService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { timeAgo } from '../../utils/format';
import { notificationText } from '../../utils/labels';
import { useLanguage } from '../../context/LanguageContext';

// ไอคอนแทนรูปผู้ส่ง สำหรับแจ้งเตือนจากระบบ/admin
const TYPE_ICON = {
  REQUEST_APPROVED: 'checkmark-circle',
  REQUEST_REJECTED: 'close-circle',
  NEW_REQUEST: 'document-text',
  CASE_ASSIGNED: 'briefcase',
  CLOSE_REQUESTED: 'hand-left',
  CLOSE_CANCELLED: 'refresh-circle',
  CLOSE_ACCEPTED: 'lock-closed',
  CLOSE_DECLINED: 'chatbubbles',
};

// Figma "Notification": รายการแจ้งเตือน แตะแล้วพาไปที่เรื่องนั้น
export default function NotificationsScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const { setUnreadCount, subscribe } = useNotifications();
  const [items, setItems] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await notificationService.getNotifications();
      setItems(d.notifications);
      setUnreadCount(d.unreadCount);
      setError('');
    } catch (e) {
      setError(e.message);
      setItems((prev) => prev ?? []);
    } finally {
      setRefreshing(false);
    }
  }, [setUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // แจ้งเตือนใหม่ระหว่างเปิดหน้านี้ → เอาขึ้นบนสุด (ถ้าเป็นรายการเดิมที่รวมจำนวน ให้แทนที่)
  useEffect(
    () =>
      subscribe((n) =>
        setItems((prev) => (prev ? [n, ...prev.filter((x) => x.id !== n.id)] : prev))
      ),
    [subscribe]
  );

  const handleReadAll = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev?.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      setError(e.message);
    }
  }, [setUnreadCount]);

  const hasUnread = items?.some((n) => !n.read);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: hasUnread
        ? () => (
            <TouchableOpacity onPress={handleReadAll} hitSlop={8}>
              <Text style={styles.readAll}>{t('notif.readAll')}</Text>
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [navigation, hasUnread, handleReadAll, styles, t]);

  // ไปยังเรื่องที่แจ้งเตือน (ข้ามแท็บได้ — ให้หน้ารายการของแท็บนั้นอยู่ข้างใต้ กดย้อนกลับได้)
  const open = async (n) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      notificationService.markRead(n.id).then((d) => setUnreadCount(d.unreadCount)).catch(() => {});
    }
    const go = (tab, screen, params) => navigation.navigate('Tabs', { screen: tab, params: { screen, params, initial: false } });
    if (n.targetType === 'post') go('Community', 'PostDetail', { postId: n.targetId });
    else if (n.targetType === 'chat') go('Chat', 'ChatRoom', { requestId: n.targetId });
    else if (n.targetType === 'request') {
      go('Chat', user?.role === 'ADMIN' ? 'AdminReview' : 'RequestStatus', { requestId: n.targetId });
    }
    // มีผู้ติดตามใหม่ → รายชื่อผู้ติดตามของเราเอง (targetId = id ของเรา)
    else if (n.targetType === 'followers') go('Profile', 'FollowList', { userId: n.targetId, type: 'followers' });
  };

  if (items === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(n) => n.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={colors.accent}
        />
      }
      renderItem={({ item }) => {
        const { title, body } = notificationText(item);
        return (
        <TouchableOpacity
          style={[styles.card, !item.read && styles.unread]}
          onPress={() => open(item)}
          accessibilityLabel={`${item.read ? '' : t('notif.unreadPrefix')}${title}`}
        >
          {TYPE_ICON[item.type] ? (
            <View style={styles.iconWrap}>
              <Ionicons name={TYPE_ICON[item.type]} size={24} color={colors.accent} />
            </View>
          ) : (
            <Avatar author={item.actor} size={44} />
          )}
          <View style={styles.text}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {body}
            </Text>
            <Text style={styles.time}>{timeAgo(item.updatedAt)}</Text>
          </View>
          {!item.read && <View style={styles.dot} />}
        </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={56} color={colors.textFaint} />
          <Text style={styles.emptyText}>{error || t('notif.empty')}</Text>
        </View>
      }
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    list: { padding: 16, paddingBottom: 32 },
    readAll: { color: c.accent, fontWeight: '600', fontSize: 14 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      marginBottom: 10,
      borderRadius: 12,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    unread: { backgroundColor: c.primaryLight, borderColor: c.border },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1 },
    title: { fontSize: 14, fontWeight: '700', color: c.text },
    body: { fontSize: 12, color: c.textSecondary, marginTop: 2, lineHeight: 17 },
    time: { fontSize: 11, color: c.textMuted, marginTop: 4 },
    dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: c.badge },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: c.textMuted, marginTop: 10 },
  });
