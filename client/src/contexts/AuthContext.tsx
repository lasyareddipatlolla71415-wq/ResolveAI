import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AuthSession,
  AuthUser,
  getMeApi,
  loginApi,
  registerApi,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY
} from "../services/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isUser: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthUser>;
  loginAs: (role: "ADMIN" | "STAFF" | "USER") => Promise<AuthUser>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: "USER" | "TECHNICIAN" | "ADMIN";
    department?: string;
  }) => Promise<AuthUser>;
  logout: () => void;
  switchRole: (targetRole: "ADMIN" | "STAFF" | "USER") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACCOUNTS = {
  ADMIN: {
    email: "admin@resolveai.com",
    password: "admin123",
    fallbackUser: {
      id: "admin-system-id",
      name: "System Administrator",
      email: "admin@resolveai.com",
      role: "ADMIN" as const,
      department: "IT Infrastructure",
      active: true
    }
  },
  STAFF: {
    email: "staff@resolveai.com",
    password: "staff123",
    fallbackUser: {
      id: "staff-sam-id",
      name: "Sam Staff",
      email: "staff@resolveai.com",
      role: "STAFF" as const,
      department: "IT Support",
      active: true
    }
  },
  USER: {
    email: "user@resolveai.com",
    password: "user123",
    fallbackUser: {
      id: "user-alex-id",
      name: "Alex User",
      email: "user@resolveai.com",
      role: "USER" as const,
      department: "Product Engineering",
      active: true
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session with /auth/me on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getMeApi();
        setUser(currentUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      } catch (err) {
        console.warn("Session check failed or offline:", err);
        // If local user exists, keep it for smooth offline/dev experience
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            logout();
          }
        } else {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const saveSession = (session: AuthSession) => {
    setUser(session.user);
    setToken(session.token);
    localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
  };

  const login = async (credentials: { email: string; password: string }): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const session = await loginApi(credentials);
      saveSession(session);
      return session.user;
    } catch (error: any) {
      // Check if trying demo credentials and backend threw error, fallback smoothly
      const normalizedEmail = credentials.email.trim().toLowerCase();
      if (
        normalizedEmail === DEMO_ACCOUNTS.ADMIN.email &&
        credentials.password === DEMO_ACCOUNTS.ADMIN.password
      ) {
        const fallbackSession: AuthSession = {
          user: DEMO_ACCOUNTS.ADMIN.fallbackUser as any,
          token: "mock-admin-token-" + Date.now()
        };
        saveSession(fallbackSession);
        return fallbackSession.user;
      }
      if (
        normalizedEmail === DEMO_ACCOUNTS.STAFF.email &&
        credentials.password === DEMO_ACCOUNTS.STAFF.password
      ) {
        const fallbackSession: AuthSession = {
          user: DEMO_ACCOUNTS.STAFF.fallbackUser as any,
          token: "mock-staff-token-" + Date.now()
        };
        saveSession(fallbackSession);
        return fallbackSession.user;
      }
      if (
        normalizedEmail === DEMO_ACCOUNTS.USER.email &&
        credentials.password === DEMO_ACCOUNTS.USER.password
      ) {
        const fallbackSession: AuthSession = {
          user: DEMO_ACCOUNTS.USER.fallbackUser as any,
          token: "mock-user-token-" + Date.now()
        };
        saveSession(fallbackSession);
        return fallbackSession.user;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAs = async (role: "ADMIN" | "STAFF" | "USER"): Promise<AuthUser> => {
    const config = DEMO_ACCOUNTS[role];
    try {
      return await login({ email: config.email, password: config.password });
    } catch {
      // Fallback in case backend is offline
      const fallbackSession: AuthSession = {
        user: config.fallbackUser as any,
        token: `mock-${role.toLowerCase()}-token-${Date.now()}`
      };
      saveSession(fallbackSession);
      return fallbackSession.user;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: "USER" | "TECHNICIAN" | "ADMIN";
    department?: string;
  }): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const session = await registerApi(data);
      saveSession(session);
      return session.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const switchRole = (targetRole: "ADMIN" | "STAFF" | "USER") => {
    const config = DEMO_ACCOUNTS[targetRole];
    const newSession: AuthSession = {
      user: config.fallbackUser as any,
      token: `switched-${targetRole.toLowerCase()}-token-${Date.now()}`
    };
    saveSession(newSession);
  };

  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF" || user?.role === "TECHNICIAN";
  const isUser = user?.role === "USER";
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isStaff,
        isUser,
        isLoading,
        login,
        loginAs,
        register,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
