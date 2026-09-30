import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusChip from './StatusChip';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { displayName, formatDateTime } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

// ย้ายไป utils/format แล้ว — คง export ไว้ให้ไฟล์ที่ import จากที่นี่
export { formatDateTime };

// การ์ดคำขอปรึกษา (Figma Chat_request) — showClient สำหรับทนาย/admin
export default function RequestCard({ request, onPress, showClient = false }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8} accessibilityLabel={request.subject}>
      <Ionicons name="document-text" size={22} color={colors.accent} style={styles.icon} />
      <View style={styles.body}>
        <Text style={styles.subject} numberOfLines={2}>
          {request.subject}
        </Text>
        <Text style={styles.meta}>{t('consult.ref', { ref: request.ref })}</Text>
        <Text style={styles.meta}>{t('consult.sentAt', { date: formatDateTime(request.createdAt) })}</Text>
        {showClient && <Text style={styles.meta}>{t('consult.client', { name: displayName(request.client) })}</Text>}
        {request.lawyer && <Text style={styles.meta}>{t('consult.lawyer', { name: displayName(request.lawyer) })}</Text>}
        {request.status === 'APPROVED' && request.closeRequestedAt && (
          <Text style={styles.closeAsk}>{t('consult.closeAsked')}</Text>
        )}
        <StatusChip status={request.status} />
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    icon: { marginRight: 12, marginTop: 2 },
    body: { flex: 1 },
    subject: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 4 },
    meta: { fontSize: 11, color: c.icon, marginBottom: 1 },
    closeAsk: { fontSize: 11, color: c.warningIcon, fontWeight: '700', marginTop: 2 },
  });
