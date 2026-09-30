import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LawyerBadge from './LawyerBadge';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { displayName, timeAgo } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

// กล่องคอมเมนต์ตามแบบ Figma; isReply = เยื้องเข้าไปพร้อมลูกศร
export default function CommentItem({ comment, replyToName, isReply, onReply, onDelete, onAuthorPress }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.row, isReply && styles.replyRow]}>
      {isReply && <Ionicons name="return-down-forward" size={18} color={colors.textFaint} style={styles.arrow} />}
      <View style={styles.box}>
        <View style={styles.nameRow}>
          <Text
            style={styles.name}
            onPress={onAuthorPress ? () => onAuthorPress(comment.author) : undefined}
            accessibilityRole={onAuthorPress ? 'link' : undefined}
          >
            {displayName(comment.author)}
          </Text>
          <LawyerBadge author={comment.author} />
          {replyToName ? <Text style={styles.replyTo}>{t('community.replyTo', { name: replyToName })}</Text> : null}
        </View>
        <Text style={styles.content}>{comment.content}</Text>
        <View style={styles.footer}>
          <Text style={styles.time}>{timeAgo(comment.createdAt)}</Text>
          <View style={styles.actions}>
            {comment.isMine && (
              <TouchableOpacity onPress={() => onDelete(comment)} hitSlop={8}>
                <Text style={styles.delete}>{t('common.delete')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onReply(comment)} hitSlop={8}>
              <Text style={styles.reply}>{t('community.reply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    row: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10 },
    replyRow: { marginLeft: 24 },
    arrow: { marginTop: 10, marginRight: 4 },
    box: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 10,
      backgroundColor: c.card,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
    name: { fontSize: 13, fontWeight: '700', color: c.accent },
    replyTo: { fontSize: 11, color: c.textMuted },
    content: { fontSize: 13, lineHeight: 19, color: c.textSecondary },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    time: { fontSize: 11, color: c.textFaint },
    actions: { flexDirection: 'row', gap: 16 },
    reply: { fontSize: 12, color: c.textMuted },
    delete: { fontSize: 12, color: c.error },
  });
