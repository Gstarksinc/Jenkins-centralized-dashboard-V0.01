import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, setAuthToken, clearAuth } from '../api/client';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  status: string;
  is_bootstrap_admin: boolean;
  roles: string[];
  session_token?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('jcc_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verify active session with backend
    const checkSession = async () => {
      try {
        const profile = await apiFetch<UserProfile>('/api/v1/auth/me');
        setUser(profile);
        localStorage.setItem('jcc_user', JSON.stringify(profile));
      } catch {
        // If unauthenticated or session expired
        setUser(null);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const profile = await apiFetch<UserProfile>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (profile.session_token) {
      setAuthToken(profile.session_token);
    }
    setUser(profile);
    localStorage.setItem('jcc_user', JSON.stringify(profile));
  };

  const logout = async () => {
    try {
      await apiFetch<{ message: string }>('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      clearAuth();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
