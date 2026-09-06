'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, LogOut, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NotificationCenter } from '@/components/reminders/NotificationCenter';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const userDisplayName = user?.user_metadata?.full_name || user?.email || 'User';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
      {/* Brand logo & name */}
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
            LifeVault
          </span>
          <span className="text-[10px] text-slate-500 font-medium block">
            Tracker & Shield
          </span>
        </div>
      </Link>

      {/* Controls, Admin Link & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <>
            {/* Admin Control Panel Button */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-xs font-medium"
              title="Admin Control Panel"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span className="hidden sm:inline">Admin</span>
            </Link>

            {/* Live Free Notification Center */}
            <NotificationCenter />

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="hidden sm:block text-xs font-semibold text-slate-800 max-w-30 truncate">
                {userDisplayName}
              </span>
              <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xs font-bold text-emerald-800">
                {userInitials}
              </div>
              <button
                onClick={() => signOut()}
                title="Sign Out"
                aria-label="Sign Out"
                className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-md"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};