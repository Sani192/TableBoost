'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-stone-900 p-8 rounded-2xl shadow-card dark:shadow-dark-card border border-stone-200/60 dark:border-stone-700/60">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Sign in to TableBoost
          </h2>
          <p className="mt-2 text-center text-sm text-stone-600 dark:text-stone-400">
            Access your quick billing desk
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 text-stone-900 dark:text-stone-100"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 text-stone-900 dark:text-stone-100"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-400 text-sm text-center font-medium">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-xl border border-transparent bg-brand-600 py-3 px-4 text-sm font-bold text-white shadow-lift hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
