const { Router } = require('express');
const requests = require('../controllers/lawyerRequestController');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = Router();

router.use(requireAuth);

// ลูกความ: ส่ง / ยกเลิกคำขอ
router.post('/', requireRole('CLIENT'), requests.create);
router.delete('/:id', requireRole('CLIENT'), requests.cancel);

// admin: รายชื่อทนาย, อนุมัติ, ปฏิเสธ
router.get('/lawyers', requireRole('ADMIN'), requests.lawyers);
router.patch('/:id/approve', requireRole('ADMIN'), requests.approve);
router.patch('/:id/reject', requireRole('ADMIN'), requests.reject);

// ปิดเคส (ยินยอมทั้งสองฝ่าย): ทนายขอ/ยกเลิก, ลูกความตอบรับ
router.patch('/:id/close', requireRole('LAWYER'), requests.requestClose);
router.patch('/:id/close/cancel', requireRole('LAWYER'), requests.cancelClose);
router.patch('/:id/close/respond', requireRole('CLIENT'), requests.respondClose);

// ทุก role: ดูเฉพาะคำขอที่ตัวเองมีสิทธิ์เห็น (กรองใน controller)
router.get('/', requests.list);
router.get('/:id', requests.detail);

module.exports = router;
