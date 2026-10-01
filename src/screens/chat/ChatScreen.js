import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/community/Avatar';
import RequestCard from '../../components/consult/RequestCard';
import { useAuth } from '../../context/AuthContext';
import * as requestService from '../../services/lawyerRequestService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { displayName } from '../../utils/format';
import { messagePreview } from '../../utils/labels';
import { localeOf } from '../../i18n';
import { useLanguage } from '../../context/LanguageContext';

const ADMIN_FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'CLOSED'];

// เวลาของข้อความล่าสุดในรายการแชท: วันนี้ = เวลา, วันอื่น = วันที่
const shortTime = (d) => {
  const date = new Date(d);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString(localeOf(), { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(localeOf(), { day: 'numeric', month: 'short' });
};

// หน้าแรกของแท็บ Chat — แสดงต่างกันตาม role
// ลูกความ: การ์ดขอปรึกษา + รายการแชทกับทนาย | ทนาย: เคสที่ได้รับมอบหมาย | admin: คำขอให้พิจารณา
export default function ChatScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const role = user?.role;
  const [adminFilter, setAdminFilter] = useState('PENDING');
  const [requests, setRequests] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await requestService.getRequests(role === 'ADMIN' ? adminFilter : undefined);
      // ลูกความ: หน้านี้แสดงเฉพาะเคสที่มีห้องแชท (อนุมัติแล้ว/ปิดแล้ว) เรียงตามข้อความล่าสุด
      // ส่วนคำขอทั้งหมดอยู่หน้า "Request legal assistance"
      const list =
        role === 'CLIENT'
          ? d.requests
              .filter((r) => r.status === 'APPROVED' || r.status === 'CLOSED')
              .sort((a, b) => new Date(b.lastMessage?.createdAt ?? b.reviewedAt) - new Date(a.lastMessage?.createdAt ?? a.reviewedAt))
          : d.requests;
      setRequests(list);
      setError('');
    } catch (e) {
      setError(e.message);
      setRequests((prev) => prev ?? []);
    } finally {
      setRefreshing(false);
    }
  }, [role, adminFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      tintColor={colors.accent}
    />
  );

  const openStatus = (r) => navigation.navigate('RequestStatus', { requestId: r.id });

  if (role === 'ADMIN') {
    return (
      <View style={styles.container}>
        <View style={styles.filters} accessibilityRole="tablist">
          {ADMIN_FILTERS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.filter, adminFilter === s && styles.filterActive]}
              onPress={() => {
                setRequests(null);
                setAdminFilter(s);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: adminFilter === s }}
            >
              <Text style={[styles.filterText, adminFilter === s && styles.filterTextActive]}>{t(`status.${s}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {requests === null ? (
          <ActivityIndicator style={styles.loader} color={colors.accent} />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => (
              <RequestCard request={item} showClient onPress={() => navigation.navigate('AdminReview', { requestId: item.id })} />
            )}
            contentContainerStyle={styles.list}
            refreshControl={refreshControl}
            ListEmptyComponent={<Text style={styles.empty}>{error || t('consult.adminEmpty', { status: t(`status.${adminFilter}`) })}</Text>}
          />
        )}
      </View>
    );
  }

  if (role === 'LAWYER') {
    return (
      <View style={styles.container}>
        {requests === null ? (
          <ActivityIndicator style={styles.loader} color={colors.accent} />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(r) => r.id}
            ListHeaderComponent={<Text style={styles.sectionTitle}>{t('chat.assignedCases')}</Text>}
            renderItem={({ item }) => <RequestCard request={item} showClient onPress={() => openStatus(item)} />}
            contentContainerStyle={styles.list}
            refreshControl={refreshControl}
            ListEmptyComponent={<Text style={styles.empty}>{error || t('chat.noAssigned')}</Text>}
          />
        )}
      </View>
    );
  }

  // ลูกความ
  return (
    <FlatList
      style={styles.container}
      data={requests ?? []}
      keyExtractor={(r) => r.id}
      refreshControl={refreshControl}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          <View style={styles.requestCard}>
            <Text style={styles.requestTitle}>{t('consult.requestTitle')}</Text>
            <Text style={styles.requestSub}>{t('consult.requestSub')}</Text>
            <TouchableOpacity style={styles.requestBtn} onPress={() => navigation.navigate('RequestList')}>
              <Text style={styles.requestBtnText}>{t('consult.requestBtn')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionTitle}>{t('chat.chatWithLawyer')}</Text>
          {requests === null && <ActivityIndicator style={styles.loader} color={colors.accent} />}
        </>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.chatRow}
          onPress={() => navigation.navigate('ChatRoom', { requestId: item.id, name: displayName(item.lawyer) })}
          accessibilityLabel={t('chat.chatWith', { name: displayName(item.lawyer) })}
        >
          <Avatar author={item.lawyer} size={42} />
          <View style={styles.chatText}>
            <Text style={styles.chatName} numberOfLines={1}>
              {displayName(item.lawyer)} <Text style={styles.lawyerTag}>{t('common.lawyer')}</Text>
            </Text>
            <Text style={styles.chatSubject} numberOfLines={1}>
              {item.subject}
            </Text>
            <Text style={styles.chatPreview} numberOfLines={1}>
              {item.lastMessage
                ? `${item.lastMessage.senderId === user.id ? t('common.youPrefix') : ''}${messagePreview(item.lastMessage)}`
                : t('chat.noMessages')}
            </Text>
          </View>
          <View style={styles.chatMeta}>
            {item.lastMessage && <Text style={styles.chatTime}>{shortTime(item.lastMessage.createdAt)}</Text>}
            {item.status === 'CLOSED' && <Text style={styles.closedTag}>{t('chat.closedTag')}</Text>}
            {item.status === 'APPROVED' && item.closeRequestedAt && (
              <Text style={styles.closeAskTag}>
                {item.closeRequestedBy === 'CLIENT' ? t('chat.closeAskTagMine') : t('chat.closeAskTag')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        requests === null ? null : (
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textFaint} />
            <Text style={styles.empty}>{error || t('chat.emptyChats')}</Text>
          </View>
        )
      }
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    list: { paddingBottom: 24 },
    loader: { marginTop: 40 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: c.text, marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
    empty: { textAlign: 'center', color: c.textMuted, marginTop: 12, paddingHorizontal: 24, lineHeight: 20 },
    emptyBox: { alignItems: 'center', marginTop: 24 },
    requestCard: {
      margin: 16,
      marginBottom: 4,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      alignItems: 'center',
      shadowColor: c.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    requestTitle: { fontSize: 16, fontWeight: '700', color: c.text, fontFamily: 'Georgia, serif' },
    requestSub: { fontSize: 11, color: c.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 12 },
    requestBtn: { backgroundColor: c.primary, borderRadius: 16, paddingVertical: 8, alignSelf: 'stretch', alignItems: 'center' },
    requestBtnText: { color: c.onPrimary, fontWeight: '600' },
    chatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 10,
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    chatText: { flex: 1, marginLeft: 10 },
    chatName: { fontSize: 14, fontWeight: '700', color: c.text },
    lawyerTag: { fontSize: 11, fontWeight: '400', color: c.textMuted },
    chatSubject: { fontSize: 11, color: c.accent, marginTop: 1 },
    chatPreview: { fontSize: 12, color: c.icon, marginTop: 2 },
    chatMeta: { alignItems: 'flex-end', marginLeft: 8, gap: 4 },
    chatTime: { fontSize: 11, color: c.textMuted },
    closeAskTag: { fontSize: 10, fontWeight: '700', color: '#7A5B00', backgroundColor: '#FFE7A3', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
    closedTag: { fontSize: 10, color: '#3F4555', backgroundColor: '#DADDE5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
    filters: { flexDirection: 'row', margin: 16, backgroundColor: c.primaryLight, borderRadius: 20, padding: 4 },
    filter: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
    filterActive: { backgroundColor: c.primary },
    filterText: { fontSize: 12, color: c.accent, fontWeight: '600' },
    filterTextActive: { color: c.onPrimary },
  });
