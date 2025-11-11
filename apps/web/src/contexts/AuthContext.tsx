import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { fetchMeApi, loginApi, registerApi, logoutApi, fetchSSOUserApi, ssoLoginApi, ssoLogoutApi} from '../api-paths/authApi';

interface AuthUser {
  id: string;
  email: string;
  role: 'creator' | 'respondent';
  createdAt: string;
  name?: string | null;
  ssoAuth?: boolean;
  oid?: string | null;
}

type SsoSessionUser = {
  id?: string;
  email: string;
  name?: string;
  oid?: string;
  role?: 'creator' | 'respondent';
};

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

  const mergeUsers = useCallback((sessionUser: SsoSessionUser | null, apiUser?: Partial<AuthUser>): AuthUser | null => {
    if (!sessionUser && !apiUser) {
      return null;
    }

    const mergedEmail = apiUser?.email ?? sessionUser?.email;
    if (!mergedEmail) {
      return null;
    }

    return {
      id: apiUser?.id ?? sessionUser?.id ?? sessionUser?.email ?? mergedEmail,
      email: mergedEmail,
      role: apiUser?.role ?? sessionUser?.role ?? 'creator',
      createdAt: apiUser?.createdAt ?? new Date().toISOString(),
      name: apiUser?.name ?? sessionUser?.name ?? null,
      ssoAuth: apiUser?.ssoAuth ?? Boolean(sessionUser),
      oid: apiUser?.oid ?? sessionUser?.oid ?? null,
    };
  }, []);

  const fetchMe = useCallback(async () => {
    setLoading(true);

    try {
      let sessionUser: SsoSessionUser | null = null;

      try {
        const ssoData = await fetchSSOUserApi();
        if (ssoData.user) {
          sessionUser = {
            id: ssoData.user.id,
            email: ssoData.user.email,
            name: ssoData.user.name,
            oid: ssoData.user.oid,
            role: 'creator',
          };
        }
      } catch (ssoError) {
        console.info('SSO session not found, continuing with JWT auth check');
      }

      try {
        const data = await fetchMeApi();
        const mergedUser = mergeUsers(sessionUser, data.user);
        setUser(mergedUser);
        return;
      } catch (apiError) {
        if (sessionUser) {
          const mergedUser = mergeUsers(sessionUser);
          setUser(mergedUser);
          return;
        }

        throw apiError;
      }
    } catch (error: any) {
      console.error(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [mergeUsers]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginApi(email, password);
      setUser({
        ...data.user,
        name: data.user.name ?? null,
        ssoAuth: Boolean(data.user.ssoAuth),
        oid: data.user.oid ?? null,
      });
    } catch (error: any) {
      setUser(null);
      throw error; // Re-throw to let the calling component handle it
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      const data = await registerApi(email, password);
      setUser({
        ...data.user,
        name: data.user.name ?? null,
        ssoAuth: Boolean(data.user.ssoAuth),
        oid: data.user.oid ?? null,
      });
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
