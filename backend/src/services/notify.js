const prisma = require('../config/db');
const { emitToUser } = require('../realtime');

const actorSelect = { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } };

const toDto = (n) => ({
  id: n.id,
  type: n.type,
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
 * aggregate: รวมกับรายการเรื่องเดียวกัน (type + targetId) ที่ยังไม่อ่าน — title(count) ใช้สร้างหัวข้อตามจำนวน
 * ไม่ส่งถ้าผู้รับคือคนที่ทำเอง และไม่ทำให้คำขอหลักล้มเหลวถ้าส่งแจ้งเตือนไม่สำเร็จ
 */
async function notify({ userId, actorId = null, type, title, body, targetType, targetId, aggregate = false }) {
  if (!userId || userId === actorId) return;
  try {
    const makeTitle = (count) => (typeof title === 'function' ? title(count) : title);
    let notification = null;

    if (aggregate) {
      const existing = await prisma.notification.findFirst({ where: { userId, type, targetId, readAt: null } });
      if (existing) {
        const count = existing.count + 1;
        notification = await prisma.notification.update({
          where: { id: existing.id },
          data: { count, title: makeTitle(count), body, actorId },
          include: { actor: actorSelect },
        });
      }
    }
    if (!notification) {
      notification = await prisma.notification.create({
        data: { userId, actorId, type, title: makeTitle(1), body, targetType, targetId },
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

const nameOf = (u) => (u ? `${u.firstName} ${u.lastName}` : 'ไม่ระบุตัวตน');

module.exports = { notify, markRead, removeForTarget, unreadCount, toDto, actorSelect, preview, nameOf };
