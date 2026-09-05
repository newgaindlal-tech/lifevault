'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Navigation } from '@/components/layout/Navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { VaultItemSummary } from '@/types';
import { Search, Plus, Filter, Database, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const MOCK_ITEMS: VaultItemSummary[] = [
  {
    id: '1',
    name: 'Amoxicillin 500mg (Antibiotic)',
    category: 'medicine',
    expiryDate: '2026-09-12',
    daysRemaining: 7,
    status: 'expiring',
    notes: 'Cabinet top shelf',
  },
  {
    id: '2',
    name: 'Samsung Microwave Oven',
    category: 'warranty',
    expiryDate: '2027-04-15',
    daysRemaining: 222,
    status: 'safe',
    notes: '2-Year extended invoice uploaded',
  },
  {
    id: '3',
    name: 'Greek Yogurt 500g',
    category: 'grocery',
    expiryDate: '2026-09-02',
    daysRemaining: -3,
    status: 'expired',
    notes: 'Fridge door compartment',
  },
];

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showDemoError, setShowDemoError] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<VaultItemSummary[]>(MOCK_ITEMS);

  // Database test states
  const [dbChecking, setDbChecking] = useState(false);
  const [dbResult, setDbResult] = useState<{ status: string; message: string; latency?: string } | null>(null);

  const testDatabaseConnection = async () => {
    setDbChecking(true);
    setDbResult(null);
    try {
      const res = await fetch('/api/db-check');
      const data = await res.json();
      setDbResult(data);
    } catch {
      setDbResult({
        status: 'error',
        message: 'Could not communicate with local API route',
      });
    } finally {
      setDbChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* User Welcome Strip */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Welcome back, {user?.user_metadata?.full_name || user?.email}
            </h2>
            <p className="text-xs text-slate-600">
              Your personal vault is encrypted with Row-Level Security.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={testDatabaseConnection}
          isLoading={dbChecking}
          className="text-xs bg-white"
        >
          <Database className="h-3.5 w-3.5 mr-1 text-emerald-600" />
          Verify DB Connection
        </Button>
      </div>

      {dbResult && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
            dbResult.status === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {dbResult.status === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          )}
          <span className="font-semibold">{dbResult.message}</span>
          {dbResult.latency && (
            <span className="font-mono text-[11px] opacity-75">
              ({dbResult.latency})
            </span>
          )}
        </div>
      )}

      {showDemoError && (
        <ErrorAlert
          title="Network Connection Notice"
          message="Could not connect to the remote vault. Working in offline fallback mode."
          onRetry={() => setShowDemoError(false)}
        />
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="p-4 bg-emerald-50/50 border-emerald-100">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            Safe
          </span>
          <span className="text-2xl font-extrabold text-emerald-900 mt-1 block">
            18
          </span>
        </Card>
        <Card className="p-4 bg-amber-50/50 border-amber-100">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
            Expiring Soon
          </span>
          <span className="text-2xl font-extrabold text-amber-900 mt-1 block">
            3
          </span>
        </Card>
        <Card className="p-4 bg-rose-50/50 border-rose-100">
          <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
            Expired
          </span>
          <span className="text-2xl font-extrabold text-rose-900 mt-1 block">
            1
          </span>
        </Card>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search medicine, invoice, brand, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="md" className="gap-1.5 flex-1 md:flex-none">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="primary" size="md" className="gap-1.5 flex-1 md:flex-none">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Tracked Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            Tracked Items ({items.length})
          </h2>
          <span className="text-xs text-slate-500">Sorted by urgency</span>
        </div>

        {isLoadingDemo ? (
          <LoadingSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Your vault is currently empty"
            description="Add your first medicine strip, appliance warranty, or grocery receipt to get automated expiry reminders."
            onAction={() => setItems(MOCK_ITEMS)}
          />
        ) : (
          items.map((item) => (
            <Card key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                  <Badge status={item.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Category: <strong className="font-medium text-slate-700 capitalize">{item.category}</strong></span>
                  <span>Date: <strong className="font-medium text-slate-700">{item.expiryDate}</strong></span>
                  {item.notes && <span>Location: <em>{item.notes}</em></span>}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-right">
                  <span className={`text-xs font-bold block ${
                    item.status === 'expired'
                      ? 'text-rose-600'
                      : item.status === 'expiring'
                      ? 'text-amber-600'
                      : 'text-slate-600'
                  }`}>
                    {item.daysRemaining < 0
                      ? `${Math.abs(item.daysRemaining)} days ago`
                      : item.daysRemaining === 0
                      ? 'Expires today'
                      : `${item.daysRemaining} days left`}
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}