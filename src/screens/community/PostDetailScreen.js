import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import KeyboardAware from '../../components/KeyboardAware';
import { Ionicons } from '@expo/vector-icons';
import PostCard from '../../components/community/PostCard';
import CommentItem from '../../components/community/CommentItem';
import ImageViewer from '../../components/community/ImageViewer';
import * as postService from '../../services/postService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { confirmAction, displayName } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

// จัดคอมเมนต์เป็นกลุ่ม: คอมเมนต์หลัก แล้วตามด้วยคำตอบทั้งหมดในเธรดนั้น (เยื้อง 1 ระดับตาม Figma)
function buildThreads(comments) {
  const byId = Object.fromEntries(comments.map((c) => [c.id, c]));
  const rootOf = (c) => (c.parentId && byId[c.parentId] ? rootOf(byId[c.parentId]) : c);
  const rows = [];
  for (const root of comments.filter((c) => !c.parentId)) {
    rows.push({ comment: root, isReply: false });
    for (const c of comments) {
      if (c.parentId && rootOf(c).id === root.id) {
        rows.push({ comment: c, isReply: true, replyToName: displayName(byId[c.parentId].author) });
      }
    }
  }
  return rows;
}

// Use Case: Posting — หน้า comment (extend: create comment)
export default function PostDetailScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await postService.getPost(postId);
      setPost(data.post);
      setComments(data.comments);
    } catch (e) {
      setError(e.message);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(async () => {
    const ok = await confirmAction(t('community.deletePost'), t('community.deletePostConfirm'), t('common.delete'));
    if (!ok) return;
    try {
      await postService.deletePost(postId);
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    }
  }, [navigation, postId, t]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: post?.isMine
        ? () => (
            <TouchableOpacity onPress={handleDelete} hitSlop={10} accessibilityLabel={t('community.deletePost')}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [navigation, post?.isMine, handleDelete, colors, t]);

  const threads = useMemo(() => buildThreads(comments), [comments]);
  // push = เปิดโปรไฟล์ซ้อนได้ทุกครั้ง (หน้านี้อยู่ได้ทั้งในแท็บ Community และ Profile)
  const openProfile = (author) => navigation.push('UserProfile', { userId: author.id });

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const { comment } = await postService.addComment(postId, { content, parentId: replyTo?.id });
      setComments((prev) => [...prev, comment]);
      setPost((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }));
      setText('');
      setReplyTo(null);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  // ลบคอมเมนต์: คำตอบใต้คอมเมนต์นั้นถูกลบที่ backend ด้วย จึงโหลดรายการใหม่ทั้งหมด
  const handleDeleteComment = async (comment) => {
    const ok = await confirmAction(t('community.deleteComment'), t('community.deleteCommentConfirm'), t('common.delete'));
    if (!ok) return;
    try {
      await postService.deleteComment(postId, comment.id);
      if (replyTo?.id === comment.id) setReplyTo(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!post) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" color={colors.accent} />}
      </View>
    );
  }

  return (
    <KeyboardAware style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <PostCard post={post} onImagePress={setViewerIndex} onAuthorPress={openProfile} />

        <Text style={styles.sectionLabel}>{t('community.comments')}</Text>

        {replyTo && (
          <View style={styles.replyChip}>
            <Text style={styles.replyChipText} numberOfLines={1}>
              {t('community.replyingTo', { name: displayName(replyTo.author) })}
            </Text>
            <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8} accessibilityLabel={t('community.cancelReply')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder={replyTo ? t('community.replyPlaceholder') : t('community.commentPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity onPress={handleSend} disabled={!text.trim() || sending} accessibilityLabel={t('community.sendComment')}>
            {sending ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="pencil" size={20} color={text.trim() ? colors.accent : colors.textFaint} />
            )}
          </TouchableOpacity>
        </View>
        {error ? <Text style={[styles.error, styles.inlineError]}>{error}</Text> : null}

        {threads.length === 0 ? (
          <Text style={styles.noComments}>{t('community.noComments')}</Text>
        ) : (
          threads.map((row) => (
            <CommentItem
              key={row.comment.id}
              comment={row.comment}
              isReply={row.isReply}
              replyToName={row.replyToName}
              onReply={setReplyTo}
              onDelete={handleDeleteComment}
              onAuthorPress={openProfile}
            />
          ))
        )}
      </ScrollView>

      <ImageViewer images={post.images} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
    </KeyboardAware>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    scroll: { paddingBottom: 32 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 20, marginBottom: 8, marginHorizontal: 16 },
    replyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginBottom: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: c.primaryLight,
    },
    replyChipText: { fontSize: 12, color: c.accent, flex: 1 },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 48,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
    },
    input: { flex: 1, maxHeight: 120, color: c.text, fontSize: 14, marginRight: 8 },
    error: { color: c.error, textAlign: 'center' },
    inlineError: { marginTop: -8, marginBottom: 12 },
    noComments: { color: c.textMuted, textAlign: 'center', marginTop: 12 },
  });
