import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PdfReader from '../../components/ebook/PdfReader';
import { downloadPdf } from '../../utils/downloadPdf';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Use Case: Reading — อ่าน PDF ในแอป
export default function PdfReaderScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { ebook } = route.params;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await downloadPdf(ebook);
    } finally {
      setDownloading(false);
    }
  }, [ebook]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: ebook.title,
      headerRight: () =>
        downloading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <TouchableOpacity onPress={handleDownload} hitSlop={10} accessibilityLabel={t('common.downloadPdf')}>
            <Ionicons name="download-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        ),
    });
  }, [navigation, ebook.title, downloading, handleDownload, colors, t]);

  return (
    <View style={styles.container}>
      <PdfReader url={ebook.fileUrl} />
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surfaceAlt },
  });
