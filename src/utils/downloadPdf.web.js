// เว็บ: เปิดไฟล์ในแท็บใหม่ ผู้ใช้กดบันทึกจากตัวแสดง PDF ของเบราว์เซอร์ได้
export const isDownloaded = () => false;

export async function downloadPdf(ebook) {
  window.open(ebook.fileUrl, '_blank', 'noopener');
  return ebook.fileUrl;
}
