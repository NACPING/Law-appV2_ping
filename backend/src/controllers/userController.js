const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { removeUploadedFiles } = require('../middlewares/upload');
const { publicUser } = require('./authController');
const { authorSelect, toPostDto } = require('./postController');

const MAX_NAME = 50;
const MAX_BIO = 150;
const MAX_ABOUT = 1000;
const PHONE_PATTERN = /^[0-9+\-\s]{0,20}$/;
const RECENT_LIMIT = 30;

// GET /api/users/:id — หน้า Profile (ของตัวเอง หรือของคนอื่นที่แตะชื่อใน Community)
// ความเป็นส่วนตัว: เบอร์โทร/อีเมลเห็นเฉพาะเจ้าของ ยกเว้นทนายที่เปิด showContact
// โพสต์ไม่ระบุตัวตนไม่แสดงให้คนอื่นเห็นเลย (ไม่งั้นจะรู้ว่าใครเขียน)
exports.profile = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });

  const isSelf = user.id === req.user.userId;
  const isLawyer = user.role === 'LAWYER';
  const showContact = isSelf || (isLawyer && user.showContact);
  const postWhere = { authorId: user.id, ...(isSelf ? {} : { isAnonymous: false }) };

  const [postCount, posts, commentCount, caseCount, comments] = await Promise.all([
    prisma.post.count({ where: postWhere }),
    prisma.post.findMany({
      where: postWhere,
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
      include: { author: authorSelect, images: { orderBy: { order: 'asc' } }, _count: { select: { comments: true } } },
    }),
    // ทนายโพสต์ไม่ได้ จึงแสดงความคิดเห็นล่าสุดและจำนวนเคสที่ดูแลแทน
    isLawyer ? prisma.comment.count({ where: { authorId: user.id } }) : 0,
    isLawyer ? prisma.lawyerRequest.count({ where: { lawyerId: user.id, status: { in: ['APPROVED', 'CLOSED'] } } }) : 0,
    isLawyer
      ? prisma.comment.findMany({
          where: { authorId: user.id },
          orderBy: { createdAt: 'desc' },
          take: RECENT_LIMIT,
          select: { id: true, content: true, createdAt: true, post: { select: { id: true, title: true } } },
        })
      : [],
  ]);

  res.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      about: isLawyer ? user.about : null,
      phone: showContact ? user.phone : null,
      email: showContact ? user.email : null,
      showContact: isSelf ? user.showContact : undefined,
      isSelf,
      createdAt: user.createdAt,
    },
    stats: { postCount, commentCount, caseCount },
    posts: posts.map((p) => toPostDto(req, p)),
    comments,
  });
};

// PATCH /api/users/me — แก้ไขโปรไฟล์ (อีเมล, เลขบัตร, บทบาท แก้ไม่ได้)
exports.updateMe = async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!me) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });

  const body = req.body ?? {};
  const data = {};
  const text = (v) => String(v ?? '').trim();

  if (body.firstName !== undefined) data.firstName = text(body.firstName);
  if (body.lastName !== undefined) data.lastName = text(body.lastName);
  if (body.phone !== undefined) data.phone = text(body.phone) || null;
  if (body.bio !== undefined) data.bio = text(body.bio) || null;
  // รายละเอียดทนายและการแสดงช่องทางติดต่อ มีเฉพาะบัญชีทนาย
  if (me.role === 'LAWYER') {
    if (body.about !== undefined) data.about = text(body.about) || null;
    if (body.showContact !== undefined) data.showContact = body.showContact === true;
  }

  if (data.firstName === '' || data.lastName === '') {
    return res.status(400).json({ message: 'กรุณากรอกชื่อและนามสกุล' });
  }
  if ((data.firstName ?? '').length > MAX_NAME || (data.lastName ?? '').length > MAX_NAME) {
    return res.status(400).json({ message: `ชื่อและนามสกุลไม่เกิน ${MAX_NAME} ตัวอักษร` });
  }
  if (data.phone && !PHONE_PATTERN.test(data.phone)) {
    return res.status(400).json({ message: 'เบอร์โทรใช้ได้เฉพาะตัวเลข + - และเว้นวรรค (ไม่เกิน 20 ตัว)' });
  }
  if ((data.bio ?? '').length > MAX_BIO) {
    return res.status(400).json({ message: `คำแนะนำตัวไม่เกิน ${MAX_BIO} ตัวอักษร` });
  }
  if ((data.about ?? '').length > MAX_ABOUT) {
    return res.status(400).json({ message: `รายละเอียดทนายไม่เกิน ${MAX_ABOUT} ตัวอักษร` });
  }

  const user = await prisma.user.update({ where: { id: me.id }, data });
  res.json({ user: publicUser(user) });
};

// PUT /api/users/me/avatar (multipart, ฟิลด์ "avatar") — เปลี่ยนรูปโปรไฟล์ แล้วลบไฟล์รูปเก่า
exports.updateAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกรูปภาพ' });
  const url = `/uploads/${req.file.filename}`;

  const me = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { avatarUrl: true } });
  if (!me) {
    removeUploadedFiles([url]);
    return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
  }
  const user = await prisma.user.update({ where: { id: req.user.userId }, data: { avatarUrl: url } });
  if (me.avatarUrl) removeUploadedFiles([me.avatarUrl]);
  res.json({ user: publicUser(user) });
};

// DELETE /api/users/me/avatar — กลับไปใช้รูปตัวอักษรแรกของชื่อ
exports.removeAvatar = async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { avatarUrl: true } });
  if (!me) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
  const user = await prisma.user.update({ where: { id: req.user.userId }, data: { avatarUrl: null } });
  if (me.avatarUrl) removeUploadedFiles([me.avatarUrl]);
  res.json({ user: publicUser(user) });
};

// PUT /api/users/me/password — ต้องยืนยันรหัสผ่านเดิมก่อน
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  const me = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!me || !(await bcrypt.compare(String(currentPassword), me.password))) {
    return res.status(400).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
  }

  await prisma.user.update({ where: { id: me.id }, data: { password: await bcrypt.hash(String(newPassword), 10) } });
  res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
};
