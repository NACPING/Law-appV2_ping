import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';

// ป้ายสถานะคำขอ (สีตาม Figma Chat_request) — ชื่อสถานะอยู่ใน i18n: status.<STATUS>
export const STATUS = {
  PENDING: { bg: '#FFE7A3', fg: '#7A5B00' },
  APPROVED: { bg: '#BFE8B0', fg: '#1F5E14' },
  REJECTED: { bg: '#F9B4B4', fg: '#7A1515' },
  CLOSED: { bg: '#DADDE5', fg: '#3F4555' },
};

export default function StatusChip({ status }) {
  const { t } = useLanguage();
  const key = STATUS[status] ? status : 'PENDING';
  const s = STATUS[key];
  return <Text style={[styles.chip, { backgroundColor: s.bg, color: s.fg }]}>{t(`status.${key}`)}</Text>;
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-end',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
