import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/community/Avatar';
import FollowButton from '../../components/FollowButton';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import * as userService from '../../services/userService';
import { displayName } from '../../utils/format';

// รายชื่อผู้ติดตาม / กำลังติดตาม (params: userId, type = 'followers' | 'following') — ทุกคนดูได้
// แตะชื่อ = เปิดโปรไฟล์คนนั้น · มีปุ่มติดตามท้ายแถว (ไม่แสดงกับตัวเองและ admin)
export default function FollowListScreen({ route, navigation }) {
  const { userId, type } = route.params;
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: type === 'followers' ? t('nav.followers') : t('nav.following') });
  }, [navigation, type, t]);

  const load = useCallback(async () => {
    try {
      const d = await userService.getFollowList(userId, type);
      setUsers(d.users);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, [userId, type]);

  // กลับมาหน้านี้แล้วโหลดใหม่ (อาจกดติดตาม/เลิกติดตามในโปรไฟล์ที่เปิดไป)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (users === null) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" color={colors.accent} />}
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={users}
      keyExtractor={(u) => u.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.push('UserProfile', { userId: item.id })}
          activeOpacity={0.7}
          accessibilityLabel={displayName(item)}
        >
          <Avatar author={item} size={44} />
          <View style={styles.text}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName(item)}
            </Text>
            <Text style={styles.role}>{t(`profile.roles.${item.role}`)}</Text>
          </View>
          {!item.isSelf && (
            <FollowButton
              userId={item.id}
              name={displayName(item)}
              isFollowing={item.isFollowing}
              compact
              onChange={(isFollowing) =>
                setUsers((prev) => prev.map((u) => (u.id === item.id ? { ...u, isFollowing } : u)))
              }
            />
          )}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>
          {error || (type === 'followers' ? t('follow.emptyFollowers') : t('follow.emptyFollowing'))}
        </Text>
      }
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
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: c.background },
    error: { color: c.error, textAlign: 'center' },
    list: { paddingVertical: 8 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
    text: { flex: 1, marginLeft: 12, marginRight: 8 },
    name: { fontSize: 15, fontWeight: '600', color: c.text },
    role: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    empty: { textAlign: 'center', color: c.textMuted, marginTop: 40 },
  });
