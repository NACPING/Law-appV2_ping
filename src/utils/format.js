import { Alert, Platform } from 'react-native';
import { localeOf, translate } from '../i18n';

// ฟังก์ชันเหล่านี้ใช้ภาษาปัจจุบันของแอป — component ที่เรียกใช้ render ใหม่เองเมื่อเปลี่ยนภาษา (เพราะใช้ useLanguage)

// เวลาแบบ "3 ชั่วโมงที่แล้ว"
export function timeAgo(dateString) {
  const diffMin = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (diffMin < 1) return translate('time.justNow');
  if (diffMin < 60) return translate('time.minutesAgo', { n: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return translate('time.hoursAgo', { n: diffHr });
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return translate('time.daysAgo', { n: diffDay });
  return new Date(dateString).toLocaleDateString(localeOf(), { day: 'numeric', month: 'short', year: '2-digit' });
}

// วันที่ + เวลา เช่น "30 ก.ย. 69 13:57"
export const formatDateTime = (d) =>
  new Date(d).toLocaleString(localeOf(), { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });

export const displayName = (author) => (author ? `${author.firstName} ${author.lastName}` : translate('common.anonymous'));

// Alert แบบมีปุ่มยืนยันไม่ทำงานบนเว็บ จึงใช้ window.confirm แทน
export function confirmAction(title, message, confirmText = translate('common.ok')) {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n${message}`));
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: translate('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
