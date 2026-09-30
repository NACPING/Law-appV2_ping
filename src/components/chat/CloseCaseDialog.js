import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// หน้าต่างเด้งให้ลูกความตอบคำขอปิดเคสของทนาย
export default function CloseCaseDialog({ visible, lawyerName, onAccept, onDecline, onLater }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Ionicons name="hand-left-outline" size={40} color={colors.warningIcon} style={styles.icon} />
          <Text style={styles.title}>{t('chat.dialogTitle')}</Text>
          <Text style={styles.body}>{t('chat.dialogBody', { name: lawyerName })}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.decline]} onPress={onDecline} accessibilityRole="button">
              <Text style={styles.declineText}>{t('chat.decline')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.accept]} onPress={onAccept} accessibilityRole="button">
              <Text style={styles.acceptText}>{t('chat.acceptClose')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onLater} style={styles.later} accessibilityRole="button">
            <Text style={styles.laterText}>{t('chat.later')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { width: '100%', maxWidth: 380, backgroundColor: c.surface, borderRadius: 16, padding: 20, alignItems: 'center' },
    icon: { marginBottom: 6 },
    title: { fontSize: 18, fontWeight: '700', color: c.text },
    body: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 21, marginTop: 8 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 18, alignSelf: 'stretch' },
    btn: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    decline: { borderWidth: 1, borderColor: c.border },
    declineText: { color: c.text, fontWeight: '600' },
    accept: { backgroundColor: c.primary },
    acceptText: { color: c.onPrimary, fontWeight: '700' },
    later: { marginTop: 12, padding: 6 },
    laterText: { color: c.textMuted, fontSize: 13 },
  });
