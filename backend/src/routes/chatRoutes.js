const { Router } = require('express');
const chat = require('../controllers/chatController');
const { requireAuth } = require('../middlewares/auth');
const { uploadChatFile } = require('../middlewares/chatUpload');

const router = Router();

// ไฟล์แนบ: ตรวจด้วย token ใน URL (ไม่ใช้ header) — ต้องอยู่ก่อน requireAuth
router.get('/files/:messageId', chat.file);

router.use(requireAuth);

// เฉพาะลูกความและทนายของเคส (admin ไม่มีสิทธิ์)
router.get('/:requestId/messages', chat.loadChat, chat.messages);
router.post('/:requestId/messages', chat.loadChat, chat.requireOpenChat, uploadChatFile, chat.send);

module.exports = router;
