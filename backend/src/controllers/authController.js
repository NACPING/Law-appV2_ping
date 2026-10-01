const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SELF_REGISTER_ROLES = ['CLIENT', 'LAWYER']; // ADMIN สมัครเองไม่ได้

// ข้อมูลของผู้ใช้ที่ล็อกอิน (ส่งให้เจ้าของบัญชีเท่านั้น)
const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  phone: user.phone,
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
  const { idCardOrPass, firstName, lastName, email, password, phone, dob, role } = req.body ?? {};
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const normalizedRole = String(role ?? 'CLIENT').toUpperCase();

  if (!idCardOrPass || !firstName || !lastName || !normalizedEmail || !password) {
    return res.status(400).json({ message: req.t('auth.required') });
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

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { idCard: idCardOrPass }] },
  });
  if (existing) {
    return res.status(409).json({ message: req.t('auth.duplicate') });
  }

  const user = await prisma.user.create({
    data: {
      idCard: idCardOrPass,
      firstName,
      lastName,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      phone: phone || null,
      dateOfBirth: dob ? new Date(dob) : null,
      role: normalizedRole,
    },
  });

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
