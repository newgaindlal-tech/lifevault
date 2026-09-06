'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Shield,
  KeyRound,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  LogOut,
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [emailReminders, setEmailReminders] = useState(true);

  // Password fields: Current, New, Confirm
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
        if (profile.notification_preferences) {
          setEmailReminders(profile.notification_preferences.email_reminders ?? true);
        }
      }

      setLoading(false);
    }

    loadUserData();
  }, [router, supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          timezone,
          notification_preferences: {
            email_reminders: emailReminders,
            days_before: 7,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        setProfileMsg({ type: 'error', text: error.message });
      } else {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Old password verification + New password update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setUpdatingPassword(true);

    try {
      // 1. Current Password सही है या नहीं, यह जाँचना
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordMsg({ type: 'error', text: 'Current password is incorrect.' });
        setUpdatingPassword(false);
        return;
      }

      // 2. Current Password सही होने पर ही New Password अपडेट करना
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordMsg({ type: 'error', text: updateError.message });
      } else {
        setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Failed to update password.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Account deletion failed: ${errorData.error}`);
        setDeletingAccount(false);
        return;
      }

      await supabase.auth.signOut();
      router.push('/auth/signup');
      router.refresh();
    } catch {
      alert('An unexpected error occurred during account deletion.');
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2 text-emerald-600" />
        <span>Loading account settings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Profile Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Profile Details</h2>
              <p className="text-xs text-slate-500">Manage your profile and regional preferences</p>
            </div>
          </div>

          {profileMsg && (
            <div
              className={`mb-4 p-3 rounded-xl flex items-center space-x-2 text-sm ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Primary)</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Kolkata or UTC"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="reminders"
                checked={emailReminders}
                onChange={(e) => setEmailReminders(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label htmlFor="reminders" className="text-xs text-slate-700 cursor-pointer font-medium">
                Receive email reminders before document or warranty expiration
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security Section (With Current Password Requirement) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-200">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Security</h2>
              <p className="text-xs text-slate-500">Change your account password using your current password</p>
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`mb-4 p-3 rounded-xl flex items-center space-x-2 text-sm ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current (Old) Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updatingPassword}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {updatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>

        {/* Account Deletion */}
        <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 md:p-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-9 w-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center border border-red-200">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-900">Delete Account</h2>
              <p className="text-xs text-red-600">Permanently remove your account and all stored documents</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-6">
            Deleting your account will permanently wipe all your records and uploaded files. This action cannot be undone.
          </p>

          {!deleteConfirmOpen ? (
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Delete LifeVault Account
            </button>
          ) : (
            <div className="p-4 bg-white border border-red-200 rounded-xl space-y-3">
              <p className="text-xs text-red-800 font-semibold">
                Are you completely sure? All your documents will be permanently purged.
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
                >
                  {deletingAccount && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Yes, Delete Everything</span>
                </button>
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deletingAccount}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}