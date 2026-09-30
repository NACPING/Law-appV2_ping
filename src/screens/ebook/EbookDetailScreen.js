import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BookCover from '../../components/ebook/BookCover';
import * as ebookService from '../../services/ebookService';
import { downloadPdf, isDownloaded } from '../../utils/downloadPdf';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

// หน้า E-Book Details: ปก, Favorite, รายละเอียด, อ่าน, ดาวน์โหลด
export default function EbookDetailScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { ebookId } = route.params;
  const [ebook, setEbook] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    ebookService
      .getEbook(ebookId)
      .then((d) => {
        setEbook(d.ebook);
        setDownloaded(isDownloaded(d.ebook));
      })
      .catch((e) => setError(e.message));
  }, [ebookId]);

  // extend: Bookmark e-book — เปลี่ยนหัวใจทันที ถ้าบันทึกไม่สำเร็จค่อยเปลี่ยนกลับ
  const toggleFavorite = useCallback(async () => {
    const next = !ebook.isFavorite;
    setEbook((b) => ({ ...b, isFavorite: next }));
    try {
      await ebookService.setFavorite(ebook.id, next);
    } catch (e) {
      setEbook((b) => ({ ...b, isFavorite: !next }));
      setError(e.message);
    }
  }, [ebook]);

  // extend: Download e-book
  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadPdf(ebook);
      setDownloaded(isDownloaded(ebook));
    } catch (e) {
      setError(t('ebook.downloadFailed', { message: e.message }));
    } finally {
      setDownloading(false);
    }
  };

  if (!ebook) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" color={colors.accent} />}
      </View>
    );
  }

  const info = [
    // ค่าทางขวาเป็นข้อมูลจากหน่วยงานรัฐ (ภาษาไทย) — แปลเฉพาะหัวข้อ
    [t('ebook.issuer'), ebook.issuer],
    [t('ebook.version'), ebook.versionNote],
    [t('ebook.published'), ebook.publishedLabel],
    [t('ebook.size'), `${t('ebook.pages', { n: ebook.pageCount })} · ${formatSize(ebook.fileSize)}`],
    [t('ebook.source'), ebook.source],
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.coverRow}>
          <BookCover ebook={ebook} width={150} />
          <TouchableOpacity
            style={styles.heart}
            onPress={toggleFavorite}
            accessibilityRole="button"
            accessibilityLabel={ebook.isFavorite ? t('ebook.removeFavorite') : t('ebook.addFavorite')}
            accessibilityState={{ selected: ebook.isFavorite }}
          >
            <Ionicons name={ebook.isFavorite ? 'heart' : 'heart-outline'} size={26} color="#E5484D" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{ebook.title}</Text>
        <Text style={styles.description}>{ebook.description}</Text>

        <View style={styles.infoBox}>
          {info.map(([label, value]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}:</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => Linking.openURL(ebook.sourceUrl)} hitSlop={6}>
            <Text style={styles.link}>{t('ebook.openSource')}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.readBtn}
          onPress={() => navigation.navigate('PdfReader', { ebook })}
          accessibilityRole="button"
        >
          <Ionicons name="book-outline" size={20} color="#fff" />
          <Text style={styles.readText}>{t('ebook.read')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          disabled={downloading}
          accessibilityRole="button"
        >
          {downloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.downloadText}>{downloaded ? t('ebook.openShare') : t('ebook.download')}</Text>
              <Ionicons name={downloaded ? 'checkmark-done' : 'download-outline'} size={22} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, padding: 24 },
    scroll: { padding: 20, paddingBottom: 32 },
    coverRow: { alignItems: 'center', marginBottom: 20 },
    heart: {
      position: 'absolute',
      right: 12,
      top: 0,
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontSize: 24, fontWeight: '800', color: c.text, marginBottom: 10 },
    description: { fontSize: 14, lineHeight: 22, color: c.textSecondary, marginBottom: 16 },
    infoBox: { gap: 6 },
    infoRow: { flexDirection: 'row' },
    infoLabel: { width: 72, fontSize: 13, fontWeight: '700', color: c.text },
    infoValue: { flex: 1, fontSize: 13, color: c.textSecondary },
    link: { fontSize: 13, color: c.accent, textDecorationLine: 'underline', marginTop: 6 },
    error: { color: c.error, textAlign: 'center', marginTop: 12 },
    actions: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: c.border },
    readBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: c.primary,
      borderRadius: 10,
      height: 50,
      paddingHorizontal: 22,
    },
    readText: { color: c.onPrimary, fontSize: 16, fontWeight: '700' },
    downloadBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: '#5AA9E6',
      borderRadius: 10,
      height: 50,
    },
    downloadText: { color: c.onPrimary, fontSize: 17, fontWeight: '600' },
  });
