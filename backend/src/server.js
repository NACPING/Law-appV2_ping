const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { port } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const ebookRoutes = require('./routes/ebookRoutes');
const lawyerRequestRoutes = require('./routes/lawyerRequestRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const { UPLOAD_DIR } = require('./middlewares/upload');
const { initRealtime } = require('./realtime');
const { languageMiddleware } = require('./i18n');

const app = express();

// npm run share: เพื่อนเข้าผ่าน Cloudflare Tunnel (https) ที่ต่อเข้ามาจากเครื่องนี้เอง
// เชื่อ X-Forwarded-Proto/Host เฉพาะจาก localhost — ลิงก์รูป/PDF ที่สร้างให้จะเป็น https ของอุโมงค์ ไม่ใช่ http
app.set('trust proxy', 'loopback');

app.use(cors());
app.use(express.json());
app.use(languageMiddleware); // req.t() — ตอบข้อความตามภาษาที่แอปเลือก (header Accept-Language)

// รูปที่ผู้ใช้อัปโหลด (ชื่อไฟล์สุ่ม) — <Image> ในแอปส่ง token ไม่ได้ จึงเปิดให้โหลดได้โดยไม่ต้องล็อกอิน
app.use('/uploads', express.static(UPLOAD_DIR, { index: false, maxAge: '7d', setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff') }));

// ไฟล์ PDF ตัวบทกฎหมาย (สาธารณะ ไม่มีลิขสิทธิ์) — ตัวอ่าน PDF ในแอปส่ง token ไม่ได้ จึงไม่ต้องล็อกอิน
app.use('/files/ebooks', express.static(path.join(__dirname, '../storage/ebooks'), { index: false, maxAge: '1d' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/lawyer-requests', lawyerRequestRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Express 5 ส่ง error จาก async handler มาที่นี่อัตโนมัติ
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: req.t('server.internal') });
});

// ใช้ http server ตัวเดียวกันทั้ง REST และ socket.io (แชท real-time)
const server = http.createServer(app);
initRealtime(server);

// 0.0.0.0 = ให้มือถือในวง Wi-Fi เดียวกันเรียกได้
server.listen(port, '0.0.0.0', () => {
  console.log(`API running on http://localhost:${port}/api`);
});
