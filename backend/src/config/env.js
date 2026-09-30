const path = require('path');

// โหลด backend/.env ไม่ว่าจะรันจากโฟลเดอร์ไหน
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Copy .env.example to .env and set a secret.');
}

module.exports = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '7d',
};
