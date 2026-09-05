'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReminderNotification } from '@/types';
import { fetchUserReminders, deleteReminder, generateDueReminders } from '@/lib/reminders';
import { Bell, Check, Trash2, AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ReminderNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadReminders = useCallback(async () => {
    const data = await fetchUserReminders();
    setNotifications(data);
  }, []);

  const handleManualScan = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await generateDueReminders();
      setNotifications(result.notifications);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      const data = await fetchUserReminders();
      if (isMounted) {
        setNotifications(data);
      }
    };

    void fetchInitialData();

    // जब भी डैशबोर्ड पर कोई नया आइटम जुड़े, बेल अपने आप लेटेस्ट डेटा खींच लेगी
    const handleVaultUpdate = () => {
      void handleManualScan();
    };

    window.addEventListener('vault-items-updated', handleVaultUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('vault-items-updated', handleVaultUpdate);
    };
  }, [handleManualScan]);

  // बाहर क्लिक करने पर बंद होना
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismiss = async (id: string) => {
    try {
      await deleteReminder(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        type="button"
        aria-label="View notifications"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Notifications
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                {unreadCount} Total
              </span>
            </div>

            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleManualScan}
              title="Refresh alerts"
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* अब ऊँचाई max-h-96 है और स्मूथ स्क्रॉलबार है */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <Check className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p className="font-medium text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No pending deadlines require action.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isExpired = notif.urgency_label.toLowerCase().includes('expired');

                return (
                  <div
                    key={notif.id}
                    className="flex items-start justify-between gap-3 p-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`rounded-lg p-1.5 mt-0.5 shrink-0 ${
                          isExpired
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {isExpired ? (
                          <ShieldAlert className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 truncate" title={notif.item_name}>
                          {notif.item_name}
                        </span>
                        <span
                          className={`inline-block text-[11px] font-semibold ${
                            isExpired ? 'text-rose-600' : 'text-amber-700'
                          }`}
                        >
                          {notif.urgency_label}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Date: {notif.remind_at}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDismiss(notif.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Dismiss alert"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};