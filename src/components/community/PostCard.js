import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import LawyerBadge from './LawyerBadge';
import ReactionBar from './ReactionBar';
import { useThemedStyles } from '../../context/ThemeContext';
import { displayName, timeAgo } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

const PREVIEW_IMAGES = 3;

// การ์ดโพสต์ตามแบบ Figma: ป้ายชื่อสีกรมทับขอบบน + หัวข้อ + เนื้อหา + แถวรูป
// compact = หน้า feed (ตัดข้อความ, รูปสูงสุด 3 + "+N more"), ไม่ compact = หน้ารายละเอียด
// onAuthorPress(author) = แตะชื่อผู้เขียนเพื่อเปิดโปรไฟล์ (โพสต์ไม่ระบุตัวตนแตะไม่ได้)
export default function PostCard({ post, compact = false, onPress, onImagePress, onAuthorPress }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const Wrapper = onPress ? TouchableOpacity : View;
  const canOpenAuthor = Boolean(onAuthorPress && post.author);
  const Pill = canOpenAuthor ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.wrapper} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.headerRow}>
        <Pill
          style={styles.authorPill}
          {...(canOpenAuthor && {
            onPress: () => onAuthorPress(post.author),
            activeOpacity: 0.7,
            accessibilityLabel: t('community.viewProfile', { name: displayName(post.author) }),
          })}
        >
          <Avatar author={post.author} size={38} />
          <Text style={styles.authorName} numberOfLines={1}>
            {displayName(post.author)}
          </Text>
          <LawyerBadge author={post.author} light />
        </Pill>
        <View style={styles.meta}>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color="#fff" />
          </View>
          <Text style={styles.count}>{post.commentCount}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title} numberOfLines={compact ? 2 : undefined}>
          {post.title}
        </Text>
        <Text style={styles.content} numberOfLines={compact ? 3 : undefined}>
          {post.content}
        </Text>
        {post.images.length > 0 && (compact ? (
            <ImagePreview images={post.images} />
          ) : (
            <ImageGallery images={post.images} onImagePress={onImagePress} />
          ))}
        <ReactionBar post={post} />
      </View>
    </Wrapper>
  );
}

function ImagePreview({ images }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const shown = images.slice(0, PREVIEW_IMAGES);
  const more = images.length - shown.length;
  return (
    <View style={styles.imageRow}>
      {shown.map((uri) => (
        <Image key={uri} source={{ uri }} style={styles.thumb} />
      ))}
      {more > 0 && (
        <View style={[styles.thumb, styles.moreBox]}>
          <Text style={styles.moreText}>{t('community.more', { n: more })}</Text>
        </View>
      )}
    </View>
  );
}

function ImageGallery({ images, onImagePress }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
      {images.map((uri, i) => (
        <TouchableOpacity key={uri} onPress={() => onImagePress?.(i)} activeOpacity={0.8} accessibilityLabel={t('community.viewImage', { n: i + 1 })}>
          <Image source={{ uri }} style={styles.galleryImage} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    wrapper: { marginHorizontal: 16, marginTop: 14 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 },
    authorPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.primary,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      borderTopLeftRadius: 19,
      borderBottomLeftRadius: 19,
      paddingRight: 16,
      maxWidth: '65%',
    },
    authorName: { color: c.onPrimary, fontSize: 13, fontWeight: '600', marginLeft: 8, flexShrink: 1 },
    meta: { flexDirection: 'row', alignItems: 'center' },
    time: { fontSize: 11, color: c.textMuted, marginRight: 6 },
    iconCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    count: { fontSize: 12, color: c.accent, fontWeight: '700', marginLeft: 4 },
    card: {
      marginTop: -12,
      paddingTop: 20,
      paddingHorizontal: 14,
      paddingBottom: 14,
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    title: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: 6 },
    content: { fontSize: 13, lineHeight: 20, color: c.textSecondary },
    imageRow: { flexDirection: 'row', marginTop: 12, gap: 6 },
    // 4 ช่องขนาดคงที่ (รูป 3 + ช่อง "+N more") ให้ทุกโพสต์รูปขนาดเท่ากัน
    thumb: { width: '23.5%', aspectRatio: 1, borderRadius: 6, backgroundColor: c.surfaceAlt },
    moreBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceAlt },
    moreText: { color: c.icon, fontSize: 12 },
    gallery: { marginTop: 12 },
    galleryImage: { width: 220, height: 160, borderRadius: 8, marginRight: 8, backgroundColor: c.surfaceAlt },
  });
