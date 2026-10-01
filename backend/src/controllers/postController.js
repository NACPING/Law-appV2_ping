const prisma = require('../config/db');
const { removeUploadedFiles } = require('../middlewares/upload');
const { notify, markRead, removeForTarget, preview, nameOf } = require('../services/notify');
const { notifyFollowersOfPost } = require('./followController');

const MAX_TITLE = 150;
const MAX_CONTENT = 5000;
const MAX_COMMENT = 2000;

const authorSelect = { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } };

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
    include: {
      author: authorSelect,
      images: { orderBy: { order: 'asc' } },
      _count: { select: { comments: true } },
    },
  });
  res.json({ posts: posts.map((p) => toPostDto(req, p)) });
};

// GET /api/posts/:id — หน้า comment
exports.detail = async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      author: authorSelect,
      images: { orderBy: { order: 'asc' } },
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
      include: { author: authorSelect, images: { orderBy: { order: 'asc' } }, _count: { select: { comments: true } } },
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

// DELETE /api/posts/:id/comments/:commentId — เจ้าของคอมเมนต์หรือ ADMIN (คำตอบใต้คอมเมนต์ถูกลบด้วย)
exports.removeComment = async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
  if (!comment || comment.postId !== req.params.id) return res.status(404).json({ message: req.t('post.commentNotFound') });
  if (!canModify(req, comment.authorId)) return res.status(403).json({ message: req.t('post.noPermDeleteComment') });

  await prisma.comment.delete({ where: { id: comment.id } });
  const commentCount = await prisma.comment.count({ where: { postId: comment.postId } });
  res.json({ commentCount });
};
