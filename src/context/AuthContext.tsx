'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface AuthContextValue {
  user: unknown;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const AuthProvider: React.FC<{
  value: AuthContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard intercepts rendering for protected application routes.
 * If unauthenticated, it redirects the browser to /auth/login.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 space-y-4">
        <div className="text-center text-xs font-semibold text-slate-500 animate-pulse">
          Authenticating LifeVault Session...
        </div>
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  if (!user) {
    return null; // Prevents flashing protected UI while the redirect fires
  }

  return <>{children}</>;
};