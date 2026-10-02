const prisma = require('../config/db');
const { removeUploadedFiles } = require('../middlewares/upload');
const { notify, markRead, removeForTarget, preview, nameOf } = require('../services/notify');
const { notifyFollowersOfPost } = require('./followController');

const MAX_TITLE = 150;
const MAX_CONTENT = 5000;
const MAX_COMMENT = 2000;

const authorSelect = { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } };

// รีแอคชัน: 1 คนเลือกได้ 1 แบบต่อโพสต์ · ลูกความ/ทนายกดได้, admin ไม่กด
const REACTION_TYPES = ['LIKE', 'LOVE', 'SAD', 'THANKS'];
const REACTING_ROLES = ['CLIENT', 'LAWYER'];

// include ที่ทุกหน้าใช้ดึงโพสต์ (feed, รายละเอียด, โปรไฟล์) — ต้องมี reactions เพื่อนับจำนวนแต่ละแบบ
const postInclude = {
  author: authorSelect,
  images: { orderBy: { order: 'asc' } },
  _count: { select: { comments: true } },
  reactions: { select: { type: true, userId: true } },
};

// จำนวนแต่ละแบบ + แบบที่ผู้ใช้คนนี้กดไว้
function reactionSummary(req, reactions = []) {
  const counts = Object.fromEntries(REACTION_TYPES.map((type) => [type, 0]));
  for (const r of reactions) counts[r.type] = (counts[r.type] ?? 0) + 1;
  return {
    reactions: counts,
    reactionCount: reactions.length,
    myReaction: reactions.find((r) => r.userId === req.user.userId)?.type ?? null,
  };
}

// รูปที่อัปโหลดเก็บเป็น path "/uploads/..." — แปลงเป็น URL เต็มตาม host ที่แอปเรียกเข้ามา
// (มือถือเรียกผ่าน IP ของคอม จึงใช้ localhost ตายตัวไม่ได้)
const absoluteUrl = (req, url) => (url.startsWith('/') ? `${req.protocol}://${req.get('host')}${url}` : url);

// โพสต์ไม่ระบุตัวตน: ไม่ส่งข้อมูลผู้เขียนออกไปเลย (แต่บอกเจ้าของว่าเป็นโพสต์ของตัวเอง)
function toPostDto(req, post) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    isAnonymous: post.isAnonymous,
    author: post.isAnonymous ? null : post.author,
    isMine: post.authorId === req.user.userId,
    images: post.images.map((img) => absoluteUrl(req, img.url)),
    commentCount: post._count?.comments ?? post.comments?.length ?? 0,
    ...reactionSummary(req, post.reactions),
    canReact: REACTING_ROLES.includes(req.user.role),
    createdAt: post.createdAt,
  };
}

const toCommentDto = (req, c) => ({
  id: c.id,
  content: c.content,
  parentId: c.parentId,
  author: c.author,
  isMine: c.authorId === req.user.userId,
  createdAt: c.createdAt,
});

// หน้า Profile ใช้รูปแบบโพสต์เดียวกัน
exports.authorSelect = authorSelect;
exports.postInclude = postInclude;
exports.toPostDto = toPostDto;

const canModify = (req, ownerId) => ownerId === req.user.userId || req.user.role === 'ADMIN';

// GET /api/posts — หน้า Communication · ?feed=following = แท็บ "ติดตาม"
// แท็บติดตาม: โพสต์ของคนที่เราติดตาม (ไม่รวมโพสต์ไม่ระบุตัวตน) + โพสต์ที่คนที่เราติดตามไปคอมเมนต์
exports.list = async (req, res) => {
  let where = {};
  if (req.query.feed === 'following') {
    const rows = await prisma.follow.findMany({ where: { followerId: req.user.userId }, select: { followingId: true } });
    const ids = rows.map((r) => r.followingId);
    where = { OR: [{ authorId: { in: ids }, isAnonymous: false }, { comments: { some: { authorId: { in: ids } } } }] };
  }
  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: postInclude,
  });
  res.json({ posts: posts.map((p) => toPostDto(req, p)) });
};

// GET /api/posts/:id — หน้า comment
exports.detail = async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      ...postInclude,
      comments: { orderBy: { createdAt: 'asc' }, include: { author: authorSelect } },
    },
  });
  if (!post) return res.status(404).json({ message: req.t('post.notFound') });

  res.json({
    post: toPostDto(req, post),
    comments: post.comments.map((c) => toCommentDto(req, c)),
  });
  // เปิดดูโพสต์แล้ว = อ่านแจ้งเตือนคอมเมนต์ของโพสต์นี้แล้ว
  await markRead(req.user.userId, { targetType: 'post', targetId: post.id });
};

// POST /api/posts (multipart/form-data) — extend: create post
// fields: title, content, isAnonymous ("true"/"false"), images[] (ไม่บังคับ)
exports.create = async (req, res) => {
  const files = req.files ?? [];
  const imageUrls = files.map((f) => `/uploads/${f.filename}`);
  const title = String(req.body?.title ?? '').trim();
  const content = String(req.body?.content ?? '').trim();
  const isAnonymous = req.body?.isAnonymous === true || req.body?.isAnonymous === 'true';

  let error = '';
  if (!title || !content) error = req.t('post.titleContent');
  else if (title.length > MAX_TITLE || content.length > MAX_CONTENT) {
    error = req.t('post.tooLong', { title: MAX_TITLE, content: MAX_CONTENT });
  }
  if (error) {
    removeUploadedFiles(imageUrls);
    return res.status(400).json({ message: error });
  }

  let post;
  try {
    post = await prisma.post.create({
      data: {
        title,
        content,
        isAnonymous,
        authorId: req.user.userId,
        images: { create: imageUrls.map((url, order) => ({ url, order })) },
      },
      include: postInclude,
    });
  } catch (err) {
    removeUploadedFiles(imageUrls);
    throw err;
  }
  res.status(201).json({ post: toPostDto(req, post) });
  // แจ้งผู้ติดตามหลังตอบกลับแล้ว — ถ้าแจ้งไม่สำเร็จโพสต์ก็ยังอยู่ครบ
  await notifyFollowersOfPost(post, post.author).catch((e) => console.error('notify followers failed:', e));
};

// DELETE /api/posts/:id — ลบได้เฉพาะเจ้าของโพสต์หรือ ADMIN (ลบไฟล์รูปด้วย)
exports.remove = async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, include: { images: true } });
  if (!post) return res.status(404).json({ message: req.t('post.notFound') });
  if (!canModify(req, post.authorId)) return res.status(403).json({ message: req.t('post.noPermDelete') });

  await prisma.post.delete({ where: { id: post.id } });
  removeUploadedFiles(post.images.map((img) => img.url));
  await removeForTarget('post', post.id); // แจ้งเตือนที่ชี้ไปยังโพสต์นี้ใช้ไม่ได้แล้ว
  res.status(204).end();
};

// POST /api/posts/:id/comments — extend: create comment (ส่ง parentId เพื่อตอบกลับ)
exports.addComment = async (req, res) => {
  const content = String(req.body?.content ?? '').trim();
  const parentId = req.body?.parentId || null;

  if (!content) return res.status(400).json({ message: req.t('post.commentEmpty') });
  if (content.length > MAX_COMMENT) {
    return res.status(400).json({ message: req.t('post.commentTooLong', { max: MAX_COMMENT }) });
  }

  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    select: { id: true, title: true, authorId: true },
  });
  if (!post) return res.status(404).json({ message: req.t('post.notFound') });

  let parent = null;
  if (parentId) {
    parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.postId !== post.id) {
      return res.status(400).json({ message: req.t('post.replyNotFound') });
    }
  }

  const comment = await prisma.comment.create({
    data: { content, parentId, postId: post.id, authorId: req.user.userId },
    include: { author: authorSelect },
  });
  res.status(201).json({ comment: toCommentDto(req, comment) });

  // แจ้งเตือน: คนที่ถูกตอบกลับ (REPLY) และเจ้าของโพสต์ (COMMENT) — ถ้าเป็นคนเดียวกันแจ้งแค่ REPLY
  // เก็บเป็นข้อมูลประกอบ — แอปสร้างข้อความตามภาษาของผู้รับเอง
  const params = { name: nameOf(comment.author), preview: preview(content), postTitle: preview(post.title, 40) };
  if (parent) {
    await notify({
      userId: parent.authorId,
      actorId: req.user.userId,
      type: 'REPLY',
      params,
      targetType: 'post',
      targetId: post.id,
      aggregate: true,
    });
  }
  if (post.authorId !== parent?.authorId) {
    await notify({
      userId: post.authorId,
      actorId: req.user.userId,
      type: 'COMMENT',
      params,
      targetType: 'post',
      targetId: post.id,
      aggregate: true,
    });
  }
};

// ตรวจโพสต์และสิทธิ์กดรีแอคชัน — คืน null ถ้าส่ง error ไปแล้ว
async function findReactablePost(req, res) {
  if (!REACTING_ROLES.includes(req.user.role)) {
    res.status(403).json({ message: req.t('post.reactNotAllowed') });
    return null;
  }
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, select: { id: true, title: true, authorId: true } });
  if (!post) res.status(404).json({ message: req.t('post.notFound') });
  return post;
}

const reactionsOf = async (req, postId) =>
  reactionSummary(req, await prisma.postReaction.findMany({ where: { postId }, select: { type: true, userId: true } }));

// PUT /api/posts/:id/reaction { type } — กดใหม่หรือเปลี่ยนแบบ (การยกเลิกใช้ DELETE)
exports.react = async (req, res) => {
  const type = String(req.body?.type ?? '');
  if (!REACTION_TYPES.includes(type)) return res.status(400).json({ message: req.t('post.reactInvalid') });
  const post = await findReactablePost(req, res);
  if (!post) return;

  const key = { postId: post.id, userId: req.user.userId };
  const existing = await prisma.postReaction.findUnique({ where: { postId_userId: key } });
  await prisma.postReaction.upsert({ where: { postId_userId: key }, create: { ...key, type }, update: { type } });
  res.json(await reactionsOf(req, post.id));

  // แจ้งเจ้าของโพสต์เฉพาะตอนกดครั้งแรก (เปลี่ยนแบบไม่แจ้งซ้ำ) — รวมเป็นรายการเดียวต่อโพสต์
  // โพสต์ไม่ระบุตัวตนก็แจ้งได้ เพราะผู้รับคือเจ้าของโพสต์เอง ไม่ได้เผยชื่อผู้เขียนให้ใคร
  if (existing) return;
  const me = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { firstName: true, lastName: true } });
  await notify({
    userId: post.authorId,
    actorId: req.user.userId,
    type: 'REACTION',
    params: { name: nameOf(me), reaction: type, postTitle: preview(post.title, 40) },
    targetType: 'post',
    targetId: post.id,
    aggregate: true,
  });
};

// DELETE /api/posts/:id/reaction — ยกเลิกรีแอคชันของตัวเอง
exports.unreact = async (req, res) => {
  const post = await findReactablePost(req, res);
  if (!post) return;
  await prisma.postReaction.deleteMany({ where: { postId: post.id, userId: req.user.userId } });
  res.json(await reactionsOf(req, post.id));
};

// GET /api/posts/:id/reactions — รายชื่อคนที่กด (ทุกคนดูได้) ใหม่สุดก่อน
exports.reactions = async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!post) return res.status(404).json({ message: req.t('post.notFound') });
  const rows = await prisma.postReaction.findMany({
    where: { postId: post.id },
    orderBy: { updatedAt: 'desc' },
    include: { user: authorSelect },
  });
  res.json({ users: rows.map((r) => ({ ...r.user, reaction: r.type, isSelf: r.userId === req.user.userId })) });
};

// DELETE /api/posts/:id/comments/:commentId — เจ้าของคอมเมนต์หรือ ADMIN (คำตอบใต้คอมเมนต์ถูกลบด้วย)
exports.removeComment = async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
  if (!comment || comment.postId !== req.params.id) return res.status(404).json({ message: req.t('post.commentNotFound') });
  if (!canModify(req, comment.authorId)) return res.status(403).json({ message: req.t('post.noPermDeleteComment') });

  await prisma.comment.delete({ where: { id: comment.id } });
  const commentCount = await prisma.comment.count({ where: { postId: comment.postId } });
  res.json({ commentCount });
};
