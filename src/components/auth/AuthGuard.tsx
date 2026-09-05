'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
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
    return null;
  }

  return <>{children}</>;
};