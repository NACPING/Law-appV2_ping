const prisma = require('../config/db');
const { notify, nameOf } = require('../services/notify');

// ระบบผู้ติดตาม — ติดตามแบบทางเดียว ลูกความ/ทนายติดตามกันได้ทุกคน · admin ไม่ติดตามและไม่ถูกติดตาม
const FOLLOWABLE_ROLES = ['CLIENT', 'LAWYER'];
const personSelect = { id: true, firstName: true, lastName: true, role: true, avatarUrl: true };

// หาเป้าหมายและตรวจสิทธิ์ — คืน null ถ้าส่ง error ไปแล้ว
async function findTarget(req, res) {
  if (req.params.id === req.user.userId) {
    res.status(400).json({ message: req.t('follow.self') });
    return null;
  }
  const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, role: true } });
  if (!target) {
    res.status(404).json({ message: req.t('auth.userNotFound') });
    return null;
  }
  if (!FOLLOWABLE_ROLES.includes(req.user.role) || !FOLLOWABLE_ROLES.includes(target.role)) {
    res.status(403).json({ message: req.t('follow.notAllowed') });
    return null;
  }
  return target;
}

const followerCount = (userId) => prisma.follow.count({ where: { followingId: userId } });

// PUT /api/users/:id/follow — กดซ้ำได้ (ติดตามอยู่แล้วก็ตอบสำเร็จ ไม่แจ้งเตือนซ้ำ)
exports.follow = async (req, res) => {
  const target = await findTarget(req, res);
  if (!target) return;

  const key = { followerId: req.user.userId, followingId: target.id };
  const existing = await prisma.follow.findUnique({ where: { followerId_followingId: key } });
  if (!existing) await prisma.follow.create({ data: key });
  res.json({ isFollowing: true, followerCount: await followerCount(target.id) });

  if (existing) return;
  // แจ้งเจ้าของโปรไฟล์ — รวมเป็นรายการเดียว "มีผู้ติดตามใหม่ (3)" แตะแล้วไปหน้ารายชื่อผู้ติดตามของตัวเอง
  const me = await prisma.user.findUnique({ where: { id: req.user.userId }, select: personSelect });
  await notify({
    userId: target.id,
    actorId: req.user.userId,
    type: 'NEW_FOLLOWER',
    params: { name: nameOf(me) },
    targetType: 'followers',
    targetId: target.id,
    aggregate: true,
  });
};

// DELETE /api/users/:id/follow
exports.unfollow = async (req, res) => {
  const target = await findTarget(req, res);
  if (!target) return;
  await prisma.follow.deleteMany({ where: { followerId: req.user.userId, followingId: target.id } });
  res.json({ isFollowing: false, followerCount: await followerCount(target.id) });
};

// GET /api/users/:id/followers และ /following — รายชื่อ (ทุกคนดูได้) พร้อมบอกว่าเราติดตามแต่ละคนอยู่ไหม
async function listPeople(req, res, direction) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!user) return res.status(404).json({ message: req.t('auth.userNotFound') });

  const rows = await prisma.follow.findMany({
    where: direction === 'followers' ? { followingId: user.id } : { followerId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: direction === 'followers' ? { follower: { select: personSelect } } : { following: { select: personSelect } },
  });
  const people = rows.map((r) => (direction === 'followers' ? r.follower : r.following));

  const mine = await prisma.follow.findMany({
    where: { followerId: req.user.userId, followingId: { in: people.map((p) => p.id) } },
    select: { followingId: true },
  });
  const followed = new Set(mine.map((m) => m.followingId));
  res.json({
    users: people.map((p) => ({ ...p, isFollowing: followed.has(p.id), isSelf: p.id === req.user.userId })),
  });
}

exports.followers = (req, res) => listPeople(req, res, 'followers');
exports.following = (req, res) => listPeople(req, res, 'following');

// ใช้ตอนสร้างโพสต์ (ไม่ระบุตัวตน = ไม่แจ้ง เพราะจะเผยว่าใครเขียน)
exports.notifyFollowersOfPost = async (post, author) => {
  if (post.isAnonymous) return;
  const followers = await prisma.follow.findMany({ where: { followingId: author.id }, select: { followerId: true } });
  for (const f of followers) {
    await notify({
      userId: f.followerId,
      actorId: author.id,
      type: 'FOLLOWED_POST',
      params: { name: nameOf(author), postTitle: post.title.length > 40 ? `${post.title.slice(0, 40)}…` : post.title },
      targetType: 'post',
      targetId: post.id,
    });
  }
};

exports.FOLLOWABLE_ROLES = FOLLOWABLE_ROLES;
