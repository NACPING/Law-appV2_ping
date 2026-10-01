import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import StatusChip from '../../components/consult/StatusChip';
import { formatDateTime } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import * as requestService from '../../services/lawyerRequestService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { confirmAction, displayName } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

const POLL_MS = 10000;

// สถานะคำขอ (Figma Lawyer_request: Awaiting Review → Ready to Chat) — ใช้ทั้งลูกความและทนาย
export default function RequestStatusScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { requestId } = route.params;
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await requestService.getRequest(requestId);
      setRequest(d.request);
      setError('');
      return d.request;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }, [requestId]);

  // ระหว่างรอตรวจสอบ เช็กสถานะใหม่ทุก 10 วินาที (เฉพาะตอนเปิดหน้านี้อยู่)
  useFocusEffect(
    useCallback(() => {
      let timer;
      let active = true;
      const tick = async () => {
        const r = await load();
        if (active && r?.status === 'PENDING') timer = setTimeout(tick, POLL_MS);
      };
      tick();
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }, [load])
  );

  const handleCancel = async () => {
    const ok = await confirmAction(t('consult.cancelRequest'), t('consult.cancelConfirm'), t('consult.cancelRequest'));
    if (!ok) return;
    try {
      await requestService.cancelRequest(requestId);
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!request) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" color={colors.accent} />}
      </View>
    );
  }

  const chatWith = isClient ? request.lawyer : request.client;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        {request.status === 'PENDING' && (
          <>
            <ActivityIndicator size="large" color={colors.textMuted} style={styles.spinner} />
            <Text style={styles.heroTitle}>{t('consult.awaitingReview')}</Text>
            <Text style={styles.heroSub}>{t('consult.awaitingSub')}</Text>
          </>
        )}
        {request.status === 'APPROVED' && (
          <>
            <Ionicons name="checkmark-circle-outline" size={84} color={colors.success} />
            <Text style={styles.heroSub}>
              {isClient ? t('consult.approvedClient') : t('consult.clientLabel')} <Text style={styles.bold}>{displayName(chatWith)}</Text>
            </Text>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => navigation.navigate('ChatRoom', { requestId: request.id, name: displayName(chatWith) })}
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
              <Text style={styles.chatBtnText}>{t('consult.readyToChat')}</Text>
            </TouchableOpacity>
            {request.closeRequestedAt && (
              <Text style={styles.closeAsk}>
                {/* เราเป็นคนขอ = รออีกฝ่าย · อีกฝ่ายขอ = ให้เข้าห้องแชทไปตอบ */}
                {request.closeRequestedBy === user?.role
                  ? isClient
                    ? t('consult.closeAskedWaitLawyer')
                    : t('consult.closeAsked')
                  : isClient
                    ? t('consult.closeAskedClient')
                    : t('consult.closeAskedByClient')}
              </Text>
            )}
          </>
        )}
        {request.status === 'CLOSED' && (
          <>
            <Ionicons name="lock-closed-outline" size={72} color={colors.textMuted} />
            <Text style={styles.heroTitle}>{t('consult.closedTitle')}</Text>
            <Text style={styles.heroSub}>
              {isClient ? t('consult.lawyerLabel') : t('consult.clientLabel')} <Text style={styles.bold}>{displayName(chatWith)}</Text>
              {request.closedAt ? t('consult.closedAt', { date: formatDateTime(request.closedAt) }) : ''}
            </Text>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => navigation.navigate('ChatRoom', { requestId: request.id, name: displayName(chatWith) })}
            >
              <Text style={styles.outlineText}>{t('consult.viewHistory')}</Text>
            </TouchableOpacity>
            {isClient && (
              <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('ConsultForm')}>
                <Text style={styles.linkText}>{t('consult.consultAgain')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {request.status === 'REJECTED' && (
          <>
            <Ionicons name="close-circle-outline" size={84} color={colors.error} />
            <Text style={styles.heroTitle}>{t('consult.rejectedTitle')}</Text>
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>{t('consult.reasonFromTeam')}</Text>
              <Text style={styles.reason}>{request.rejectReason}</Text>
            </View>
            {isClient && (
              <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.replace('ConsultForm')}>
                <Text style={styles.outlineText}>{t('consult.newRequest')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.ref}>{request.ref}</Text>
          <StatusChip status={request.status} />
        </View>
        <Text style={styles.label}>{t('consult.subject')}</Text>
        <Text style={styles.value}>{request.subject}</Text>
        <Text style={styles.label}>{t('consult.events')}</Text>
        <Text style={styles.value}>{request.events}</Text>
        {request.message ? (
          <>
            <Text style={styles.label}>{t('consult.message')}</Text>
            <Text style={styles.value}>{request.message}</Text>
          </>
        ) : null}
        <Text style={styles.meta}>{t('consult.sentAtShort', { date: formatDateTime(request.createdAt) })}</Text>
        {request.reviewedAt && <Text style={styles.meta}>{t('consult.reviewedAt', { date: formatDateTime(request.reviewedAt) })}</Text>}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isClient && request.status === 'PENDING' && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelText}>{t('consult.cancelRequest')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, padding: 24 },
    scroll: { paddingBottom: 32 },
    hero: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
    spinner: { transform: [{ scale: 1.6 }], marginBottom: 24 },
    heroTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginTop: 8 },
    heroSub: { fontSize: 13, color: c.textMuted, textAlign: 'center', marginTop: 8 },
    bold: { fontWeight: '700', color: c.text },
    chatBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.primary,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 28,
      marginTop: 20,
    },
    chatBtnText: { color: c.onPrimary, fontSize: 15, fontWeight: '600' },
    closeAsk: {
      marginTop: 14,
      fontSize: 13,
      fontWeight: '600',
      color: c.warningText,
      backgroundColor: c.warningBg,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      overflow: 'hidden',
      textAlign: 'center',
    },
    reasonBox: { alignSelf: 'stretch', backgroundColor: c.dangerBg, borderRadius: 10, padding: 12, marginTop: 14 },
    reasonLabel: { fontSize: 12, fontWeight: '700', color: c.dangerTitle, marginBottom: 4 },
    reason: { fontSize: 13, color: c.dangerText, lineHeight: 20 },
    outlineBtn: { borderWidth: 1, borderColor: c.accent, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, marginTop: 16 },
    outlineText: { color: c.accent, fontWeight: '600' },
    linkBtn: { marginTop: 12, padding: 6 },
    linkText: { color: c.accent, fontSize: 13, textDecorationLine: 'underline' },
    details: { marginHorizontal: 16, padding: 16, borderRadius: 12, backgroundColor: c.surface },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    ref: { fontSize: 13, fontWeight: '700', color: c.accent },
    label: { fontSize: 12, fontWeight: '700', color: c.text, marginTop: 10 },
    value: { fontSize: 14, color: c.textSecondary, lineHeight: 21, marginTop: 2 },
    meta: { fontSize: 11, color: c.textMuted, marginTop: 10 },
    error: { color: c.error, textAlign: 'center', margin: 12 },
    cancelBtn: { alignSelf: 'center', marginTop: 20, padding: 10 },
    cancelText: { color: c.error, fontWeight: '600' },
  });
