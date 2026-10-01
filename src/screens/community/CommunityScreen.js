import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import BellButton from '../../components/BellButton';
import PostCard from '../../components/community/PostCard';
import { useAuth } from '../../context/AuthContext';
import * as postService from '../../services/postService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Use Case: Posting — หน้า Communication (รายการโพสต์)
export default function CommunityScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const canPost = user?.role === 'CLIENT'; // ทนายคอมเมนต์ได้อย่างเดียว
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  // แท็บ "ทั้งหมด" / "ติดตาม" — admin ไม่อยู่ในระบบผู้ติดตาม จึงไม่มีแท็บ
  const canFollow = user?.role === 'CLIENT' || user?.role === 'LAWYER';
  const [feed, setFeed] = useState('all');

  const load = useCallback(async () => {
    try {
      const { posts: data } = await postService.getPosts(feed === 'following' ? 'following' : undefined);
      setPosts(data);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [feed]);

  const switchFeed = (next) => {
    if (next === feed) return;
    setLoading(true);
    setPosts([]);
    setFeed(next); // load เปลี่ยนตาม feed → useFocusEffect โหลดใหม่ให้เอง
  };

  // โหลดใหม่ทุกครั้งที่กลับมาหน้านี้ (เช่น หลังสร้างโพสต์/คอมเมนต์)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      // Figma: ค้นหา + กระดิ่ง มุมขวาบน
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              setSearchOpen((open) => !open);
              setQuery('');
            }}
            hitSlop={10}
            accessibilityLabel={t('community.searchPosts')}
          >
            <Ionicons name={searchOpen ? 'close' : 'search'} size={22} color={colors.text} />
          </TouchableOpacity>
          <BellButton />
        </View>
      ),
    });
  }, [navigation, searchOpen, colors, styles, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => `${p.title} ${p.content}`.toLowerCase().includes(q));
  }, [posts, query]);

  const tabs = canFollow ? (
    <View style={styles.tabs} accessibilityRole="tablist">
      {[
        ['all', t('community.tabAll')],
        ['following', t('community.tabFollowing')],
      ].map(([key, label]) => (
        <TouchableOpacity
          key={key}
          style={[styles.tab, feed === key && styles.tabActive]}
          onPress={() => switchFeed(key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: feed === key }}
        >
          <Text style={[styles.tabText, feed === key && styles.tabTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  ) : null;

  if (loading) {
    return (
      <View style={styles.container}>
        {tabs}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  const emptyText =
    error ||
    (query
      ? t('community.noResults')
      : feed === 'following'
        ? t('community.emptyFollowing')
        : canPost
          ? t('community.emptyCanPost')
          : t('community.empty'));

  return (
    <View style={styles.container}>
      {tabs}
      {searchOpen && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('community.searchPosts')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            compact
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            onAuthorPress={(author) => navigation.navigate('UserProfile', { userId: author.id })}
          />
        )}
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
        ListEmptyComponent={
          <Text style={styles.empty}>{emptyText}</Text>
        }
      />

      {canPost && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreatePost')}
          accessibilityLabel={t('community.createPost')}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    list: { paddingBottom: 96 },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 8,
      padding: 3,
      borderRadius: 18,
      backgroundColor: c.surfaceAlt,
    },
    tab: { flex: 1, paddingVertical: 7, borderRadius: 15, alignItems: 'center' },
    tabActive: { backgroundColor: c.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: c.textMuted },
    tabTextActive: { color: c.onPrimary },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 10,
      paddingHorizontal: 12,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.inputBg,
    },
    searchInput: { flex: 1, marginLeft: 8, color: c.text },
    empty: { textAlign: 'center', color: c.textMuted, marginTop: 60, paddingHorizontal: 24 },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.shadow,
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 5,
    },
  });
