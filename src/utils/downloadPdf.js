import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// extend: Download e-book (และไฟล์ PDF ในแชท) — เก็บไฟล์ไว้ในเครื่อง แล้วเปิดเมนูแชร์ (บันทึกลง Files / เปิดด้วยแอปอื่น)
// { title, fileUrl, fileName?, folder? } — ไฟล์ในแชทมี ?token= ใน URL จึงต้องส่ง fileName มาเอง
const localFile = (doc) =>
  new File(
    Paths.document,
    doc.folder ?? 'ebooks',
    doc.fileName ?? decodeURIComponent(doc.fileUrl.split('?')[0].split('/').pop())
  );

export const isDownloaded = (ebook) => {
  try {
    return localFile(ebook).exists;
  } catch {
    return false;
  }
};

export async function downloadPdf(ebook) {
  const file = localFile(ebook);
  if (!file.exists) {
    file.parentDirectory.create({ idempotent: true, intermediates: true });
    await File.downloadFileAsync(ebook.fileUrl, file);
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: ebook.title });
  }
  return file.uri;
}
