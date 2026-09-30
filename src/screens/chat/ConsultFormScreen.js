import React, { useRef, useState } from 'react';
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
import { FontAwesome5 } from '@expo/vector-icons';
import * as requestService from '../../services/lawyerRequestService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Use Case: Lawyer_request — ฟอร์ม "Consult with Us" (Figma Lawyer_request)
export default function ConsultFormScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [subject, setSubject] = useState('');
  const [events, setEvents] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const panelTop = useRef(0);
  const fieldTops = useRef({});

  // แตะช่องหลายบรรทัดแล้วเลื่อนหน้าให้ทั้งช่องอยู่เหนือคีย์บอร์ด (รอคีย์บอร์ดขึ้นก่อน)
  // คู่กับ maxHeight ของช่อง — ข้อความยาวเลื่อนอยู่ในช่อง ไม่ไหลลงไปใต้คีย์บอร์ด
  // ช่องอยู่ในกรอบสีกรม ตำแหน่งจริง = ตำแหน่งกรอบ + ตำแหน่งช่องในกรอบ
  const trackField = (key) => ({
    onLayout: (e) => {
      fieldTops.current[key] = e.nativeEvent.layout.y;
    },
    onFocus: () => {
      const y = panelTop.current + (fieldTops.current[key] ?? 0) - 12;
      setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(y, 0), animated: true }), 300);
    },
  });

  const handleSend = async () => {
    if (!subject.trim() || !events.trim()) {
      setError(t('consult.errSubjectEvents'));
      return;
    }
    setSending(true);
    setError('');
    try {
      const { request } = await requestService.createRequest({
        subject: subject.trim(),
        events: events.trim(),
        message: message.trim(),
      });
      // แทนที่หน้าฟอร์มด้วยหน้าสถานะ (Awaiting Review) กดย้อนกลับแล้วไม่กลับมาที่ฟอร์มเดิม
      navigation.replace('RequestStatus', { requestId: request.id });
    } catch (e) {
      setError(e.message);
      setSending(false);
    }
  };

  return (
    <KeyboardAware style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.panel} onLayout={(e) => (panelTop.current = e.nativeEvent.layout.y)}>
          <View style={styles.logoBox}>
            <FontAwesome5 name="dove" size={56} color="#000" />
          </View>

          <Text style={styles.heading}>{t('consult.fillInfo')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('consult.subjectPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={subject}
            onChangeText={setSubject}
            maxLength={150}
          />
          <TextInput
            style={[styles.input, styles.area]}
            placeholder={t('consult.eventsPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={events}
            onChangeText={setEvents}
            {...trackField('events')}
            multiline
            textAlignVertical="top"
            maxLength={3000}
          />
          <TextInput
            style={[styles.input, styles.area]}
            placeholder={t('consult.messagePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            {...trackField('message')}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending} accessibilityRole="button">
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>{t('consult.send')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAware>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { padding: 16 },
    panel: { backgroundColor: c.primary, borderRadius: 6, padding: 16 },
    logoBox: {
      backgroundColor: '#fff',
      borderRadius: 8,
      height: 110,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    heading: { color: c.onPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
    input: {
      backgroundColor: c.surface,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: c.text,
      marginBottom: 14,
    },
    area: { minHeight: 130, maxHeight: 200 },
    error: { color: '#FFD2D2', marginBottom: 10 },
    sendBtn: {
      borderWidth: 1,
      borderColor: '#fff',
      borderRadius: 8,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 40,
    },
    sendText: { color: c.onPrimary, fontSize: 15, fontWeight: '600' },
  });
