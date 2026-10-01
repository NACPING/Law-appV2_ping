const prisma = require('../config/db');
const { emitToUser } = require('../realtime');

const actorSelect = { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } };

const toDto = (n) => ({
  id: n.id,
  type: n.type,
  // แอปสร้างหัวข้อ/เนื้อหาจาก type + params ตามภาษาของผู้ใช้ · title/body = ข้อความภาษาไทยของรายการเก่า (ก่อนมี params)
  params: n.params ? JSON.parse(n.params) : null,
  title: n.title,
  body: n.body,
  targetType: n.targetType,
  targetId: n.targetId,
  count: n.count,
  actor: n.actor,
  read: !!n.readAt,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
});

const unreadCount = (userId) => prisma.notification.count({ where: { userId, readAt: null } });

async function pushCount(userId) {
  emitToUser(userId, 'notification:count', { unreadCount: await unreadCount(userId) });
}

/**
 * สร้างการแจ้งเตือน แล้วส่งให้ผู้รับแบบ real-time
 * params = ข้อมูลประกอบ (ชื่อ, หัวข้อเรื่อง, ข้อความตัวอย่าง) — ไม่เก็บประโยคสำเร็จรูป เพราะผู้รับอาจใช้ภาษาอื่น
 * aggregate: รวมกับรายการเรื่องเดียวกัน (type + targetId) ที่ยังไม่อ่าน แล้วเพิ่ม count
 * ไม่ส่งถ้าผู้รับคือคนที่ทำเอง และไม่ทำให้คำขอหลักล้มเหลวถ้าส่งแจ้งเตือนไม่สำเร็จ
 */
// ประเภทการแจ้งเตือน → สวิตช์ใน Settings > Notifications (ที่ไม่อยู่ในนี้ = ความคืบหน้าคำขอ/เคส)
const PREF_BY_TYPE = {
  COMMENT: 'notifyPosts',
  REPLY: 'notifyPosts',
  CHAT_MESSAGE: 'notifyChat',
  NEW_FOLLOWER: 'notifyFollows',
  FOLLOWED_POST: 'notifyFollows',
};

async function notify({ userId, actorId = null, type, params = {}, targetType, targetId, aggregate = false }) {
  if (!userId || userId === actorId) return;
  try {
    // ผู้รับปิดการแจ้งเตือนประเภทนี้ไว้ → ไม่สร้างเลย (ตัวเลขบนกระดิ่งก็ไม่เพิ่ม)
    const prefs = await prisma.user.findUnique({
      where: { id: userId },
      select: { notifyPosts: true, notifyChat: true, notifyCases: true, notifyFollows: true },
    });
    if (!prefs || prefs[PREF_BY_TYPE[type] ?? 'notifyCases'] === false) return;

    const paramsJson = JSON.stringify(params);
    let notification = null;

    if (aggregate) {
      const existing = await prisma.notification.findFirst({ where: { userId, type, targetId, readAt: null } });
      if (existing) {
        const count = existing.count + 1;
        notification = await prisma.notification.update({
          where: { id: existing.id },
          data: { count, params: paramsJson, actorId },
          include: { actor: actorSelect },
        });
      }
    }
    if (!notification) {
      notification = await prisma.notification.create({
        // title/body ต้องมีค่า (คอลัมน์เดิม) — เก็บรหัสไว้เฉยๆ แอปไม่ได้ใช้เมื่อมี params
        data: { userId, actorId, type, title: type, body: '', params: paramsJson, targetType, targetId },
        include: { actor: actorSelect },
      });
    }

    emitToUser(userId, 'notification:new', { notification: toDto(notification), unreadCount: await unreadCount(userId) });
  } catch (err) {
    console.error('notify failed:', err);
  }
}

// ทำเครื่องหมายว่าอ่านแล้ว (เช่น เมื่อเปิดดูเรื่องนั้น) แล้วอัปเดตตัวเลขบนกระดิ่ง
// (มักเรียกหลังส่ง response แล้ว จึงไม่ throw ออกไป)
async function markRead(userId, where) {
  try {
    const { count } = await prisma.notification.updateMany({ where: { userId, readAt: null, ...where }, data: { readAt: new Date() } });
    if (count > 0) await pushCount(userId);
    return count;
  } catch (err) {
    console.error('markRead failed:', err);
    return 0;
  }
}

// ลบการแจ้งเตือนของเรื่องที่ถูกลบไปแล้ว (เช่น โพสต์ถูกลบ) แล้วอัปเดตตัวเลขของผู้ที่ได้รับ
async function removeForTarget(targetType, targetId) {
  const affected = await prisma.notification.findMany({ where: { targetType, targetId }, select: { userId: true }, distinct: ['userId'] });
  await prisma.notification.deleteMany({ where: { targetType, targetId } });
  await Promise.all(affected.map((a) => pushCount(a.userId)));
}

// ข้อความตัวอย่างสั้น ๆ
const preview = (text, max = 60) => {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

// ผู้ที่ถูกอ้างถึงในการแจ้งเตือนมีตัวตนเสมอ (คนคอมเมนต์/ผู้ส่ง/คู่กรณีในเคส)
const nameOf = (u) => (u ? `${u.firstName} ${u.lastName}` : '');

module.exports = { notify, markRead, removeForTarget, unreadCount, toDto, actorSelect, preview, nameOf };
