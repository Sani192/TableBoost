'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  role: string;
  plan: string;
  features: string[];
  first_name?: string | null;
  last_name?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  hasFeatureAccess: (feature: string) => boolean;
  updateSubscription: (planName: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        
        // Fetch profile names
        let profile = { first_name: null, last_name: null };
        try {
          const profileRes = await fetch('/api/auth/profile', { credentials: 'include' });
          if (profileRes.ok) {
            profile = await profileRes.json();
          }
        } catch (e) {
          console.error('Failed to fetch profile in checkAuth', e);
        }

        setUser({ ...data, ...profile });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        
        let profile = { first_name: null, last_name: null };
        try {
          const profileRes = await fetch('/api/auth/profile', { credentials: 'include' });
          if (profileRes.ok) {
            profile = await profileRes.json();
          }
        } catch (e) {
          console.error('Failed to fetch profile in login', e);
        }

        setUser({
          username: data.username,
          role: data.role,
          plan: data.plan || 'STARTER',
          features: data.features || [],
          first_name: profile.first_name,
          last_name: profile.last_name
        });
        window.location.href = '/';
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('tableboost.visits');
      }
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, { ...options, credentials: 'include' });
    if (res.status === 401) {
      setUser(null);
      router.push('/login');
    }
    return res;
  };

  const hasFeatureAccess = (feature: string) => {
    if (!user) return false;
    // Database-driven check: feature list is returned by backend auth context
    const hasDbFeature = user.features ? user.features.includes(feature) : false;
    
    // Quick frontend shim for missing backend features on PRO plan
    if (user.plan === 'PRO' && (feature === 'analytics' || feature === 'automations')) {
      return true;
    }
    
    return hasDbFeature;
  };

  const updateSubscription = async (planName: string) => {
    try {
      const res = await fetch('/api/auth/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_name: planName }),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          username: data.username,
          role: data.role,
          plan: data.plan || 'STARTER',
          features: data.features || []
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Subscription update failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, authFetch, hasFeatureAccess, updateSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
