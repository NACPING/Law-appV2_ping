import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// แถบแจ้งคำขอปิดเคสเหนือช่องพิมพ์ — แสดงค้างไว้จนกว่าจะมีคนตอบ (ใครขอก็ได้ ทนายหรือลูกความ)
// mine = เราเป็นคนขอ → รอการตอบ + ยกเลิกคำขอ | ไม่ใช่ = อีกฝ่ายขอ → ปุ่มยินยอม / ไม่ยินยอม
// requester = 'LAWYER' | 'CLIENT' ผู้ขอ (ใช้เลือกข้อความ)
export default function CloseCaseBanner({ mine, requester, busy, onAccept, onDecline, onCancel }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const byLawyer = requester !== 'CLIENT';
  // อีกฝ่ายที่ต้องยินยอม (ใช้ในข้อความของคนขอ)
  const other = byLawyer ? t('chat.introOtherClient') : t('chat.introOtherLawyer');
  const title = mine
    ? byLawyer
      ? t('chat.bannerLawyerTitle')
      : t('chat.bannerWaitLawyerTitle')
    : byLawyer
      ? t('chat.bannerClientTitle')
      : t('chat.bannerByClientTitle');
  return (
    <View style={styles.banner}>
      <View style={styles.header}>
        <Ionicons name="hand-left-outline" size={18} color={colors.warningIcon} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.body}>{mine ? t('chat.bannerLawyerBody', { other }) : t('chat.bannerClientBody')}</Text>
      {busy ? (
        <ActivityIndicator color={colors.accent} style={styles.busy} />
      ) : !mine ? (
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
