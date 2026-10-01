const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { jwtSecret } = require('../config/env');
const { CHAT_DIR, removeChatFile } = require('../middlewares/chatUpload');
const { emitToChat, findChatForUser, isUserInChat } = require('../realtime');
const { notify, markRead, preview, nameOf } = require('../services/notify');

const MAX_TEXT = 2000;
const PAGE_SIZE = 40;
const FILE_TOKEN_TTL = '6h';
// secret แยกจาก token ล็อกอิน — ลิงก์ไฟล์เอาไปใช้เป็น token ล็อกอินไม่ได้
const FILE_SECRET = `${jwtSecret}:chat-file`;

// แอปมือถือ (expo/fetch) ส่งชื่อไฟล์แบบ percent-encoded เช่น "%E0%B8%AA...pdf" — แปลงกลับให้อ่านได้
// (เบราว์เซอร์ส่งเป็น UTF-8 ปกติ ถ้าแปลงไม่ได้ใช้ชื่อเดิม)
function readableFileName(name) {
  if (!/%[0-9A-Fa-f]{2}/.test(name)) return name;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

const senderSelect = { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } };

// ลิงก์ไฟล์แบบมีอายุ: <Image> และตัวอ่าน PDF ส่ง header Authorization ไม่ได้ จึงใส่ token ใน URL แทน
function fileUrl(req, message) {
  const token = jwt.sign({ mid: message.id }, FILE_SECRET, { expiresIn: FILE_TOKEN_TTL });
  return `${req.protocol}://${req.get('host')}/api/chats/files/${message.id}?token=${token}`;
}

function toDto(req, m) {
  return {
    id: m.id,
    requestId: m.requestId,
    text: m.text,
    system: m.system,
    systemCode: m.systemCode, // ข้อความระบบใหม่เก็บเป็นรหัส (แอปแปลเอง) — ข้อมูลเก่ามีแค่ text
    sender: m.sender,
    file: m.filePath
      ? { kind: m.fileKind, name: m.fileName, mime: m.fileMime, size: m.fileSize, url: fileUrl(req, m) }
      : null,
    createdAt: m.createdAt,
  };
}

// บันทึกข้อความระบบ (เช่น ขั้นตอนปิดเคส) แล้วส่งให้ทั้งสองฝ่ายแบบ real-time
// systemCode เช่น CLOSE_REQUESTED — แต่ละฝ่ายเห็นเป็นภาษาของตัวเอง
exports.postSystemMessage = async (req, requestId, actorId, systemCode) => {
  const message = await prisma.message.create({
    data: { requestId, senderId: actorId, systemCode, system: true },
    include: { sender: senderSelect },
  });
  emitToChat(requestId, 'message:new', toDto(req, message));
};

// ตรวจสิทธิ์เข้าห้องแชท แล้วแนบ req.chat — ใส่ก่อน multer เพื่อไม่ให้มีไฟล์ค้างเมื่อไม่มีสิทธิ์
exports.loadChat = async (req, res, next) => {
  const chat = await findChatForUser(req.params.requestId, req.user.userId);
  if (!chat) return res.status(404).json({ message: req.t('chat.notFound') });
  req.chat = chat;
  next();
};

exports.requireOpenChat = (req, res, next) => {
  if (req.chat.status === 'CLOSED') {
    return res.status(409).json({ message: req.t('chat.caseClosed') });
  }
  next();
};

// GET /api/chats/:requestId/messages?before=<ISO date> — ข้อความล่าสุดทีละหน้า (ใหม่ → เก่า)
exports.messages = async (req, res) => {
  const where = { requestId: req.chat.id };
  if (req.query.before) {
    const before = new Date(String(req.query.before));
    if (!Number.isNaN(before.getTime())) where.createdAt = { lt: before };
  }
  const rows = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    include: { sender: senderSelect },
  });
  const hasMore = rows.length > PAGE_SIZE;
  const chat = await prisma.lawyerRequest.findUnique({
    where: { id: req.chat.id },
    include: { client: senderSelect, lawyer: senderSelect },
  });

  res.json({
    chat: {
      id: chat.id,
      subject: chat.subject,
      status: chat.status,
      closedAt: chat.closedAt,
      closeRequestedAt: chat.closeRequestedAt,
      closeRequestedBy: chat.closeRequestedAt ? chat.closeRequestedBy ?? 'LAWYER' : null,
      client: chat.client,
      lawyer: chat.lawyer,
    },
    messages: rows.slice(0, PAGE_SIZE).map((m) => toDto(req, m)),
    hasMore,
  });
  // เปิดห้องแชทแล้ว = อ่านแจ้งเตือนของห้องนี้แล้ว (ข้อความใหม่, ขอปิดเคส ฯลฯ) — เฉพาะตอนโหลดหน้าล่าสุด
  if (!req.query.before) await markRead(req.user.userId, { targetType: 'chat', targetId: req.chat.id });
};

// POST /api/chats/:requestId/messages (multipart: text?, file?) — ต้องมีข้อความหรือไฟล์อย่างน้อยหนึ่งอย่าง
exports.send = async (req, res) => {
  const text = String(req.body?.text ?? '').trim();
  const file = req.file;

  if (!text && !file) return res.status(400).json({ message: req.t('chat.textOrFile') });
  if (text.length > MAX_TEXT) {
    removeChatFile(file?.filename);
    return res.status(400).json({ message: req.t('chat.textTooLong', { max: MAX_TEXT }) });
  }

  try {
    const message = await prisma.message.create({
      data: {
        requestId: req.chat.id,
        senderId: req.user.userId,
        text: text || null,
        ...(file && {
          fileKind: file.kind,
          fileName: readableFileName(file.originalname).slice(0, 200),
          fileMime: file.mimetype,
          fileSize: file.size,
          filePath: file.filename,
        }),
      },
      include: { sender: senderSelect },
    });
    const dto = toDto(req, message);
    emitToChat(req.chat.id, 'message:new', dto);
    res.status(201).json({ message: dto });

    // แจ้งอีกฝ่าย (รวมเป็นรายการเดียวต่อห้อง เช่น "ได้รับข้อความใหม่ (3)") — ถ้าเปิดห้องนี้อยู่ไม่ต้องแจ้ง
    const recipientId = req.chat.clientId === req.user.userId ? req.chat.lawyerId : req.chat.clientId;
    if (!(await isUserInChat(req.chat.id, recipientId))) {
      await notify({
        userId: recipientId,
        actorId: req.user.userId,
        type: 'CHAT_MESSAGE',
        // ไฟล์แนบ: ส่งชนิดไฟล์ไป แอปแสดงเป็น [รูปภาพ]/[ไฟล์ PDF] ตามภาษา
        params: text ? { name: nameOf(message.sender), preview: preview(text) } : { name: nameOf(message.sender), fileKind: file.kind },
        targetType: 'chat',
        targetId: req.chat.id,
        aggregate: true,
      });
    }
  } catch (err) {
    removeChatFile(file?.filename);
    throw err;
  }
};

// GET /api/chats/files/:messageId?token=... — เปิดไฟล์แนบ (ตรวจ token ที่ผูกกับข้อความนี้)
exports.file = async (req, res) => {
  try {
    const payload = jwt.verify(String(req.query.token ?? ''), FILE_SECRET);
    if (payload.mid !== req.params.messageId) throw new Error('mismatch');
  } catch {
    return res.status(403).json({ message: req.t('chat.fileLinkExpired') });
  }

  const message = await prisma.message.findUnique({ where: { id: req.params.messageId } });
  const storedName = message?.filePath && path.basename(message.filePath);
  if (!storedName || !fs.existsSync(path.join(CHAT_DIR, storedName))) {
    return res.status(404).json({ message: req.t('chat.fileNotFound') });
  }

  res.set({
    'Content-Type': message.fileMime,
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(message.fileName ?? 'file')}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, max-age=3600',
  });
  // ใช้ root: ถ้าส่ง path เต็ม ไลบรารีจะปฏิเสธเพราะโฟลเดอร์โปรเจกต์อยู่ใต้ ".vscode" (ขึ้นต้นด้วยจุด)
  res.sendFile(storedName, { root: CHAT_DIR });
};
