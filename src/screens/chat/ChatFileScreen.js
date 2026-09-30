import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PdfReader from '../../components/ebook/PdfReader';
import { downloadPdf } from '../../utils/downloadPdf';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// เปิดไฟล์ PDF ที่ส่งในแชท (ใช้ตัวอ่านเดียวกับ E-Book)
export default function ChatFileScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { url, name } = route.params;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await downloadPdf({ title: name, fileUrl: url, fileName: name, folder: 'chat' });
    } finally {
      setDownloading(false);
    }
  }, [url, name]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name,
      headerRight: () =>
        downloading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <TouchableOpacity onPress={handleDownload} hitSlop={10} accessibilityLabel={t('common.downloadPdf')}>
            <Ionicons name="download-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        ),
    });
  }, [navigation, name, downloading, handleDownload, colors, t]);

  return (
    <View style={styles.container}>
      <PdfReader url={url} />
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({ container: { flex: 1, backgroundColor: c.surfaceAlt } });
