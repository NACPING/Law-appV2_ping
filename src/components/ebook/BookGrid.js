import React from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions } from 'react-native';
import BookCard from './BookCard';
import { useThemedStyles } from '../../context/ThemeContext';

// ตารางหนังสือ 2 คอลัมน์ (หน้าหมวด และหน้า Favorite)
export default function BookGrid({ ebooks, onPress, emptyText, refreshControl, ListHeaderComponent }) {
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min((Math.min(width, 600) - 16 * 2 - 20) / 2, 170);

  return (
    <FlatList
      data={ebooks}
      keyExtractor={(e) => e.id}
      numColumns={2}
      columnWrapperStyle={styles.column}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => <BookCard ebook={item} width={cardWidth} onPress={() => onPress(item)} showFavorite />}
      ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={refreshControl}
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    content: { padding: 16 },
    column: { justifyContent: 'space-around', marginBottom: 20 },
    empty: { textAlign: 'center', color: c.textMuted, marginTop: 60, paddingHorizontal: 24 },
  });
