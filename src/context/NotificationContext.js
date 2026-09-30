import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import * as notificationService from '../services/notificationService';
import { getSocket } from '../services/socket';

const NotificationContext = createContext(null);

// ตัวเลขบนกระดิ่ง + รับการแจ้งเตือนใหม่แบบ real-time ทั้งแอป (ตั้งแต่ล็อกอินจนออกจากระบบ)
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const listenersRef = useRef(new Set()); // หน้าที่อยากรู้ทันทีเมื่อมีแจ้งเตือนใหม่ (เช่น หน้า Notification)

  const refreshCount = useCallback(async () => {
    try {
      const { unreadCount: n } = await notificationService.getUnreadCount();
      setUnreadCount(n);
    } catch {
      // ไม่เป็นไร — ครั้งหน้าจะลองใหม่
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return undefined;
    }
    let socket;
    let active = true;
    const onNew = ({ notification, unreadCount: n }) => {
      setUnreadCount(n);
      listenersRef.current.forEach((fn) => fn(notification));
    };
    const onCount = ({ unreadCount: n }) => setUnreadCount(n);

    refreshCount();
    getSocket().then((s) => {
      if (!active) return;
      socket = s;
      socket.on('notification:new', onNew);
      socket.on('notification:count', onCount);
      socket.on('connect', refreshCount); // เชื่อมต่อใหม่หลังหลุด → ดึงตัวเลขล่าสุด
    });
    // กลับเข้าแอปจากพื้นหลัง → ดึงตัวเลขล่าสุด
    const appState = AppState.addEventListener('change', (s) => s === 'active' && refreshCount());

    return () => {
      active = false;
      appState.remove();
      if (!socket) return;
      socket.off('notification:new', onNew);
      socket.off('notification:count', onCount);
      socket.off('connect', refreshCount);
    };
  }, [user?.id, refreshCount]);

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshCount, subscribe }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
