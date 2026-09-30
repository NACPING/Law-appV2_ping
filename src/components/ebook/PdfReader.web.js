import React, { useEffect, useMemo, useRef } from 'react';
import { pdfViewerHtml } from './pdfViewerHtml';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// เว็บ: react-native-webview ใช้บนเว็บไม่ได้ จึงแสดงหน้า pdf.js เดียวกันใน iframe
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
  const frameRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      try {
        onMessage?.(JSON.parse(e.data));
      } catch {
        // ข้อความจากที่อื่น ไม่ใช่ของตัวอ่าน
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  return (
    <iframe
      ref={frameRef}
      title="PDF"
      srcDoc={html}
      // allow-same-origin: ถ้าไม่มี iframe จะได้ origin "null" แล้วเบราว์เซอร์บล็อกการโหลด PDF จาก
      // เซิร์ฟเวอร์ในเครือข่ายภายใน (Private Network Access) — เนื้อหาใน iframe เป็นโค้ดของแอปเองเท่านั้น
      sandbox="allow-scripts allow-same-origin"
      style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
    />
  );
}
