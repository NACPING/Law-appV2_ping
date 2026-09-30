const { Router } = require('express');
const ebooks = require('../controllers/ebookController');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// ทุก role อ่าน/ค้นหา/Favorite/ดาวน์โหลดได้ — การเพิ่มหนังสือจะทำในฝั่ง admin ภายหลัง
router.use(requireAuth);

router.get('/categories', ebooks.categories);
router.get('/favorites', ebooks.favorites);
router.get('/', ebooks.list);
router.get('/:id', ebooks.detail);
router.put('/:id/favorite', ebooks.addFavorite);
router.delete('/:id/favorite', ebooks.removeFavorite);

module.exports = router;
