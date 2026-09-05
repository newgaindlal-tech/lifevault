'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

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