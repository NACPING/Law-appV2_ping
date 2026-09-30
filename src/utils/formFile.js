import { File } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { translate } from '../i18n';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Base64 → bytes (ใช้กับวิธีอ่านไฟล์สำรอง) — ถอดเองเผื่อ runtime ไม่มี atob
function base64ToBytes(b64) {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let out = 0;
  for (let i = 0; i < clean.length; i++) {
    buffer = (buffer << 6) | B64.indexOf(clean[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[out++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes.subarray(0, out);
}

// อ่านไฟล์จากเครื่องเป็น bytes — ลอง API ใหม่ก่อน ถ้าไม่ได้ (เช่น ชื่อไฟล์มีช่องว่าง/อักขระพิเศษ)
// ใช้ API แบบเดิม (legacy) ที่รับที่อยู่ไฟล์ได้ยืดหยุ่นกว่า
async function readBytes(uri) {
  try {
    return await new File(uri).bytes();
  } catch (firstError) {
    try {
      const b64 = await LegacyFileSystem.readAsStringAsync(uri, { encoding: LegacyFileSystem.EncodingType.Base64 });
      return base64ToBytes(b64);
    } catch {
      throw new Error(translate('errors.readFileFailed', { message: firstError.message }));
    }
  }
}

// แนบไฟล์จาก expo-image-picker / expo-document-picker ลงใน FormData (มือถือ)
// Expo 57 ใช้ fetch ตัวใหม่ (expo/fetch) ที่ "ไม่รองรับ" รูปแบบเดิมของ React Native { uri, name, type }
// จึงอ่านไฟล์ก่อนส่ง แล้วแนบเป็น object ที่มี bytes() — ถ้าอ่านไม่ได้จะรู้สาเหตุตั้งแต่ตรงนี้
export async function appendFile(form, field, asset, { fallbackName, fallbackType, maxBytes }) {
  const bytes = await readBytes(asset.uri);
  if (maxBytes && bytes.length > maxBytes) {
    throw new Error(translate('errors.fileTooBig', { mb: Math.round(maxBytes / 1024 / 1024) }));
  }
  form.append(field, {
    name: asset.fileName || asset.name || fallbackName,
    type: asset.mimeType || fallbackType,
    bytes: async () => bytes,
  });
}
