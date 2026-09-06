'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Shield, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      // Supabase native password recovery link to /auth/callback -> /auth/reset-password
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage('Password recovery link sent! Please check your email inbox.');
    } catch {
      setErrorMessage('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
        <Link
          href="/auth/login"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to login</span>
        </Link>

        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recover Password</h1>
            <p className="text-xs text-slate-500">Enter your email to receive a password recovery link</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-700 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleResetRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="enter your email"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Send Recovery Link</span>}
          </button>
        </form>
      </div>
    </div>
  );
}