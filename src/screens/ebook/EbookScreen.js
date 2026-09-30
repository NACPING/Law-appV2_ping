import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import BookCard from '../../components/ebook/BookCard';
import BellButton from '../../components/BellButton';
import { categoryName } from '../../utils/labels';
import * as ebookService from '../../services/ebookService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Use Case: Reading — หน้า E-Book (หนังสือแยกตามหมวด)
export default function EbookScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await ebookService.getCategories();
      setCategories(data.categories);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // โหลดใหม่เมื่อกลับมาหน้านี้ (สถานะ Favorite อาจเปลี่ยน)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // มุมขวาบน: หัวใจ (หนังสือที่ชอบ) อยู่หน้ากระดิ่ง แบบเดียวกับปุ่มค้นหาของหน้า Communication
  // (มุมซ้ายเป็นปุ่ม ☰ ที่ตั้งไว้ใน EbookNavigator)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('EbookFavorites')} hitSlop={10} accessibilityLabel={t('ebook.favorites')}>
            <Ionicons name="heart-outline" size={23} color={colors.text} />
          </TouchableOpacity>
          <BellButton />
        </View>
      ),
    });
  }, [navigation, colors, styles, t]);

  const openBook = (ebook) => navigation.navigate('EbookDetail', { ebookId: ebook.id, title: ebook.title });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
    >
      <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('EbookSearch')} activeOpacity={0.8}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <Text style={styles.searchText}>{t('ebook.search')}</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {categories.map((cat) => (
        <View key={cat.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{categoryName(cat)}</Text>
          <FlatList
            horizontal
            data={cat.ebooks}
            keyExtractor={(e) => e.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
            renderItem={({ item }) => <BookCard ebook={item} onPress={() => openBook(item)} showFavorite />}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.more}
                onPress={() => navigation.navigate('EbookCategory', { categoryId: cat.id, title: categoryName(cat) })}
                accessibilityLabel={t('ebook.seeAllIn', { name: categoryName(cat) })}
              >
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            }
            ListFooterComponentStyle={styles.moreWrap}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    content: { paddingBottom: 24 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 8,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: 8,
      backgroundColor: c.inputBg,
    },
    searchText: { marginLeft: 8, color: c.textMuted },
    error: { color: c.error, textAlign: 'center', margin: 16 },
    section: { marginTop: 14 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: c.text, marginHorizontal: 16, marginBottom: 10 },
    row: { paddingHorizontal: 16 },
    moreWrap: { justifyContent: 'center', height: 154 },
    more: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#9E9E9E',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
