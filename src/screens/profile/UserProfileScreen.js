import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/community/Avatar';
import PostCard from '../../components/community/PostCard';
import BellButton from '../../components/BellButton';
import { useAuth } from '../../context/AuthContext';
import * as userService from '../../services/userService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { timeAgo } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

// สีแถบด้านบนตาม Figma: Profile-client = น้ำเงิน, Profile-lawyer = เหลือง
const COVER_COLORS = { CLIENT: '#3D5A98', LAWYER: '#E3CD5B', ADMIN: '#1E2B58' };

// หน้า Profile — ใช้ทั้งโปรไฟล์ของตัวเอง (หน้าแรกของแท็บ Profile) และของคนอื่น (params.userId)
export default function UserProfileScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user: me } = useAuth();
  const userId = route.params?.userId ?? me.id;
  const isHome = route.name === 'ProfileHome'; // หน้าแรกของแท็บ: มีปุ่มแก้ไข
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await userService.getProfile(userId));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  // โหลดใหม่ทุกครั้งที่กลับมาหน้านี้ (เช่น หลังแก้ไขโปรไฟล์ หรือลบโพสต์)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ปุ่ม ☰ ของหน้าแรกแท็บตั้งไว้ที่ ProfileNavigator
  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <BellButton /> });
  }, [navigation]);

  if (!data) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" color={colors.accent} />}
      </View>
    );
  }

  const { user, stats } = data;
  const isLawyer = user.role === 'LAWYER';
  const openPost = (postId) => navigation.push('PostDetail', { postId });

  return (
    <FlatList
      style={styles.container}
      data={isLawyer ? data.comments : data.posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) =>
        isLawyer ? (
          <CommentRow comment={item} onPress={() => openPost(item.post.id)} />
        ) : (
          <PostCard post={item} compact onPress={() => openPost(item.id)} />
        )
      }
      ListHeaderComponent={
        <ProfileHeader
          user={user}
          stats={stats}
          canEdit={isHome}
          onEdit={() => navigation.navigate('EditProfile')}
        />
      }
      ListEmptyComponent={
        user.role === 'ADMIN' ? null : (
          <Text style={styles.empty}>{isLawyer ? t('profile.noComments') : t('profile.noPosts')}</Text>
        )
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

function ProfileHeader({ user, stats, canEdit, onEdit }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const isLawyer = user.role === 'LAWYER';
  const statsText = isLawyer
    ? t('profile.lawyerStats', { cases: stats.caseCount, comments: stats.commentCount })
    : user.role === 'CLIENT'
      ? t('profile.postCount', { n: stats.postCount })
      : t('profile.roles.ADMIN');
  // เจ้าของเห็นเบอร์/อีเมลของตัวเองเสมอ — บอกให้รู้ว่าคนอื่นเห็นหรือไม่
  const contactHint = user.isSelf
    ? isLawyer && user.showContact
      ? t('profile.contactShown')
      : t('profile.contactHidden')
    : '';
  const hasContact = user.phone || user.email;

  return (
    <View>
      <View style={[styles.cover, { backgroundColor: COVER_COLORS[user.role] ?? colors.primary }]}>
        {/* ปุ่มอยู่ในกรอบของแถบสีเท่านั้น — Android กดปุ่มที่ล้นกรอบ View แม่ไม่ได้ */}
        {canEdit && (
          <TouchableOpacity style={styles.editBtn} onPress={onEdit} hitSlop={8} accessibilityLabel={t('profile.edit')}>
            <Ionicons name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sheet}>
        <View style={styles.identityRow}>
          <View style={styles.avatarWrap}>
            <Avatar author={user} size={92} borderColor={colors.background} />
          </View>
          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={2}>
                {user.firstName} {user.lastName}
              </Text>
              {user.role !== 'CLIENT' && (
                <View style={[styles.rolePill, isLawyer && styles.lawyerPill]}>
                  <Text style={[styles.roleText, isLawyer && styles.lawyerText]}>{t(`profile.roles.${user.role}`)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.stats}>{statsText}</Text>
          </View>
        </View>

        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

        {(hasContact || contactHint) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.details')}</Text>
            {user.phone ? <DetailLine icon="call-outline" text={t('profile.tel', { phone: user.phone })} /> : null}
            {user.email ? <DetailLine icon="mail-outline" text={t('profile.email', { email: user.email })} /> : null}
            {contactHint ? <Text style={styles.hint}>{contactHint}</Text> : null}
          </View>
        )}

        {isLawyer && user.about ? <Text style={styles.about}>{user.about}</Text> : null}

        {user.role !== 'ADMIN' && (
          <Text style={styles.listTitle}>{isLawyer ? t('profile.recentComments') : t('profile.posts')}</Text>
        )}
      </View>
    </View>
  );
}

function DetailLine({ icon, text }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.detailLine}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.detailText} selectable>
        {text}
      </Text>
    </View>
  );
}

// ความคิดเห็นของทนาย (ทนายโพสต์ไม่ได้) — แตะเพื่อเปิดโพสต์นั้น
function CommentRow({ comment, onPress }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={styles.commentRow} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.commentPost} numberOfLines={1}>
        {t('profile.inPost', { title: comment.post.title })}
      </Text>
      <Text style={styles.commentText} numberOfLines={3}>
        {comment.content}
      </Text>
      <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: c.background },
    error: { color: c.error, textAlign: 'center' },
    list: { paddingBottom: 32 },
    cover: { height: 120 },
    editBtn: {
      position: 'absolute',
      right: 12,
      bottom: 30,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(0,0,0,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheet: {
      marginTop: -20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      backgroundColor: c.background,
      paddingHorizontal: 16,
    },
    identityRow: { flexDirection: 'row', alignItems: 'flex-end' },
    avatarWrap: { marginTop: -46 },
    identity: { flex: 1, marginLeft: 12, paddingTop: 8 },
    nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
    name: { fontSize: 20, fontWeight: '700', color: c.text, flexShrink: 1 },
    rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: c.primaryLight },
    roleText: { fontSize: 11, color: c.accent, fontWeight: '600' },
    lawyerPill: { backgroundColor: '#FFF4C2' },
    lawyerText: { color: '#7A6300' },
    stats: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    bio: { fontSize: 14, color: c.text, marginTop: 14, lineHeight: 20 },
    section: { marginTop: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 4 },
    detailLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    detailText: { fontSize: 13, color: c.textSecondary },
    hint: { fontSize: 11, color: c.textMuted, marginTop: 4 },
    about: { fontSize: 13, color: c.textSecondary, lineHeight: 20, marginTop: 14 },
    listTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
      marginTop: 20,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    empty: { textAlign: 'center', color: c.textMuted, marginTop: 24 },
    commentRow: {
      marginHorizontal: 16,
      marginTop: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
    },
    commentPost: { fontSize: 12, color: c.accent, fontWeight: '600' },
    commentText: { fontSize: 13, color: c.textSecondary, lineHeight: 19, marginTop: 4 },
    commentTime: { fontSize: 11, color: c.textFaint, marginTop: 6 },
  });
