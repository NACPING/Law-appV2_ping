import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ebookService from '../../services/ebookService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { categoryName } from '../../utils/labels';

// extend: Search e-book — ค้นหาชื่อ/คำอธิบายหนังสือ (หน้า reading_search ใน Figma)
export default function EbookSearchScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // รอพิมพ์เสร็จ 300ms ค่อยค้นหา
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const d = await ebookService.searchEbooks({ q: query.trim() });
        if (active) {
          setResults(d.ebooks);
          setError('');
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={t('ebook.search')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8} accessibilityLabel={t('ebook.clearSearch')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.cancel}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{query.trim() ? t('ebook.searchResults') : t('ebook.related')}</Text>

      {loading && results.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('EbookDetail', { ebookId: item.id, title: item.title })}
            >
              <Ionicons name="book-outline" size={22} color={colors.text} />
              <View style={styles.rowText}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title} {item.publishedLabel.startsWith('พ.ศ.') ? item.publishedLabel : ''}
                </Text>
                <Text style={styles.category}>{categoryName(item.category)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{error || t('ebook.notFound', { query: query.trim() })}</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: 36,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: c.inputBg,
    },
    input: { flex: 1, marginLeft: 6, color: c.text, fontSize: 14 },
    cancel: { color: c.text, fontSize: 14 },
    label: { fontSize: 14, fontWeight: '700', color: c.text, marginHorizontal: 16, marginTop: 6, marginBottom: 8 },
    loader: { marginTop: 40 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    rowText: { flex: 1, marginLeft: 14 },
    title: { fontSize: 14, fontWeight: '600', color: c.text },
    category: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    separator: { height: 1, backgroundColor: c.border, marginLeft: 52 },
    empty: { textAlign: 'center', color: c.textMuted, marginTop: 40, paddingHorizontal: 24 },
  });
