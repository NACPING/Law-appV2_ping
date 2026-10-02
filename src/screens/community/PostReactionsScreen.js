import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/community/Avatar';
import { REACTIONS, reactionEmoji } from '../../utils/reactions';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import * as postService from '../../services/postService';
import { displayName } from '../../utils/format';

// รายชื่อคนที่แสดงความรู้สึกต่อโพสต์ (params: postId) — ทุกคนดูได้
// แท็บบน: ทั้งหมด + แต่ละแบบที่มีคนกด · แตะชื่อ = เปิดโปรไฟล์
export default function PostReactionsScreen({ route, navigation }) {
  const { postId } = route.params;
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('reaction.title') });
  }, [navigation, t]);

  const load = useCallback(async () => {
    try {
      const d = await postService.getReactions(postId);
      setUsers(d.users);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, [postId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const tabs = useMemo(() => {
    if (!users) return [];
    const counted = REACTIONS.map((r) => ({ key: r.type, label: r.emoji, n: users.filter((u) => u.reaction === r.type).length }));
    return [{ key: 'ALL', label: t('reaction.all'), n: users.length }, ...counted.filter((c) => c.n > 0)];
  }, [users, t]);

  if (users === null) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" color={colors.accent} />}
      </View>
    );
  }

  const shown = filter === 'ALL' ? users : users.filter((u) => u.reaction === filter);

  return (
    <View style={styles.container}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === tab.key }}
            accessibilityLabel={tab.key === 'ALL' ? `${tab.label} ${tab.n}` : `${t(`reaction.${tab.key}`)} ${tab.n}`}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label} {tab.n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.push('UserProfile', { userId: item.id })}
            activeOpacity={0.7}
            accessibilityLabel={`${displayName(item)} — ${t(`reaction.${item.reaction}`)}`}
          >
            <View style={styles.avatarBox}>
              <Avatar author={item} size={44} />
              <Text style={styles.badge}>{reactionEmoji(item.reaction)}</Text>
            </View>
            <View style={styles.text}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName(item)}
              </Text>
              <Text style={styles.role}>{t(`profile.roles.${item.role}`)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{error || t('reaction.empty')}</Text>}
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
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: c.background },
    error: { color: c.error, textAlign: 'center' },
    tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: c.surfaceAlt },
    tabActive: { backgroundColor: c.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: c.textMuted },
    tabTextActive: { color: c.onPrimary },
    list: { paddingVertical: 8 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
    // กรอบใหญ่กว่ารูปเล็กน้อย ให้อีโมจิมุมขวาล่างอยู่ในกรอบ (Android ตัดส่วนที่ล้นออก)
    avatarBox: { width: 50, height: 50 },
    badge: { position: 'absolute', right: 0, bottom: 0, fontSize: 16 },
    text: { flex: 1, marginLeft: 12 },
    name: { fontSize: 15, fontWeight: '600', color: c.text },
    role: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    empty: { textAlign: 'center', color: c.textMuted, marginTop: 40 },
  });
