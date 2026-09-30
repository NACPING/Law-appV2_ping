const { Router } = require('express');
const auth = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', requireAuth, auth.me);

module.exports = router;
