import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: Student | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  allowedDomain: string;
  loginGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allowedDomain, setAllowedDomain] = useState<string>('ahduni.edu.in');

  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.getMe();
      setAllowedDomain(data.allowed_domain || 'ahduni.edu.in');

      if (data.authenticated && data.student_id && data.email) {
        setUser({
          id: data.student_id,
          email: data.email,
          name: data.name || data.email.split('@')[0],
          picture: data.picture,
          best_score_seconds: data.best_score_seconds || 0,
          best_achieved_at: data.best_achieved_at,
          completed_challenges_count: data.completed_challenges_count || 0,
          total_attempts_count: 0,
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        });
      } else {
        localStorage.removeItem('sanctum_session_token');
        setUser(null);
      }
    } catch (err) {
      console.warn('Failed to resolve authenticated session:', err);
      localStorage.removeItem('sanctum_session_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginGoogle = useCallback(async (credential: string) => {
    setIsLoading(true);
    try {
      const res = await authService.loginGoogle(credential);
      if (res.token) {
        localStorage.setItem('sanctum_session_token', res.token);
      }
      const s = res.student;
      const studentId = s.id || (s as any)._id;
      setUser({
        id: studentId,
        email: s.email,
        name: s.name || s.email.split('@')[0],
        picture: s.picture,
        best_score_seconds: s.best_score_seconds || 0,
        best_achieved_at: s.best_achieved_at,
        completed_challenges_count: s.completed_challenges_count || 0,
        total_attempts_count: s.total_attempts_count || 0,
        created_at: s.created_at || new Date().toISOString(),
        last_active_at: s.last_active_at || new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout network error:', err);
    }
    localStorage.removeItem('sanctum_session_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        allowedDomain,
        loginGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
