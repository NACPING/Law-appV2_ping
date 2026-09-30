const { PrismaClient } = require('@prisma/client');

// ใช้ PrismaClient ตัวเดียวทั้งแอป
const prisma = new PrismaClient();

module.exports = prisma;
