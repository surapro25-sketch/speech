import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, DeviceAccount } from '../types';
import { getRandomAnimeAvatar } from '../utils/animeAvatars';

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  checkGoogleAccount: (email: string) => Promise<{ exists: boolean; email: string; name?: string; username?: string; error?: string }>;
  loginWithGoogle: (
    googleEmail?: string,
    googleName?: string,
    googleAvatar?: string,
    credential?: string,
    username?: string,
    password?: string
  ) => Promise<{ success: boolean; notRegistered?: boolean; email?: string; name?: string; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  deviceAccounts: DeviceAccount[];
  continueWithDeviceAccount: (account: DeviceAccount) => Promise<boolean>;
  removeDeviceAccount: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'amharic_studio_auth_token';
const USER_KEY = 'amharic_studio_auth_user';
const DEVICE_ACCOUNTS_KEY = 'chrome_device_accounts';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [deviceAccounts, setDeviceAccounts] = useState<DeviceAccount[]>(() => {
    try {
      const stored = localStorage.getItem(DEVICE_ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const saveToDeviceAccounts = (userData: User, userToken: string) => {
    setDeviceAccounts((prev) => {
      const filtered = prev.filter(
        (a) => a.id !== userData.id && a.username.toLowerCase() !== userData.username.toLowerCase()
      );
      const newAccount: DeviceAccount = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name || userData.username,
        avatarUrl: userData.avatarUrl || getRandomAnimeAvatar(userData.username),
        role: userData.role,
        token: userToken,
        lastUsedAt: new Date().toISOString(),
      };
      const updated = [newAccount, ...filtered];
      localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeDeviceAccount = (id: string) => {
    setDeviceAccounts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const continueWithDeviceAccount = async (account: DeviceAccount): Promise<boolean> => {
    try {
      const res = await fetch(`/api/auth/me?token=${encodeURIComponent(account.token)}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setToken(account.token);
        localStorage.setItem(TOKEN_KEY, account.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        saveToDeviceAccounts(data.user, account.token);
        setIsAuthModalOpen(false);
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setIsAdminModalOpen(false);
  };

  // Validate session on load
  useEffect(() => {
    if (token) {
      fetch(`/api/auth/me?token=${encodeURIComponent(token)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Session invalid');
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            saveToDeviceAccounts(data.user, token);
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to sign in' };
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      saveToDeviceAccounts(data.user, data.token);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred during login' };
    }
  };

  const signup = async (
    username: string,
    email: string,
    name: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // NOTE: No role is sent from client-side. The server enforces role 'user'.
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, name, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to create account' };
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      saveToDeviceAccounts(data.user, data.token);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred during registration' };
    }
  };

  const checkGoogleAccount = async (email: string): Promise<{ exists: boolean; email: string; name?: string; username?: string; error?: string }> => {
    try {
      const res = await fetch('/api/auth/google/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { exists: false, email, error: data.error || 'Failed to check account' };
      }
      return data;
    } catch (err: any) {
      return { exists: false, email, error: err.message || 'Network error checking Google account' };
    }
  };

  const loginWithGoogle = async (
    googleEmail?: string,
    googleName?: string,
    googleAvatar?: string,
    credential?: string,
    username?: string,
    password?: string
  ): Promise<{ success: boolean; notRegistered?: boolean; email?: string; name?: string; error?: string }> => {
    try {
      const email = googleEmail || 'surapro25@gmail.com';
      const name = googleName || (email.startsWith('surapro') ? 'Sura Pro' : email.split('@')[0]);
      const avatarUrl = googleAvatar || getRandomAnimeAvatar(name);

      // NOTE: No role is sent to server. Server-side determines role securely.
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatarUrl, credential, username, password }),
      });
      const data = await res.json();
      if (data.notRegistered) {
        return {
          success: false,
          notRegistered: true,
          email: data.email || email,
          name: data.name || name,
          error: data.message,
        };
      }
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Google authentication failed' };
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      saveToDeviceAccounts(data.user, data.token);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during Google sign in' };
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/auth/me?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        saveToDeviceAccounts(data.user, token);
      }
    } catch {
      // Ignore
    }
  };

  const isAuthenticated = !!user && user.status === 'active';
  const isAdmin = isAuthenticated && user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        login,
        signup,
        checkGoogleAccount,
        loginWithGoogle,
        logout,
        refreshUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAdminModalOpen,
        setIsAdminModalOpen,
        deviceAccounts,
        continueWithDeviceAccount,
        removeDeviceAccount,
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
