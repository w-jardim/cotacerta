import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials, RegisterData } from './types';
import { authApi } from './api';
import { authStorage } from './auth-storage';

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = authStorage.getToken();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.me();
        setUser(userData);
      } catch (error) {
        authStorage.removeToken();
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  async function login(credentials: LoginCredentials) {
    const { accessToken, user: userData } = await authApi.login(credentials);
    authStorage.setToken(accessToken);
    setUser(userData);
  }

  async function register(data: RegisterData) {
    const { accessToken, user: userData } = await authApi.register(data);
    authStorage.setToken(accessToken);
    setUser(userData);
  }

  function logout() {
    authStorage.removeToken();
    setUser(null);
  }

  const value: AuthContextData = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
