import React, { useEffect, useRef, useState } from 'react';
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
import StatusChip from '../../components/consult/StatusChip';
import { formatDateTime } from '../../utils/format';
import * as requestService from '../../services/lawyerRequestService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { confirmAction, displayName } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

// Admin: พิจารณาคำขอ — อนุมัติพร้อมเลือกทนาย หรือปฏิเสธพร้อมเหตุผล
export default function AdminReviewScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { requestId } = route.params;
  const [request, setRequest] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [lawyerId, setLawyerId] = useState(null);
  const [mode, setMode] = useState('approve'); // approve | reject
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef(null);
  const reasonTop = useRef(0);

  // แตะช่องเหตุผลแล้วเลื่อนหน้าให้ทั้งช่องอยู่เหนือคีย์บอร์ด (รอคีย์บอร์ดขึ้นก่อน)
  // คู่กับ maxHeight ของช่อง — ข้อความยาวเลื่อนอยู่ในช่อง ไม่ไหลลงไปใต้คีย์บอร์ด
  const scrollToReason = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(reasonTop.current - 12, 0), animated: true }), 300);
  };

  useEffect(() => {
    Promise.all([requestService.getRequest(requestId), requestService.getLawyers()])
      .then(([r, l]) => {
        setRequest(r.request);
        setLawyers(l.lawyers);
      })
      .catch((e) => setError(e.message));
  }, [requestId]);

  const submit = async () => {
    if (mode === 'approve' && !lawyerId) return setError(t('consult.errChooseLawyer'));
    if (mode === 'reject' && !reason.trim()) return setError(t('consult.errReason'));

    const lawyer = lawyers.find((l) => l.id === lawyerId);
    const ok = await confirmAction(
      mode === 'approve' ? t('consult.approveTitle') : t('consult.rejectTitle'),
      mode === 'approve' ? t('consult.approveConfirm', { name: displayName(lawyer) }) : t('consult.rejectConfirm'),
      mode === 'approve' ? t('consult.approve') : t('consult.reject')
    );
    if (!ok) return;

    setSaving(true);
    setError('');
    try {
      const d =
        mode === 'approve'
          ? await requestService.approveRequest(requestId, lawyerId)
          : await requestService.rejectRequest(requestId, reason.trim());
      setRequest(d.request);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!request) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" color={colors.accent} />}
      </View>
    );
  }

  const pending = request.status === 'PENDING';

  return (
    <KeyboardAware style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.ref}>{request.ref}</Text>
            <StatusChip status={request.status} />
          </View>
          <Text style={styles.label}>{t('consult.requester')}</Text>
          <Text style={styles.value}>
            {displayName(request.client)} · {request.client.email}
            {request.client.phone ? ` · ${request.client.phone}` : ''}
          </Text>
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
        </View>

        {!pending && (
          <View style={styles.result}>
            {request.status === 'APPROVED' || request.status === 'CLOSED' ? (
              <Text style={styles.value}>
                {request.status === 'CLOSED' ? t('consult.closedResult') : t('consult.approvedResult')}
                <Text style={styles.bold}>{displayName(request.lawyer)}</Text>
                {'\n'}
                <Text style={styles.meta}>{t('consult.chatPrivate')}</Text>
              </Text>
            ) : (
              <Text style={styles.value}>{t('consult.rejectedResult', { reason: request.rejectReason })}</Text>
            )}
            {request.reviewedAt && <Text style={styles.meta}>{t('consult.at', { date: formatDateTime(request.reviewedAt) })}</Text>}
          </View>
        )}

        {pending && (
          <>
            <View style={styles.modes} accessibilityRole="tablist">
              {[
                ['approve', t('consult.approve')],
                ['reject', t('consult.reject')],
              ].map(([m, label]) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.mode, mode === m && (m === 'approve' ? styles.modeApprove : styles.modeReject)]}
                  onPress={() => {
                    setMode(m);
                    setError('');
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === m }}
                >
                  <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'approve' ? (
              <View>
                <Text style={styles.sectionTitle}>{t('consult.chooseLawyer')}</Text>
                {lawyers.map((l) => {
                  const selected = l.id === lawyerId;
                  return (
                    <TouchableOpacity
                      key={l.id}
                      style={[styles.lawyer, selected && styles.lawyerSelected]}
                      onPress={() => setLawyerId(l.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={displayName(l)}
                    >
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={selected ? colors.accent : colors.textFaint}
                      />
                      <View style={styles.lawyerText}>
                        <Text style={styles.lawyerName}>{displayName(l)}</Text>
                        <Text style={styles.meta}>
                          {t('consult.lawyerCases', { email: l.email, n: l.activeCases })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {lawyers.length === 0 && <Text style={styles.meta}>{t('consult.noLawyers')}</Text>}
              </View>
            ) : (
              <View onLayout={(e) => (reasonTop.current = e.nativeEvent.layout.y)}>
                <Text style={styles.sectionTitle}>{t('consult.rejectReason')}</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder={t('consult.rejectPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={reason}
                  onChangeText={setReason}
                  onFocus={scrollToReason}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>
            )}

            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.submit, mode === 'reject' && styles.submitReject]}
              onPress={submit}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>{mode === 'approve' ? t('consult.approveSubmit') : t('consult.rejectSubmit')}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAware>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, padding: 24 },
    scroll: { padding: 16, paddingBottom: 40 },
    details: { padding: 16, borderRadius: 12, backgroundColor: c.surface },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    ref: { fontSize: 13, fontWeight: '700', color: c.accent },
    label: { fontSize: 12, fontWeight: '700', color: c.text, marginTop: 10 },
    value: { fontSize: 14, color: c.textSecondary, lineHeight: 21, marginTop: 2 },
    bold: { fontWeight: '700' },
    meta: { fontSize: 11, color: c.textMuted, marginTop: 6 },
    result: { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.border },
    modes: { flexDirection: 'row', marginTop: 20, backgroundColor: c.surfaceAlt, borderRadius: 20, padding: 4 },
    mode: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
    modeApprove: { backgroundColor: c.successBg },
    modeReject: { backgroundColor: c.danger },
    modeText: { fontWeight: '600', color: c.icon },
    modeTextActive: { color: c.onPrimary },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginTop: 18, marginBottom: 8 },
    lawyer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
    },
    lawyerSelected: { borderColor: c.accent, backgroundColor: c.primaryLight },
    lawyerText: { marginLeft: 10, flex: 1 },
    lawyerName: { fontSize: 14, fontWeight: '600', color: c.text },
    reasonInput: {
      minHeight: 110,
      maxHeight: 180,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 14,
      color: c.text,
    },
    error: { color: c.error, textAlign: 'center', marginTop: 12 },
    submit: {
      marginTop: 20,
      backgroundColor: c.successBg,
      borderRadius: 10,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitReject: { backgroundColor: c.danger },
    submitText: { color: c.onPrimary, fontSize: 15, fontWeight: '700' },
  });
