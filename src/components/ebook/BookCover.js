import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { categoryName } from '../../utils/labels';

// ปกหนังสือที่แอปวาดเอง (ไม่ใช้รูปปกหนังสือขายจริงที่มีลิขสิทธิ์) — สีตามหมวด
export default function BookCover({ ebook, width = 110 }) {
  useLanguage(); // render ใหม่เมื่อเปลี่ยนภาษา (ข้อความจาก utils ใช้ภาษาปัจจุบัน)
  const height = Math.round(width * 1.4);
  const small = width < 90;

  return (
    <View style={[styles.cover, { width, height, backgroundColor: ebook.category?.color ?? '#1E2B58' }]}>
      <View style={styles.spine} />
      <View style={styles.frame}>
        <Text style={[styles.category, { fontSize: Math.max(7, width * 0.07) }]} numberOfLines={1}>
          {categoryName(ebook.category).replace(/^(หมวด|หมวดกฎหมาย)\s*/, '').replace(/ Law$/, '') ?? ''}
        </Text>
        <MaterialCommunityIcons name="scale-balance" size={width * 0.24} color="#E9D8A6" />
        <Text
          style={[styles.title, { fontSize: width * (small ? 0.1 : 0.105), lineHeight: width * (small ? 0.14 : 0.15) }]}
          numberOfLines={small ? 3 : 5}
        >
          {ebook.title}
        </Text>
        <Text style={[styles.year, { fontSize: Math.max(7, width * 0.07) }]} numberOfLines={1}>
          {ebook.publishedLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 3 },
    elevation: 4,
  },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: 'rgba(0,0,0,0.25)' },
  frame: {
    flex: 1,
    margin: 7,
    marginLeft: 11,
    borderWidth: 1,
    borderColor: 'rgba(233,216,166,0.7)',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  category: { color: '#E9D8A6', fontWeight: '600' },
  title: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  year: { color: 'rgba(255,255,255,0.8)' },
});
