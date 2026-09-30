import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { pdfViewerHtml } from './pdfViewerHtml';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// มือถือ: WebView + pdf.js (ใช้ได้ใน Expo Go)
export default function PdfReader({ url, onMessage }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const html = useMemo(
    () =>
      pdfViewerHtml(
        url,
        { background: colors.surfaceAlt, text: colors.icon },
        { loading: t('ebook.pdfLoading'), noViewer: t('ebook.pdfNoViewer'), page: t('ebook.pdfPage'), openFailed: t('ebook.pdfOpenFailed') }
      ),
    [url, colors, t]
  );
  return (
    <WebView
      style={styles.flex}
      originWhitelist={['*']}
      source={{ html, baseUrl: url }}
      onMessage={(e) => onMessage?.(safeParse(e.nativeEvent.data))}
      javaScriptEnabled
      setSupportMultipleWindows={false}
    />
  );
}

const safeParse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const styles = StyleSheet.create({ flex: { flex: 1 } });
