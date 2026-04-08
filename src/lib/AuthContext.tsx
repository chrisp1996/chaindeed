'use client';

/**
 * AuthContext
 *
 * Single source of truth for the current session user.
 * Wrapped around the entire app in Providers so every component
 * (Navbar, page, child) reads the SAME state — no per-component
 * re-fetching, no race conditions, no infinite loading.
 *
 * Replaces the old useAuth hook pattern where each component created
 * its own independent useState + useEffect, causing each navigation
 * to show loading: true until a fresh /api/auth/me round-trip completed.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  kycStatus: string;
  walletAddress: string | null;
  additionalWallets: string[];
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (name: string, email: string, password: string, role?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (fields: Partial<{
    name: string; phone: string; bio: string; walletAddress: string;
  }>) => Promise<{ error?: string }>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res  = await fetch('/api/auth/me');
      const data = await res.json();
      // /api/auth/me returns null (HTTP 200) when not authenticated
      setUser(data && data.id ? data : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run once on app mount — result is shared across all consumers
  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? 'Login failed.' };
      // Immediately update shared state — no re-fetch needed
      setUser(data);
      return {};
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  }, []);

  const signup = useCallback(async (
    name: string, email: string, password: string, role?: string
  ) => {
    try {
      const res  = await fetch('/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? 'Signup failed.' };
      setUser(data);
      return {};
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (
    fields: Partial<{ name: string; phone: string; bio: string; walletAddress: string }>
  ) => {
    try {
      const res  = await fetch('/api/auth/me', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? 'Update failed.' };
      setUser(prev => prev ? { ...prev, ...data } : data);
      return {};
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, login, signup, logout, updateProfile, refetch: fetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Drop-in replacement for the old useAuth() hook — same API, shared state */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
