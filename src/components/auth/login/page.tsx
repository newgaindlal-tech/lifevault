'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Human-friendly error translation
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Incorrect email or password. Please check and try again.');
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      // Successful sign in will trigger AuthContext change and redirect to /
      router.replace('/');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-8">
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md mb-3">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In to LifeVault
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Access your tracked medicines, warranties, and renewals securely
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMessage && (
            <ErrorAlert
              title="Sign In Failed"
              message={errorMessage}
            />
          )}

          <div>
            <Input
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            size="md"
            variant="primary"
            className="w-full mt-2"
            isLoading={isSubmitting}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Don&apos;t have a vault yet?{' '}
            <Link
              href="/auth/signup"
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}