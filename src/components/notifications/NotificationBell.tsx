'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchUserReminders } from '@/lib/reminders';
import { Bell, Check, Clock, AlertCircle } from 'lucide-react';

type ReminderRecord = {
  id: string;
  item_name: string;
  urgency_label: string;
  remind_at: string;
};

export const NotificationBell: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserReminders();
      setReminders(data);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // जब भी कोई आइटम ऐड, एडिट या डिलीट हो तो लिस्ट रीफ्रेश करें
    const handleUpdate = () => {
      void loadReminders();
    };
    const handleSignedOut = () => {
      setReminders([]);
    };

    const scheduleInitialLoad = () => {
      window.requestAnimationFrame(() => {
        void loadReminders();
      });
    };

    scheduleInitialLoad();
    window.addEventListener('vault-items-updated', handleUpdate);
    window.addEventListener('vault-user-signed-out', handleSignedOut);

    return () => {
      window.removeEventListener('vault-items-updated', handleUpdate);
      window.removeEventListener('vault-user-signed-out', handleSignedOut);
    };
  }, [loadReminders]);

  const unreadCount = reminders.length;

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer (Mobile Responsive) */}
      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900">Upcoming Deadlines</h4>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {unreadCount} Active
              </span>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Checking deadlines...</div>
            ) : reminders.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <Check className="h-6 w-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">All clear!</p>
                <p className="text-[11px] text-slate-400">No deadlines due in the next 15 days.</p>
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {rem.item_name}
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                        {rem.urgency_label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      <span>Due date: {rem.remind_at}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};