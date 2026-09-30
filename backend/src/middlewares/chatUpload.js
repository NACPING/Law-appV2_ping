const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ไฟล์แนบในแชทเป็นข้อมูลลับ — เก็บนอกโฟลเดอร์สาธารณะ เปิดได้ผ่าน API ที่ตรวจสิทธิ์เท่านั้น
const CHAT_DIR = path.join(__dirname, '../../storage/chat');
fs.mkdirSync(CHAT_DIR, { recursive: true });

const MAX_SIZE_MB = 10;

// ชนิดไฟล์ที่มือถืออาจส่งมา — บางแอปจัดการไฟล์บน Android ส่ง PDF มาเป็น octet-stream
// จึงรับไว้ก่อน แล้วตัดสินชนิดจริงจาก "เนื้อไฟล์" ใน detectType() อีกที
const ACCEPTED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/octet-stream',
  '',
]);

// ดูชนิดไฟล์จาก byte แรก ๆ ของไฟล์ (ไม่เชื่อชนิดที่ client บอกมา)
function detectType(head) {
  const ascii = head.toString('latin1');
  // มาตรฐาน PDF: "%PDF-" อยู่ที่ไหนก็ได้ใน 1024 byte แรก
  if (ascii.includes('%PDF-')) return { kind: 'pdf', mime: 'application/pdf' };
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return { kind: 'image', mime: 'image/jpeg' };
  if (ascii.startsWith('\x89PNG')) return { kind: 'image', mime: 'image/png' };
  if (ascii.startsWith('GIF8')) return { kind: 'image', mime: 'image/gif' };
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return { kind: 'image', mime: 'image/webp' };
  if (ascii.slice(4, 8) === 'ftyp' && /hei[cfsx]|mif1|msf1/.test(ascii.slice(8, 12))) {
    return { kind: 'image', mime: 'image/heic' };
  }
  return null;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: CHAT_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomUUID()), // ชื่อสุ่ม ไม่มีนามสกุล (ชนิดจริงเก็บในฐานข้อมูล)
  }),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: 1 },
  defParamCharset: 'utf8', // ชื่อไฟล์ภาษาไทยไม่เพี้ยน
  fileFilter: (req, file, cb) => {
    if (ACCEPTED_MIMES.has(file.mimetype ?? '')) return cb(null, true);
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    err.message = 'แนบได้เฉพาะรูปภาพหรือไฟล์ PDF';
    cb(err);
  },
});

const MESSAGES = {
  LIMIT_FILE_SIZE: `ไฟล์ต้องมีขนาดไม่เกิน ${MAX_SIZE_MB} MB`,
  LIMIT_FILE_COUNT: 'แนบได้ครั้งละ 1 ไฟล์',
};

const removeChatFile = (storedName) => {
  if (storedName) fs.rm(path.join(CHAT_DIR, path.basename(storedName)), { force: true }, () => {});
};

// รับไฟล์ฟิลด์ "file" (ไม่บังคับ) แล้วตัดสินชนิดจากเนื้อไฟล์ — ไม่ใช่รูปหรือ PDF จริง = ปฏิเสธ
function uploadChatFile(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: MESSAGES[err.code] || err.message });
    }
    if (err) return next(err);
    if (!req.file) return next();

    const head = Buffer.alloc(1024);
    const fd = fs.openSync(req.file.path, 'r');
    const read = fs.readSync(fd, head, 0, head.length, 0);
    fs.closeSync(fd);

    const type = detectType(head.subarray(0, read));
    if (!type) {
      removeChatFile(req.file.filename);
      return res.status(400).json({ message: 'แนบได้เฉพาะรูปภาพหรือไฟล์ PDF (ไฟล์นี้ไม่ใช่รูปหรือ PDF ที่ถูกต้อง)' });
    }
    req.file.kind = type.kind;
    req.file.mimetype = type.mime;
    next();
  });
}

module.exports = { CHAT_DIR, uploadChatFile, removeChatFile };
