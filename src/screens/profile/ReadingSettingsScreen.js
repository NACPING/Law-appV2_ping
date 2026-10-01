import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import SettingSwitch from '../../components/SettingSwitch';
import { useLanguage } from '../../context/LanguageContext';
import { useThemedStyles } from '../../context/ThemeContext';
import { DEFAULT_READING_PREFS, getReadingPrefs, setReadingPrefs } from '../../utils/readingPrefs';

// Settings > Reading preferences — มีผลกับตัวอ่าน E-Book (เปิดหนังสือครั้งถัดไป)
export default function ReadingSettingsScreen() {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const [prefs, setPrefs] = useState(DEFAULT_READING_PREFS);

  useEffect(() => {
    getReadingPrefs().then(setPrefs);
  }, []);

  const change = (key) => (value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setReadingPrefs(next);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SettingSwitch
        label={t('prefs.rememberPage')}
        hint={t('prefs.rememberPageHint')}
        value={prefs.rememberPage}
        onValueChange={change('rememberPage')}
      />
      <SettingSwitch
        label={t('prefs.darkPages')}
        hint={t('prefs.darkPagesHint')}
        value={prefs.darkPages}
        onValueChange={change('darkPages')}
      />
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingTop: 12, paddingBottom: 32 },
  });
