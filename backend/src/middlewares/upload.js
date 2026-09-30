const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILES = 5;
const MAX_SIZE_MB = 5;
const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  // ตั้งชื่อไฟล์ใหม่แบบสุ่ม ไม่ใช้ชื่อที่ผู้ใช้ส่งมา
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${EXT_BY_MIME[file.mimetype]}`),
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE')); // ข้อความตามภาษาอยู่ใน MESSAGES
  },
});

// ข้อความ error ของ multer ตามภาษาของผู้ใช้
const MESSAGES = {
  LIMIT_FILE_SIZE: (req) => req.t('upload.imageSize', { mb: MAX_SIZE_MB }),
  LIMIT_FILE_COUNT: (req) => req.t('upload.imageCount', { n: MAX_FILES }),
  LIMIT_UNEXPECTED_FILE: (req) => req.t('upload.imageType'),
};

// รับรูปในฟิลด์ "images" แล้วแปลง error ของ multer เป็นข้อความที่ผู้ใช้อ่านได้ (400)
function uploadPostImages(req, res, next) {
  multerUpload.array('images', MAX_FILES)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: MESSAGES[err.code]?.(req) || err.message });
    }
    next(err);
  });
}

// รูปโปรไฟล์: รับไฟล์เดียวในฟิลด์ "avatar" (ขีดจำกัดเดียวกับรูปโพสต์)
function uploadAvatar(req, res, next) {
  multerUpload.single('avatar')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: MESSAGES[err.code]?.(req) || err.message });
    }
    next(err);
  });
}

// ลบไฟล์ที่อัปโหลดแล้ว (เช่น เมื่อข้อมูลไม่ผ่านการตรวจ หรือโพสต์ถูกลบ)
function removeUploadedFiles(urls) {
  for (const url of urls) {
    if (!url.startsWith('/uploads/')) continue; // ข้ามรูปจากเว็บภายนอก (ข้อมูลตัวอย่าง)
    fs.rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true }, () => {});
  }
}

module.exports = { UPLOAD_DIR, MAX_FILES, uploadPostImages, uploadAvatar, removeUploadedFiles };
