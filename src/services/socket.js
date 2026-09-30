import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { SERVER_URL, TOKEN_KEY } from './apiClient';

// การเชื่อมต่อ real-time ตัวเดียวทั้งแอป (ใช้กับแชท)
let socket = null;

export async function getSocket() {
  if (socket) return socket;
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  socket = io(SERVER_URL, { auth: { token }, transports: ['websocket'] });
  return socket;
}

// เรียกตอน logout เพื่อไม่ให้ใช้ token ของผู้ใช้คนเดิมต่อ
export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
