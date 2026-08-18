'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!isMounted || isLoading) return;
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Unable to complete login. Please try again.');
      }

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) throw new Error('Invalid email or password.');
        if (res.status === 403) throw new Error('Your staff account is inactive. Please contact an administrator.');
        if (res.status === 429) throw new Error('Too many login attempts. Please wait and try again.');
        if (res.status >= 500) throw new Error('Something went wrong. Please try again.');
        throw new Error(data.error?.message || 'Invalid login credentials.');
      }
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Invalid login credentials.');
      }

      router.replace('/staff/qr-test');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Login request timed out. Please check your connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to connect to the server. Check your connection and try again.');
      }
      setIsLoading(false); // Only reset loading on error so success keeps spinner
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div role="form" className="mt-8 space-y-6" onKeyDown={handleKeyDown}>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm border border-red-200">
          {error}
        </div>
      )}
      
      <div className="rounded-md shadow-sm space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-zinc-800 rounded focus:outline-none focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white sm:text-sm transition-colors"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-zinc-800 rounded focus:outline-none focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white sm:text-sm transition-colors"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isMounted || isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-offset-black dark:focus:ring-white disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          {!isMounted ? 'Loading...' : isLoading ? 'Signing in...' : 'Login'}
        </button>
      </div>
    </div>
  );
}
