import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useThemedStyles } from '../../context/ThemeContext';

// แผง emoji ที่ใช้บ่อย (ตามปุ่มหน้ายิ้มใน Figma chat_box) — แตะเพื่อแทรกลงข้อความ
const EMOJIS = [
  '😀', '😃', '😄', '😁', '😊', '🙂', '😉', '😍',
  '🥰', '😘', '😅', '😂', '🤣', '😇', '🤔', '🤗',
  '😐', '😶', '🙄', '😏', '😌', '😔', '😢', '😭',
  '😤', '😠', '😡', '😱', '😨', '😰', '😳', '🥺',
  '😴', '🤒', '😷', '🤯', '😎', '🥳', '🤩', '😬',
  '👍', '👎', '👌', '✌️', '🤞', '👏', '🙏', '🙌',
  '💪', '👋', '🤝', '✍️', '👀', '❤️', '💔', '💯',
  '✅', '❌', '⚠️', '❓', '❗', '📄', '📎', '⚖️',
  '🏠', '🚗', '💰', '📱', '📅', '⏰', '🔒', '🎉',
];

export default function EmojiPanel({ onSelect, style }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView style={[styles.panel, style]} contentContainerStyle={styles.grid} keyboardShouldPersistTaps="always">
      {EMOJIS.map((e) => (
        <TouchableOpacity key={e} style={styles.cell} onPress={() => onSelect(e)} accessibilityLabel={e}>
          <Text style={styles.emoji}>{e}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    panel: { height: 220, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6, paddingVertical: 6 },
    cell: { width: '12.5%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 26 },
  });
