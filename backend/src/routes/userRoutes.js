const { Router } = require('express');
const users = require('../controllers/userController');
const { requireAuth } = require('../middlewares/auth');
const { uploadAvatar } = require('../middlewares/upload');

const router = Router();

router.use(requireAuth);

// หน้า Profile + Settings (แก้ได้เฉพาะของตัวเองผ่าน /me)
router.patch('/me', users.updateMe);
router.put('/me/avatar', uploadAvatar, users.updateAvatar);
router.delete('/me/avatar', users.removeAvatar);
router.put('/me/password', users.changePassword);
router.get('/:id', users.profile);

module.exports = router;
