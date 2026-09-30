const prisma = require('../config/db');
const { markRead, unreadCount, toDto, actorSelect } = require('../services/notify');

const PAGE_SIZE = 50;

// GET /api/notifications — รายการล่าสุด (เรียงตามเวลาอัปเดตล่าสุด)
exports.list = async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.userId },
    orderBy: { updatedAt: 'desc' },
    take: PAGE_SIZE,
    include: { actor: actorSelect },
  });
  res.json({ notifications: notifications.map(toDto), unreadCount: await unreadCount(req.user.userId) });
};

// GET /api/notifications/unread-count — ตัวเลขบนกระดิ่ง
exports.count = async (req, res) => {
  res.json({ unreadCount: await unreadCount(req.user.userId) });
};

// PATCH /api/notifications/:id/read
exports.read = async (req, res) => {
  await markRead(req.user.userId, { id: req.params.id });
  res.json({ unreadCount: await unreadCount(req.user.userId) });
};

// PATCH /api/notifications/read-all
exports.readAll = async (req, res) => {
  await markRead(req.user.userId, {});
  res.json({ unreadCount: 0 });
};
