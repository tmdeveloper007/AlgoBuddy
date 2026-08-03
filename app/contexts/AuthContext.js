'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const signup = async (email, password, name, captchaToken = '') => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth`, {
        email,
        password,
        name,
        action: 'signup',
        captchaToken,
      });

      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Signup failed' };
    }
  };

  const login = async (email, password, captchaToken = '') => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth`, {
        email,
        password,
        action: 'login',
        captchaToken,
      });

      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
        localStorage.setItem('token', data.session.access_token);
      } else {
        localStorage.removeItem('token');
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useUser = () => useContext(AuthContext);