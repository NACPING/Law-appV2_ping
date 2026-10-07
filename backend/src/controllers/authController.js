const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SELF_REGISTER_ROLES = ['CLIENT', 'LAWYER']; // ADMIN สมัครเองไม่ได้
// รูปแบบที่ตกลงกับเจ้าของ: เลขบัตรประชาชน 13 หลัก (ไม่รับพาสปอร์ต) · เบอร์โทร 10 หลัก (ไม่บังคับ)
// · เลขใบอนุญาตทนาย 8–10 ตัว ใส่อะไรก็ได้ (เลข ตัวอักษร เครื่องหมาย เช่น 12345/2560)
const ID_CARD_PATTERN = /^\d{13}$/;
const PHONE_PATTERN = /^\d{10}$/;
const LICENSE_MIN = 8;
const LICENSE_MAX = 10;
exports.PHONE_PATTERN = PHONE_PATTERN;

// ข้อมูลของผู้ใช้ที่ล็อกอิน (ส่งให้เจ้าของบัญชีเท่านั้น)
const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  phone: user.phone,
  licenseId: user.licenseId, // ส่งให้เจ้าของบัญชีเท่านั้น — โปรไฟล์ที่คนอื่นเห็นไม่มีช่องนี้
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  about: user.about,
  showContact: user.showContact,
  notifyPosts: user.notifyPosts,
  notifyChat: user.notifyChat,
  notifyCases: user.notifyCases,
  notifyFollows: user.notifyFollows,
  postAnonymously: user.postAnonymously,
});
exports.publicUser = publicUser;

const signToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

// POST /api/auth/register — Use Case: Register
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, dob, role } = req.body ?? {};
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const normalizedRole = String(role ?? 'CLIENT').toUpperCase();
  const idCard = String(req.body?.idCardOrPass ?? '').trim();
  const phone = String(req.body?.phone ?? '').trim();
  const licenseId = normalizedRole === 'LAWYER' ? String(req.body?.licenseId ?? '').trim() : '';

  if (!idCard || !firstName || !lastName || !normalizedEmail || !password) {
    return res.status(400).json({ message: req.t('auth.required') });
  }
  if (!ID_CARD_PATTERN.test(idCard)) {
    return res.status(400).json({ message: req.t('auth.idCardFormat') });
  }
  if (phone && !PHONE_PATTERN.test(phone)) {
    return res.status(400).json({ message: req.t('auth.phoneFormat') });
  }
  if (normalizedRole === 'LAWYER' && (licenseId.length < LICENSE_MIN || licenseId.length > LICENSE_MAX)) {
    return res.status(400).json({ message: req.t('auth.licenseFormat', { min: LICENSE_MIN, max: LICENSE_MAX }) });
  }
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({ message: req.t('auth.emailFormat') });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: req.t('auth.passwordShort') });
  }
  if (!SELF_REGISTER_ROLES.includes(normalizedRole)) {
    return res.status(400).json({ message: req.t('auth.invalidRole') });
  }
  if (dob && !DATE_PATTERN.test(dob)) {
    return res.status(400).json({ message: req.t('auth.dobFormat') });
  }

  // ห้ามซ้ำ: อีเมล / เลขบัตรประชาชน / เลขใบอนุญาตทนาย — แยกข้อความให้ผู้ใช้รู้ว่าซ้ำช่องไหน
  // (ฐานข้อมูลตั้ง @unique ไว้ทั้งสามช่อง กันซ้ำอีกชั้นแม้มีคนสมัครพร้อมกัน)
  if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
    return res.status(409).json({ message: req.t('auth.emailDuplicate') });
  }
  if (await prisma.user.findUnique({ where: { idCard } })) {
    return res.status(409).json({ message: req.t('auth.idCardDuplicate') });
  }
  if (licenseId && (await prisma.user.findUnique({ where: { licenseId } }))) {
    return res.status(409).json({ message: req.t('auth.licenseDuplicate') });
  }

  let user;
  try {
    user = await prisma.user.create({
      data: {
        idCard,
        licenseId: licenseId || null,
        firstName,
        lastName,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        phone: phone || null,
        dateOfBirth: dob ? new Date(dob) : null,
        role: normalizedRole,
      },
    });
  } catch (err) {
    // P2002 = ชน @unique — มีคนสมัครด้วยข้อมูลเดียวกันพร้อมกันพอดี (ผ่านการเช็กด้านบนมาทั้งคู่)
    if (err.code !== 'P2002') throw err;
    const field = String(err.meta?.target ?? '');
    const key = field.includes('licenseId') ? 'auth.licenseDuplicate' : field.includes('idCard') ? 'auth.idCardDuplicate' : 'auth.emailDuplicate';
    return res.status(409).json({ message: req.t(key) });
  }

  res.status(201).json({ message: req.t('auth.registered'), user: publicUser(user) });
};

// POST /api/auth/login — Use Case: Login (include: verify password)
exports.login = async (req, res) => {
  const { email, password } = req.body ?? {};
  const normalizedEmail = String(email ?? '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: req.t('auth.loginRequired') });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const passwordOk = user && (await bcrypt.compare(password, user.password));
  if (!passwordOk) {
    // ไม่บอกว่าผิดที่ email หรือ password เพื่อความปลอดภัย
    return res.status(401).json({ message: req.t('auth.badCredentials') });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
};

// GET /api/auth/me
exports.me = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return res.status(404).json({ message: req.t('auth.userNotFound') });
  res.json({ user: publicUser(user) });
};
