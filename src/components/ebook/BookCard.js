import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BookCover from './BookCover';
import { useThemedStyles } from '../../context/ThemeContext';

// การ์ดหนังสือ: ปก + ชื่อ + คำอธิบายสั้น (แบบหน้า reading ใน Figma)
export default function BookCard({ ebook, width = 110, onPress, showFavorite = false }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={onPress} activeOpacity={0.8} accessibilityLabel={ebook.title}>
      <View>
        <BookCover ebook={ebook} width={width} />
        {showFavorite && ebook.isFavorite && (
          <View style={styles.heart}>
            <Ionicons name="heart" size={14} color="#E5484D" />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {ebook.title}
      </Text>
      <Text style={styles.desc} numberOfLines={2}>
        {ebook.description}
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    card: { marginRight: 14 },
    heart: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontSize: 12, fontWeight: '700', color: c.text, marginTop: 8 },
    desc: { fontSize: 10, color: c.textMuted, marginTop: 2, lineHeight: 14 },
  });
