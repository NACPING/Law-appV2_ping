import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../services/apiClient';
import * as authService from '../services/authService';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, firstName, lastName, role: 'CLIENT' | 'LAWYER' | 'ADMIN' }
  const [isLoading, setIsLoading] = useState(true);
  const isLoggedIn = user !== null;

  // เปิดแอปแล้วยังมี token อยู่ -> ถาม backend ว่ายังใช้ได้ไหม
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          const { user: me } = await authService.getMe();
          setUser(me);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY); // token หมดอายุ/ใช้ไม่ได้
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (token, userData) => {
    disconnectSocket(); // เผื่อยังค้าง socket ของผู้ใช้คนก่อน
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  };

  const logout = async () => {
    disconnectSocket();
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  // หลังแก้โปรไฟล์/รูป — backend ส่งข้อมูลผู้ใช้ล่าสุดกลับมา
  const updateUser = (userData) => setUser((prev) => ({ ...prev, ...userData }));

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
