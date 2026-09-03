import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Employee, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  employeeProfile: Employee | null;
  permissions: string[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role?: UserRole, userId?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('review_app_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSession = async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem('review_app_token');
    if (!storedToken) {
      setUser(null);
      setEmployeeProfile(null);
      setPermissions([]);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setEmployeeProfile(data.employeeProfile || null);
      setPermissions(data.permissions || []);
    } catch (err) {
      console.warn('Invalid token, resetting session...');
      localStorage.removeItem('review_app_token');
      setToken(null);
      setUser(null);
      setEmployeeProfile(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('review_app_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setEmployeeProfile(data.employeeProfile || null);
      setPermissions(data.permissions || []);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role?: UserRole, userId?: string) => {
    setIsLoading(true);
    try {
      const data = await api.switchRole(role, userId);
      localStorage.setItem('review_app_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setEmployeeProfile(data.employeeProfile || null);
      setPermissions(data.permissions || []);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem('review_app_token');
      await api.logout();
      setUser(null);
      setEmployeeProfile(null);
      setPermissions([]);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employeeProfile,
        permissions,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        refreshSession: loadSession,
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
