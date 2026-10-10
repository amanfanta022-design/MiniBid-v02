import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import { detectPortal, navigateToPortal } from '../utils/portal.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string, portalOverride?: 'admin' | 'player') => Promise<{ success: boolean; error?: string; code?: string }>;
  loginWithOtp: (phone: string, code: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  sendOtp: (phone: string, purpose?: 'login' | 'register') => Promise<{ success: boolean; error?: string; message?: string }>;
  sendEmailOtp: (email?: string) => Promise<{ success: boolean; error?: string; message?: string; email?: string }>;
  verifyEmailOtp: (email: string, code: string) => Promise<{ success: boolean; error?: string; message?: string; user?: User }>;
  register: (data: { username: string; email?: string; phone: string; password: string; otp_code?: string }) => Promise<{ success: boolean; error?: string; email_otp_dispatched?: boolean; email?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('minibid_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token invalid or expired
        localStorage.removeItem('minibid_token');
        setToken(null);
        setUser(null);
      }
    } catch {
      // Network issue
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [token]);

  const login = async (identifier: string, password: string, portalOverride?: 'admin' | 'player') => {
    try {
      const activePortal = portalOverride || detectPortal();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal': activePortal,
        },
        body: JSON.stringify({ identifier, password, portal: activePortal }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to sign in', code: data.code };
      }
      localStorage.setItem('minibid_token', data.token);
      setToken(data.token);
      setUser(data.user);

      // Auto-coordinate portal transition
      if (data.user.role === 'admin' || data.user.role === 'superadmin') {
        navigateToPortal('admin');
      } else if (data.redirect_portal === 'player' && activePortal === 'admin') {
        navigateToPortal('player');
      }

      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      return { success: false, error: msg };
    }
  };

  const sendOtp = async (phone: string, purpose: 'login' | 'register' = 'login') => {
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to dispatch SMS code' };
      }
      return {
        success: true,
        message: data.message,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      return { success: false, error: msg };
    }
  };

  const sendEmailOtp = async (email?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/auth/email-otp/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to dispatch email verification code' };
      }
      return {
        success: true,
        message: data.message,
        email: data.email,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      return { success: false, error: msg };
    }
  };

  const verifyEmailOtp = async (email: string, code: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/auth/email-otp/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to verify email code' };
      }
      if (data.user) {
        setUser(data.user);
      } else {
        await refreshUser();
      }
      return {
        success: true,
        message: data.message,
        user: data.user,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      return { success: false, error: msg };
    }
  };

  const loginWithOtp = async (phone: string, code: string) => {
    try {
      const res = await fetch('/api/auth/otp/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal': 'player',
        },
        body: JSON.stringify({ phone, code, portal: 'player' }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid OTP code', code: data.code };
      }
      localStorage.setItem('minibid_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      return { success: false, error: msg };
    }
  };

  const register = async (userData: { username: string; email?: string; phone: string; password: string; otp_code?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      localStorage.setItem('minibid_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return {
        success: true,
        email_otp_dispatched: data.email_otp_dispatched,
        email: data.user?.email || userData.email,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('minibid_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  const updateUserBalance = (newBalance: number) => {
    setUser(prev => (prev ? { ...prev, wallet_balance: newBalance } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithOtp,
        sendOtp,
        sendEmailOtp,
        verifyEmailOtp,
        register,
        logout,
        refreshUser,
        updateUserBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
