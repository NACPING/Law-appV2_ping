import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PdfReader from '../../components/ebook/PdfReader';
import { downloadPdf } from '../../utils/downloadPdf';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLastPage, getReadingPrefs, saveLastPage } from '../../utils/readingPrefs';

// Use Case: Reading — อ่าน PDF ในแอป
export default function PdfReaderScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { ebook } = route.params;
  const [downloading, setDownloading] = useState(false);
  // Settings > Reading preferences + หน้าที่อ่านค้างไว้ — ต้องรู้ก่อนเปิดเอกสาร (null = กำลังโหลด)
  const [reading, setReading] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const prefs = await getReadingPrefs();
      const startPage = prefs.rememberPage ? await getLastPage(ebook.id) : 1;
      if (active) setReading({ ...prefs, startPage });
    })();
    return () => {
      active = false;
    };
  }, [ebook.id]);

  const rememberPage = reading?.rememberPage;
  const handleMessage = useCallback(
    (msg) => {
      if (rememberPage && msg?.type === 'page') saveLastPage(ebook.id, msg.page);
    },
    [rememberPage, ebook.id]
  );

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
      {reading ? (
        <PdfReader
          url={ebook.fileUrl}
          startPage={reading.startPage}
          darkPages={reading.darkPages}
          onMessage={handleMessage}
        />
      ) : (
        <ActivityIndicator style={styles.loading} color={colors.accent} />
      )}
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    loading: { marginTop: 40 },
    container: { flex: 1, backgroundColor: c.surfaceAlt },
  });
