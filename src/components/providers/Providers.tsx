'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 pb-20 md:pb-8">
        {children}
      </main>
    </AuthProvider>
  );
}