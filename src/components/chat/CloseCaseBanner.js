import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// แถบแจ้งคำขอปิดเคสเหนือช่องพิมพ์ — แสดงค้างไว้จนกว่าจะมีคนตอบ
// ลูกความ: ปุ่มยินยอม / ไม่ยินยอม | ทนาย: รอการตอบ + ยกเลิกคำขอ
export default function CloseCaseBanner({ isClient, busy, onAccept, onDecline, onCancel }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.banner}>
      <View style={styles.header}>
        <Ionicons name="hand-left-outline" size={18} color={colors.warningIcon} />
        <Text style={styles.title}>{isClient ? t('chat.bannerClientTitle') : t('chat.bannerLawyerTitle')}</Text>
      </View>
      <Text style={styles.body}>
        {isClient ? t('chat.bannerClientBody') : t('chat.bannerLawyerBody')}
      </Text>
      {busy ? (
        <ActivityIndicator color={colors.accent} style={styles.busy} />
      ) : isClient ? (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.decline]} onPress={onDecline} accessibilityRole="button">
            <Text style={styles.declineText}>{t('chat.decline')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.accept]} onPress={onAccept} accessibilityRole="button">
            <Text style={styles.acceptText}>{t('chat.acceptClose')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.cancel} onPress={onCancel} accessibilityRole="button">
          <Text style={styles.cancelText}>{t('chat.cancelCloseRequest')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    banner: {
      marginHorizontal: 12,
      marginBottom: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: c.warningBg,
      borderWidth: 1,
      borderColor: c.warningBorder,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { fontSize: 14, fontWeight: '700', color: c.warningText, flexShrink: 1 },
    body: { fontSize: 12, color: c.warningTextSoft, marginTop: 4, lineHeight: 18 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    btn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    decline: { borderWidth: 1, borderColor: c.warningBorder, backgroundColor: c.background },
    declineText: { color: c.warningText, fontWeight: '600' },
    accept: { backgroundColor: c.primary },
    acceptText: { color: c.onPrimary, fontWeight: '700' },
    cancel: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4 },
    cancelText: { color: c.error, fontWeight: '600', fontSize: 13 },
    busy: { marginTop: 10 },
  });
