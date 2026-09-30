const { Server } = require('socket.io');
const prisma = require('./config/db');
const { verifyUserToken } = require('./middlewares/auth');

let io = null;

const roomOf = (requestId) => `request:${requestId}`;
const userRoomOf = (userId) => `user:${userId}`;

// ลูกความหรือทนายของเคสเท่านั้นที่เข้าห้องแชทได้ (admin ไม่ได้ — แชทเป็นความลับ)
async function findChatForUser(requestId, userId) {
  const request = await prisma.lawyerRequest.findUnique({ where: { id: String(requestId) } });
  if (!request) return null;
  if (request.status !== 'APPROVED' && request.status !== 'CLOSED') return null;
  if (request.clientId !== userId && request.lawyerId !== userId) return null;
  return request;
}

function initRealtime(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  // ต้องส่ง token ล็อกอินมาตอนเชื่อมต่อ: io(url, { auth: { token } })
  io.use((socket, next) => {
    const user = verifyUserToken(socket.handshake.auth?.token);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    // ห้องส่วนตัวของผู้ใช้ — ใช้ส่งการแจ้งเตือน (กระดิ่ง)
    socket.join(userRoomOf(socket.data.user.userId));

    socket.on('chat:join', async ({ requestId } = {}, ack) => {
      const chat = await findChatForUser(requestId, socket.data.user.userId).catch(() => null);
      if (!chat) return ack?.({ ok: false });
      socket.join(roomOf(chat.id));
      ack?.({ ok: true });
    });
    socket.on('chat:leave', ({ requestId } = {}) => socket.leave(roomOf(requestId)));
  });
}

// ส่ง event ให้ทุกคนที่เปิดห้องแชทของเคสนี้อยู่
function emitToChat(requestId, event, payload) {
  io?.to(roomOf(requestId)).emit(event, payload);
}

// ส่ง event ถึงผู้ใช้คนเดียว (ทุกเครื่องที่ล็อกอินอยู่)
function emitToUser(userId, event, payload) {
  io?.to(userRoomOf(userId)).emit(event, payload);
}

// ผู้ใช้คนนี้กำลังเปิดห้องแชทนี้อยู่ไหม (ถ้าเปิดอยู่ ไม่ต้องแจ้งเตือนข้อความแชท)
async function isUserInChat(requestId, userId) {
  if (!io) return false;
  const sockets = await io.in(roomOf(requestId)).fetchSockets();
  return sockets.some((s) => s.data.user?.userId === userId);
}

module.exports = { initRealtime, emitToChat, emitToUser, isUserInChat, findChatForUser };
