'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Automatically check if logged-in user is an admin
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.is_admin === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    void checkRole();
  }, [user, supabase]);

  // 2. Direct Safe Entry for verified admin
  const handleEnterAdmin = () => {
    if (!isAdmin) {
      setErrorMsg('Access Denied: This account is not authorized as an administrator.');
      return;
    }

    sessionStorage.setItem('lifevault_admin_auth', 'granted');
    router.push('/admin');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 max-w-md w-full shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Portal Access</h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Secure role-based gatekeeper for LifeVault directory administration.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {checking ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" aria-hidden="true" />
            <p className="text-xs font-medium">Verifying your security role...</p>
          </div>
        ) : !user ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
            <Lock className="h-6 w-6 text-slate-400 mx-auto" aria-hidden="true" />
            <p className="text-xs text-slate-600 font-medium">
              You must sign in to an account before accessing the admin portal.
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Sign In to LifeVault
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Signed-in Account
              </span>
              <p className="text-xs font-bold text-slate-900 truncate">{user.email}</p>
              <div className="pt-1 flex items-center gap-1.5">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Authorized Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Regular User (Not Admin)
                  </span>
                )}
              </div>
            </div>

            {isAdmin ? (
              <button
                type="button"
                onClick={handleEnterAdmin}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <span>Enter Admin Control Panel →</span>
              </button>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                This account does not have admin permissions. Please log in with an administrator email.
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}