const { Router } = require('express');
const posts = require('../controllers/postController');
const { requireAuth } = require('../middlewares/auth');
const { uploadPostImages } = require('../middlewares/upload');

const router = Router();

// เฉพาะ CLIENT สร้างโพสต์ได้ — ทนายทำได้แค่คอมเมนต์
const clientsOnly = (req, res, next) => {
  if (req.user.role === 'CLIENT') return next();
  res.status(403).json({ message: req.t('post.lawyerCannotPost') });
};

router.use(requireAuth);

router.get('/', posts.list);
// ตรวจสิทธิ์ก่อนรับไฟล์ จะได้ไม่มีไฟล์ค้างเมื่อถูกปฏิเสธ
router.post('/', clientsOnly, uploadPostImages, posts.create);
router.get('/:id', posts.detail);
router.delete('/:id', posts.remove);
router.post('/:id/comments', posts.addComment);
router.put('/:id/reaction', posts.react);
router.delete('/:id/reaction', posts.unreact);
router.get('/:id/reactions', posts.reactions);
router.delete('/:id/comments/:commentId', posts.removeComment);

module.exports = router;
