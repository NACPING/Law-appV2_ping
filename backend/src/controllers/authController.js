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
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
  }
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({ message: 'รูปแบบ Email ไม่ถูกต้อง' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  }
  if (!SELF_REGISTER_ROLES.includes(normalizedRole)) {
    return res.status(400).json({ message: 'บทบาทไม่ถูกต้อง' });
  }
  if (dob && !DATE_PATTERN.test(dob)) {
    return res.status(400).json({ message: 'วันเกิดต้องอยู่ในรูปแบบ YYYY-MM-DD' });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { idCard: idCardOrPass }] },
  });
  if (existing) {
    return res.status(409).json({ message: 'Email หรือ ID/Passport นี้ถูกใช้งานแล้ว' });
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

  res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', user: publicUser(user) });
};

// POST /api/auth/login — Use Case: Login (include: verify password)
exports.login = async (req, res) => {
  const { email, password } = req.body ?? {};
  const normalizedEmail = String(email ?? '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'กรุณากรอก Email และ Password ให้ครบถ้วน' });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const passwordOk = user && (await bcrypt.compare(password, user.password));
  if (!passwordOk) {
    // ไม่บอกว่าผิดที่ email หรือ password เพื่อความปลอดภัย
    return res.status(401).json({ message: 'Email หรือรหัสผ่านไม่ถูกต้อง' });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
};

// GET /api/auth/me
exports.me = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
  res.json({ user: publicUser(user) });
};
