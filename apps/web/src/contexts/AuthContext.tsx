import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { fetchMeApi, loginApi, registerApi, logoutApi} from '../api-paths/authApi';

interface AuthUser {
  id: string;
  email: string;
  role: 'creator' | 'respondent';
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchMeApi();
      setUser(data.user); // data.user exists if API returns user object
    } catch (error: any) {
      console.error(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginApi(email, password);
      setUser(data.user);
    } catch (error: any) {
      alert('Login failed'); // optional: use alert instead of state
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      const data = await registerApi(email, password);
      setUser(data.user);
    } catch (error: any) {
      alert('Register failed'); // optional: use alert
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error: any) {
      alert('Logout failed'); // optional: alert for error
    } finally {
      setUser(null);
    }
  }, []);

  // ✅ Memoize the context value
  const contextValue = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
