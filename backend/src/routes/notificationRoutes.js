const { Router } = require('express');
const notifications = require('../controllers/notificationController');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// ทุกคนเห็นเฉพาะการแจ้งเตือนของตัวเอง
router.use(requireAuth);

router.get('/', notifications.list);
router.get('/unread-count', notifications.count);
router.patch('/read-all', notifications.readAll);
router.patch('/:id/read', notifications.read);

module.exports = router;
