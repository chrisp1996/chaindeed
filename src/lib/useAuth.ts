'use client';

import { useState, useEffect, useCallback } from 'react';

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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    setUser(data);
    return {};
  };

  const signup = async (name: string, email: string, password: string, role?: string): Promise<{ error?: string }> => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    setUser(data);
    return {};
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const updateProfile = async (fields: Partial<{ name: string; phone: string; bio: string; walletAddress: string }>): Promise<{ error?: string }> => {
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    setUser(prev => prev ? { ...prev, ...data } : data);
    return {};
  };

  return { user, loading, login, signup, logout, updateProfile, refetch: fetchUser };
}
