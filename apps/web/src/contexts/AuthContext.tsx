import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { fetchMeApi, loginApi, registerApi, logoutApi, fetchSSOUserApi, ssoLoginApi, ssoLogoutApi} from '../api-paths/authApi';

interface AuthUser {
  id: string;
  email: string;
  role: 'creator' | 'respondent';
  createdAt: string;
  name?: string; // For SSO users
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  ssoLogin: () => void;
  ssoLogout: () => void;
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
      // Try SSO first, then fall back to JWT
      try {
        const ssoData = await fetchSSOUserApi();
        if (ssoData.user) {
          setUser({
            id: ssoData.user.oid || ssoData.user.email,
            email: ssoData.user.email,
            name: ssoData.user.name,
            role: 'creator', // SSO users default to creator
            createdAt: new Date().toISOString()
          });
          return;
        }
      } catch (ssoError) {
        // SSO failed, try JWT
        console.log('SSO not available, trying JWT auth');
      }

      // Try JWT authentication
      const data = await fetchMeApi();
      setUser(data.user);
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
      setUser(null);
      throw error; // Re-throw to let the calling component handle it
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      const data = await registerApi(email, password);
      setUser(data.user);
    } catch (error: any) {
      setUser(null);
      throw error; // Re-throw to let the calling component handle it
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

  const ssoLogin = useCallback(() => {
    ssoLoginApi();
  }, []);

  const ssoLogout = useCallback(() => {
    ssoLogoutApi();
  }, []);

  // ✅ Memoize the context value
  const contextValue = useMemo(
    () => ({ user, loading, login, register, logout, ssoLogin, ssoLogout }),
    [user, loading, login, register, logout, ssoLogin, ssoLogout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
