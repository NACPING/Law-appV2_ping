const prisma = require('../config/db');
const { emitToChat } = require('../realtime');
const { postSystemMessage } = require('./chatController');
const { notify, markRead, removeForTarget, preview, nameOf } = require('../services/notify');

const MAX_SUBJECT = 150;
const MAX_EVENTS = 3000;
const MAX_MESSAGE = 2000;
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CLOSED'];

const personSelect = { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } };
const include = { client: personSelect, lawyer: personSelect };

// เลขอ้างอิงที่อ่านง่าย เช่น REQ-3F2A9C1B
const refOf = (id) => `REQ-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

// ข้อความล่าสุดในแชท (สำหรับรายการแชท) — แสดงเฉพาะคนในเคส admin ไม่เห็นเนื้อหาแชท
const lastMessagePreview = (m) =>
  m && {
    text: m.text ?? (m.fileKind === 'pdf' ? '[ไฟล์ PDF]' : '[รูปภาพ]'),
    senderId: m.senderId,
    createdAt: m.createdAt,
  };

const toDto = (r) => ({
  id: r.id,
  lastMessage: lastMessagePreview(r.messages?.[0]) ?? null,
  closedAt: r.closedAt,
  closeRequestedAt: r.closeRequestedAt,
  ref: refOf(r.id),
  subject: r.subject,
  events: r.events,
  message: r.message,
  status: r.status,
  rejectReason: r.rejectReason,
  client: r.client,
  lawyer: r.lawyer,
  reviewedAt: r.reviewedAt,
  createdAt: r.createdAt,
});

// ใครเห็นคำขอไหนได้: ลูกความ = ของตัวเอง, ทนาย = ที่ได้รับมอบหมาย, admin = ทั้งหมด
function visibilityFilter(user) {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'LAWYER') return { lawyerId: user.userId };
  return { clientId: user.userId };
}

async function findVisible(req) {
  return prisma.lawyerRequest.findFirst({
    where: { id: req.params.id, ...visibilityFilter(req.user) },
    include,
  });
}

// POST /api/lawyer-requests — ลูกความส่งคำขอปรึกษา (หน้า Consult with Us)
exports.create = async (req, res) => {
  const subject = String(req.body?.subject ?? '').trim();
  const events = String(req.body?.events ?? '').trim();
  const message = String(req.body?.message ?? '').trim();

  if (!subject || !events) {
    return res.status(400).json({ message: 'กรุณากรอกหัวข้อและลำดับเหตุการณ์' });
  }
  if (subject.length > MAX_SUBJECT || events.length > MAX_EVENTS || message.length > MAX_MESSAGE) {
    return res.status(400).json({
      message: `หัวข้อไม่เกิน ${MAX_SUBJECT} ตัว, ลำดับเหตุการณ์ไม่เกิน ${MAX_EVENTS} ตัว, ข้อความไม่เกิน ${MAX_MESSAGE} ตัว`,
    });
  }

  const request = await prisma.lawyerRequest.create({
    data: { subject, events, message: message || null, clientId: req.user.userId },
    include,
  });
  res.status(201).json({ request: toDto(request) });

  // แจ้ง admin ทุกคนว่ามีคำขอใหม่รอพิจารณา
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  for (const admin of admins) {
    await notify({
      userId: admin.id,
      actorId: req.user.userId,
      type: 'NEW_REQUEST',
      title: 'มีคำขอปรึกษาใหม่รอพิจารณา',
      body: `${nameOf(request.client)}: "${preview(subject)}"`,
      targetType: 'request',
      targetId: request.id,
    });
  }
};

// GET /api/lawyer-requests?status=PENDING — รายการตามสิทธิ์ของผู้ใช้
exports.list = async (req, res) => {
  const where = visibilityFilter(req.user);
  const status = String(req.query.status ?? '').toUpperCase();
  if (STATUSES.includes(status)) where.status = status;

  const withLastMessage =
    req.user.role === 'ADMIN'
      ? include
      : { ...include, messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { text: true, fileKind: true, senderId: true, createdAt: true } } };
  const requests = await prisma.lawyerRequest.findMany({ where, orderBy: { createdAt: 'desc' }, include: withLastMessage });
  res.json({ requests: requests.map(toDto) });
};

// GET /api/lawyer-requests/:id
exports.detail = async (req, res) => {
  const request = await findVisible(req);
  if (!request) return res.status(404).json({ message: 'ไม่พบคำขอ' });
  res.json({ request: toDto(request) });
  await markRead(req.user.userId, { targetType: 'request', targetId: request.id }); // เปิดดูแล้ว = อ่านแล้ว
};

// DELETE /api/lawyer-requests/:id — ลูกความยกเลิกคำขอของตัวเองได้ระหว่างรอตรวจสอบ
exports.cancel = async (req, res) => {
  const request = await findVisible(req);
  if (!request || request.clientId !== req.user.userId) return res.status(404).json({ message: 'ไม่พบคำขอ' });
  if (request.status !== 'PENDING') {
    return res.status(409).json({ message: 'ยกเลิกได้เฉพาะคำขอที่ยังรอตรวจสอบ' });
  }
  await prisma.lawyerRequest.delete({ where: { id: request.id } });
  await removeForTarget('request', request.id); // admin ไม่ต้องเห็นคำขอที่ถูกยกเลิกแล้ว
  res.status(204).end();
};

// GET /api/lawyer-requests/lawyers — admin ดูรายชื่อทนายเพื่อมอบหมาย (พร้อมจำนวนเคสที่ดูแลอยู่)
exports.lawyers = async (req, res) => {
  const lawyers = await prisma.user.findMany({
    where: { role: 'LAWYER' },
    orderBy: { firstName: 'asc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      _count: { select: { assignedRequests: { where: { status: 'APPROVED' } } } },
    },
  });
  res.json({
    lawyers: lawyers.map(({ _count, ...l }) => ({ ...l, activeCases: _count.assignedRequests })),
  });
};

// ตรวจก่อนอนุมัติ/ปฏิเสธ: ต้องเป็นคำขอที่ยังรอตรวจสอบ (กันกดซ้ำ/admin สองคนกดพร้อมกัน)
async function findPending(req, res) {
  const request = await prisma.lawyerRequest.findUnique({ where: { id: req.params.id } });
  if (!request) {
    res.status(404).json({ message: 'ไม่พบคำขอ' });
    return null;
  }
  if (request.status !== 'PENDING') {
    res.status(409).json({ message: 'คำขอนี้ได้รับการพิจารณาไปแล้ว' });
    return null;
  }
  return request;
}

// PATCH /api/lawyer-requests/:id/approve { lawyerId } — admin อนุมัติและมอบหมายทนาย
exports.approve = async (req, res) => {
  const request = await findPending(req, res);
  if (!request) return;

  const lawyer = await prisma.user.findUnique({ where: { id: String(req.body?.lawyerId ?? '') } });
  if (!lawyer || lawyer.role !== 'LAWYER') {
    return res.status(400).json({ message: 'กรุณาเลือกทนายที่จะมอบหมาย' });
  }

  const { count } = await prisma.lawyerRequest.updateMany({
    where: { id: request.id, status: 'PENDING' },
    data: { status: 'APPROVED', lawyerId: lawyer.id, reviewedById: req.user.userId, reviewedAt: new Date() },
  });
  if (count === 0) return res.status(409).json({ message: 'คำขอนี้ได้รับการพิจารณาไปแล้ว' });

  const updated = await prisma.lawyerRequest.findUnique({ where: { id: request.id }, include });
  res.json({ request: toDto(updated) });

  // แจ้งลูกความ (Figma: "ทนายรับเรื่องแล้ว") และทนายที่ได้รับมอบหมาย
  await notify({
    userId: updated.clientId,
    actorId: req.user.userId,
    type: 'REQUEST_APPROVED',
    title: 'ทนายรับเรื่องแล้ว',
    body: `${nameOf(updated.lawyer)} จะดูแลเรื่อง "${preview(updated.subject, 40)}" — แตะเพื่อเริ่มแชท`,
    targetType: 'chat',
    targetId: updated.id,
  });
  await notify({
    userId: updated.lawyerId,
    actorId: req.user.userId,
    type: 'CASE_ASSIGNED',
    title: 'ได้รับมอบหมายเคสใหม่',
    body: `${nameOf(updated.client)}: "${preview(updated.subject)}"`,
    targetType: 'request',
    targetId: updated.id,
  });
  await markRead(req.user.userId, { targetType: 'request', targetId: updated.id }); // admin พิจารณาแล้ว
};

// ---- ปิดเคส: ต้องยินยอมทั้งสองฝ่าย ----
// ทนายขอปิด → closeRequestedAt ถูกตั้งค่า (แชทยังคุยต่อได้) → ลูกความยินยอม = CLOSED / ไม่ยินยอม = ล้างค่า
// ทุกขั้นตอนบันทึกเป็นข้อความระบบในแชท และแจ้งทั้งสองฝ่ายแบบ real-time ด้วย event "chat:status"

// เปลี่ยนสถานะแบบมีเงื่อนไข (กันกดซ้ำ/สองฝ่ายกดพร้อมกัน) แล้วแจ้งทุกคนในห้อง
// notification(updated) = การแจ้งเตือนถึงอีกฝ่าย, staleFor(updated) = ผู้ใช้ที่แจ้งเตือน "ขอปิดเคส" เดิมหมดความหมายแล้ว
async function transitionCase(req, res, { where, data, notFound, conflict, systemText, notification, staleFor }) {
  const { count } = await prisma.lawyerRequest.updateMany({ where: { id: req.params.id, ...where }, data });
  if (count === 0) {
    const mine = await prisma.lawyerRequest.findFirst({ where: { id: req.params.id, ...visibilityFilter(req.user) } });
    return mine ? res.status(409).json({ message: conflict }) : res.status(404).json({ message: notFound });
  }
  const updated = await prisma.lawyerRequest.findUnique({ where: { id: req.params.id }, include });
  await postSystemMessage(req, updated.id, req.user.userId, systemText);
  emitToChat(updated.id, 'chat:status', {
    requestId: updated.id,
    status: updated.status,
    closeRequestedAt: updated.closeRequestedAt,
    closedAt: updated.closedAt,
  });
  res.json({ request: toDto(updated) });

  if (staleFor) await markRead(staleFor(updated), { type: 'CLOSE_REQUESTED', targetId: updated.id });
  await notify({
    actorId: req.user.userId,
    targetType: 'chat',
    targetId: updated.id,
    ...notification(updated),
  });
}

// PATCH /api/lawyer-requests/:id/close — ทนายส่งคำขอปิดเคสให้ลูกความยินยอม
exports.requestClose = (req, res) =>
  transitionCase(req, res, {
    where: { lawyerId: req.user.userId, status: 'APPROVED', closeRequestedAt: null },
    data: { closeRequestedAt: new Date() },
    notFound: 'ไม่พบคำขอ',
    conflict: 'ส่งคำขอปิดเคสไปแล้วหรือเคสนี้ปิดแล้ว',
    systemText: 'ทนายขอปิดเคส — รอลูกความยินยอม',
    notification: (r) => ({
      userId: r.clientId,
      type: 'CLOSE_REQUESTED',
      title: 'ทนายขอปิดเคส',
      body: `${nameOf(r.lawyer)} ขอปิดเคส "${preview(r.subject, 40)}" — แตะเพื่อยินยอมหรือไม่ยินยอม`,
    }),
  });

// PATCH /api/lawyer-requests/:id/close/cancel — ทนายยกเลิกคำขอปิดเคส
exports.cancelClose = (req, res) =>
  transitionCase(req, res, {
    where: { lawyerId: req.user.userId, status: 'APPROVED', closeRequestedAt: { not: null } },
    data: { closeRequestedAt: null },
    notFound: 'ไม่พบคำขอ',
    conflict: 'ไม่มีคำขอปิดเคสที่รอการตอบ',
    systemText: 'ทนายยกเลิกคำขอปิดเคส',
    staleFor: (r) => r.clientId,
    notification: (r) => ({
      userId: r.clientId,
      type: 'CLOSE_CANCELLED',
      title: 'ทนายยกเลิกคำขอปิดเคส',
      body: `เรื่อง "${preview(r.subject, 40)}" ยังดำเนินต่อตามปกติ`,
    }),
  });

// PATCH /api/lawyer-requests/:id/close/respond { accept } — ลูกความยินยอม/ไม่ยินยอมให้ปิดเคส
exports.respondClose = (req, res) => {
  const accept = req.body?.accept === true;
  return transitionCase(req, res, {
    where: { clientId: req.user.userId, status: 'APPROVED', closeRequestedAt: { not: null } },
    data: accept ? { status: 'CLOSED', closedAt: new Date(), closeRequestedAt: null } : { closeRequestedAt: null },
    notFound: 'ไม่พบคำขอ',
    conflict: 'ไม่มีคำขอปิดเคสที่รอการตอบ (ทนายอาจยกเลิกไปแล้ว)',
    systemText: accept ? 'ลูกความยินยอม — ปิดเคสแล้ว' : 'ลูกความไม่ยินยอมให้ปิดเคส — การปรึกษาดำเนินต่อ',
    staleFor: (r) => r.clientId,
    notification: (r) => ({
      userId: r.lawyerId,
      type: accept ? 'CLOSE_ACCEPTED' : 'CLOSE_DECLINED',
      title: accept ? 'ลูกความยินยอมปิดเคสแล้ว' : 'ลูกความไม่ยินยอมให้ปิดเคส',
      body: `${nameOf(r.client)} — เรื่อง "${preview(r.subject, 40)}"${accept ? ' ปิดเรียบร้อย' : ' ยังดำเนินต่อ'}`,
    }),
  });
};

// PATCH /api/lawyer-requests/:id/reject { reason } — admin ปฏิเสธพร้อมเหตุผล (ลูกความจะเห็นเหตุผล)
exports.reject = async (req, res) => {
  const reason = String(req.body?.reason ?? '').trim();
  if (!reason) return res.status(400).json({ message: 'กรุณาระบุเหตุผลที่ปฏิเสธ' });
  if (reason.length > 500) return res.status(400).json({ message: 'เหตุผลไม่เกิน 500 ตัวอักษร' });

  const request = await findPending(req, res);
  if (!request) return;

  const { count } = await prisma.lawyerRequest.updateMany({
    where: { id: request.id, status: 'PENDING' },
    data: { status: 'REJECTED', rejectReason: reason, reviewedById: req.user.userId, reviewedAt: new Date() },
  });
  if (count === 0) return res.status(409).json({ message: 'คำขอนี้ได้รับการพิจารณาไปแล้ว' });

  const updated = await prisma.lawyerRequest.findUnique({ where: { id: request.id }, include });
  res.json({ request: toDto(updated) });

  await notify({
    userId: updated.clientId,
    actorId: req.user.userId,
    type: 'REQUEST_REJECTED',
    title: 'คำขอปรึกษาไม่ได้รับการอนุมัติ',
    body: `"${preview(updated.subject, 40)}" — เหตุผล: ${preview(reason)}`,
    targetType: 'request',
    targetId: updated.id,
  });
  await markRead(req.user.userId, { targetType: 'request', targetId: updated.id });
};
