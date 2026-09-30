import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RequestCard from '../../components/consult/RequestCard';
import * as requestService from '../../services/lawyerRequestService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// ลูกความ: คำขอปรึกษาทั้งหมดของฉัน (Figma Chat_request)
export default function RequestListScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [requests, setRequests] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await requestService.getRequests();
      setRequests(d.requests);
      setError('');
    } catch (e) {
      setError(e.message);
      setRequests((prev) => prev ?? []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <FlatList
      style={styles.container}
      data={requests ?? []}
      keyExtractor={(r) => r.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={colors.accent}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.sub}>{t('consult.listSub')}</Text>
          <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('ConsultForm')}>
            <Text style={styles.newBtnText}>{t('consult.newRequest')}</Text>
          </TouchableOpacity>
          {requests === null && <ActivityIndicator style={styles.loader} color={colors.accent} />}
        </View>
      }
      renderItem={({ item }) => (
        <RequestCard request={item} onPress={() => navigation.navigate('RequestStatus', { requestId: item.id })} />
      )}
      ListEmptyComponent={
        requests === null ? null : <Text style={styles.empty}>{error || t('consult.emptyList')}</Text>
      }
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    list: { paddingBottom: 24 },
    header: { paddingHorizontal: 16, paddingBottom: 12 },
    sub: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginBottom: 10 },
    newBtn: { backgroundColor: c.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    newBtnText: { color: c.onPrimary, fontWeight: '600', fontSize: 14 },
    loader: { marginTop: 30 },
    empty: { textAlign: 'center', color: c.textMuted, marginTop: 30, paddingHorizontal: 24 },
  });
