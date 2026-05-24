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
  restaurant_id?: number | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  currentRestaurantId: number | null;
  setCurrentRestaurantId: (id: number | null) => void;
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
  const [currentRestaurantId, setCurrentRestaurantIdState] = useState<number | null>(null);
  const router = useRouter();

  // Load active restaurant ID from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = window.localStorage.getItem('tableboost.currentRestaurantId');
      if (storedId) {
        setCurrentRestaurantIdState(parseInt(storedId, 10));
      }
    }
  }, []);

  const setCurrentRestaurantId = (id: number | null) => {
    setCurrentRestaurantIdState(id);
    if (id !== null) {
      window.localStorage.setItem('tableboost.currentRestaurantId', id.toString());
    } else {
      window.localStorage.removeItem('tableboost.currentRestaurantId');
    }
  };

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {};
    if (currentRestaurantId !== null) {
      headers['X-Restaurant-ID'] = currentRestaurantId.toString();
    }
    return headers;
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', { 
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        
        // Update currentRestaurantId if it was changed or set by the backend
        if (data.restaurant_id) {
          setCurrentRestaurantId(data.restaurant_id);
        }

        // Fetch profile names
        let profile = { first_name: null, last_name: null };
        try {
          const profileRes = await fetch('/api/auth/profile', { 
            credentials: 'include',
            headers: getAuthHeaders()
          });
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
  }, [currentRestaurantId]);

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
        
        if (data.restaurant_id) {
          setCurrentRestaurantId(data.restaurant_id);
        }

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
          last_name: profile.last_name,
          restaurant_id: data.restaurant_id
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
      setCurrentRestaurantId(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('tableboost.visits');
        window.localStorage.removeItem('tableboost.currentRestaurantId');
      }
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      ...getAuthHeaders()
    };
    
    const res = await fetch(url, { ...options, headers, credentials: 'include' });
    if (res.status === 401) {
      setUser(null);
      router.push('/login');
    }
    return res;
  };

  const hasFeatureAccess = (feature: string) => {
    if (!user) return false;
    return user.features ? user.features.includes(feature) : false;
  };

  const updateSubscription = async (planName: string) => {
    try {
      const res = await fetch('/api/auth/subscription', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ plan_name: planName }),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? {
          ...prev,
          username: data.username,
          role: data.role,
          plan: data.plan || 'STARTER',
          features: data.features || []
        } : null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Subscription update failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      currentRestaurantId,
      setCurrentRestaurantId,
      login, 
      logout, 
      checkAuth, 
      authFetch, 
      hasFeatureAccess, 
      updateSubscription 
    }}>
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
