import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../community/Avatar';
import { useThemedStyles } from '../../context/ThemeContext';
import { displayName } from '../../utils/format';
import { localeOf } from '../../i18n';
import { useLanguage } from '../../context/LanguageContext';

const formatTime = (d) => new Date(d).toLocaleTimeString(localeOf(), { hour: '2-digit', minute: '2-digit' });
export const formatSize = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// ข้อความหนึ่งรายการ (Figma chat_box): ป้ายชื่อสีกรม + กล่องข้อความ — ของเราชิดขวา ของอีกฝ่ายชิดซ้าย
// showHeader = แสดงป้ายชื่อเฉพาะข้อความแรกของกลุ่มที่คนเดียวกันส่งติดกัน
export default function MessageBubble({ message, isMine, showHeader, onOpenImage, onOpenPdf }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const { sender, file, text } = message;
  const align = isMine ? styles.right : styles.left;

  return (
    <View style={[styles.wrapper, align, showHeader && styles.groupStart]}>
      {showHeader && (
        <View style={[styles.header, isMine && styles.headerMine]}>
          <Avatar author={sender} size={26} />
          <View style={[styles.namePill, isMine && styles.namePillMine]}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName(sender)}
            </Text>
            {sender.role === 'LAWYER' && <Text style={styles.lawyerTag}>{t('common.lawyer')}</Text>}
          </View>
        </View>
      )}

      <View style={[styles.box, isMine && styles.boxMine]}>
        {file?.kind === 'image' && (
          <TouchableOpacity onPress={() => onOpenImage(file.url)} activeOpacity={0.85} accessibilityLabel={t('chat.viewImage', { name: file.name })}>
            <Image source={{ uri: file.url }} style={styles.image} />
          </TouchableOpacity>
        )}
        {file?.kind === 'pdf' && (
          <TouchableOpacity style={styles.pdf} onPress={() => onOpenPdf(file)} accessibilityLabel={t('chat.openFile', { name: file.name })}>
            <Ionicons name="document-text" size={30} color="#D32F2F" />
            <View style={styles.pdfText}>
              <Text style={styles.pdfName} numberOfLines={2}>
                {file.name}
              </Text>
              <Text style={styles.pdfMeta}>PDF · {formatSize(file.size)}</Text>
            </View>
          </TouchableOpacity>
        )}
        {text ? <Text style={styles.text}>{text}</Text> : null}
      </View>
      <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    wrapper: { maxWidth: '82%', marginHorizontal: 12, marginTop: 4 },
    groupStart: { marginTop: 14 },
    left: { alignSelf: 'flex-start', alignItems: 'flex-start' },
    right: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, zIndex: 1 },
    headerMine: { flexDirection: 'row-reverse' },
    namePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginLeft: -6,
      maxWidth: 220,
    },
    namePillMine: { marginLeft: 0, marginRight: -6 },
    name: { color: c.onPrimary, fontSize: 12, fontWeight: '600', flexShrink: 1 },
    lawyerTag: { color: c.onPrimaryMuted, fontSize: 10, marginLeft: 6 },
    box: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 10,
      gap: 8,
    },
    boxMine: { backgroundColor: c.bubbleMine },
    text: { fontSize: 14, lineHeight: 21, color: c.text },
    image: { width: 200, height: 200, borderRadius: 6, backgroundColor: c.surfaceAlt },
    pdf: { flexDirection: 'row', alignItems: 'center', minWidth: 200 },
    pdfText: { marginLeft: 8, flexShrink: 1 },
    pdfName: { fontSize: 13, fontWeight: '600', color: c.text },
    pdfMeta: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    time: { fontSize: 10, color: c.textFaint, marginTop: 2, marginHorizontal: 4 },
  });
