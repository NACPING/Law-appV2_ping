import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import BookGrid from '../../components/ebook/BookGrid';
import * as ebookService from '../../services/ebookService';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// หนังสือทั้งหมดในหมวด (กดลูกศร > จากหน้า E-Book)
export default function EbookCategoryScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { categoryId } = route.params;
  const [ebooks, setEbooks] = useState(null);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      ebookService
        .searchEbooks({ category: categoryId })
        .then((d) => setEbooks(d.ebooks))
        .catch((e) => {
          setError(e.message);
          setEbooks([]);
        });
    }, [categoryId])
  );

  if (!ebooks) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BookGrid
        ebooks={ebooks}
        emptyText={error || t('ebook.emptyCategory')}
        onPress={(e) => navigation.navigate('EbookDetail', { ebookId: e.id, title: e.title })}
      />
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
  });
