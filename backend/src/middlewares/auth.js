const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

// ตรวจ token ของการล็อกอิน คืน { userId, role } หรือ null
// (ใช้ร่วมกันระหว่าง REST และ socket.io)
function verifyUserToken(token) {
  try {
    const payload = jwt.verify(token, jwtSecret);
    // ต้องเป็น token ล็อกอินจริงเท่านั้น (มี userId และ role) — กัน token ประเภทอื่นมาใช้แทน
    if (typeof payload.userId !== 'string' || typeof payload.role !== 'string') return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

// ตรวจ Bearer token แล้วแนบ req.user = { userId, role }
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
  }

  const user = verifyUserToken(token);
  if (!user) return res.status(401).json({ message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
  req.user = user;
  next();
}

// ใช้หลัง requireAuth เช่น requireRole('ADMIN')
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
  }
  next();
};

module.exports = { requireAuth, requireRole, verifyUserToken };
