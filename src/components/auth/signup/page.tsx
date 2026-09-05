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

export default function SignUpPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, jump to dashboard
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Sign up with user metadata so our Phase 3 trigger populates user_profiles automatically
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // If user session is created immediately (when email confirmation is turned off)
      if (data?.session) {
        router.replace('/');
      } else {
        // Fallback if email confirmation was kept enabled in Supabase
        setErrorMessage('Account created. Please check your email to confirm your account before logging in.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to register account.');
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
          Create Your LifeVault
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Never let an expiry date or warranty receipt slip away again
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSignUp} className="space-y-4">
          {errorMessage && (
            <ErrorAlert
              title="Registration Error"
              message={errorMessage}
            />
          )}

          <div>
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            Create Vault Account
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}