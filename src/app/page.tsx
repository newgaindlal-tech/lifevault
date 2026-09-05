'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { FilterTabs, FilterView, SortOption } from '@/components/dashboard/FilterTabs';
import ItemFormModal from '@/components/items/ItemFormModal';
import { ItemDetailModal } from '@/components/items/ItemDetailModal';
import {
  fetchUserItems,
  createVaultItem,
  updateVaultItem,
  deleteVaultItem,
  VaultItem,
  ItemPayload,
} from '@/lib/items';
import { calculateItemUrgency } from '@/lib/dateUtils';
import { generateDueReminders } from '@/lib/reminders';
import { ITEM_CATEGORIES } from '@/types';
import { Search, Plus, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <MainVaultDashboard />
    </AuthGuard>
  );
}

function MainVaultDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterView>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentSort, setCurrentSort] = useState<SortOption>('urgent');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [viewingItem, setViewingItem] = useState<VaultItem | null>(null);

  // Load items from Supabase & evaluate upcoming reminders
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserItems();
      setItems(data);
      // Silently sync reminders for in-app bell notification
      await generateDueReminders();
    } catch (err) {
      console.error('Failed to load vault items:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const runLoad = async () => {
      await loadData();
    };

    void runLoad();
  }, [loadData]);

  // Handle Create & Update
  const handleFormSubmit = async (payload: ItemPayload) => {
    if (formModalMode === 'add') {
      const created = await createVaultItem(payload);
      setItems((prev) => [created, ...prev]);
    } else if (editingItem) {
      const updated = await updateVaultItem(editingItem.id, payload);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      setViewingItem(updated);
    }
    await generateDueReminders();
    window.dispatchEvent(new Event('vault-items-updated'));
  };

  // Handle Delete
  const handleDeleteItem = async (id: string) => {
    await deleteVaultItem(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    window.dispatchEvent(new Event('vault-items-updated'));
  };

  // Aggregate Metrics & Counts
  const metrics = useMemo(() => {
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let warrantyEndingSoonCount = 0;
    let renewalsDueSoonCount = 0;

    items.forEach((item) => {
      const meta = calculateItemUrgency(item);

      if (meta.status === 'expired') {
        expiredCount++;
      } else if (meta.daysRemaining <= 15) {
        expiringSoonCount++;
      }

      if (meta.isWarranty && meta.daysRemaining >= 0 && meta.daysRemaining <= 30) {
        warrantyEndingSoonCount++;
      }

      if (meta.isRenewal && meta.daysRemaining >= 0 && meta.daysRemaining <= 30) {
        renewalsDueSoonCount++;
      }
    });

    return {
      total: items.length,
      expired: expiredCount,
      expiring: expiringSoonCount,
      warrantySoon: warrantyEndingSoonCount,
      renewalsSoon: renewalsDueSoonCount,
    };
  }, [items]);

  // Filtered & Sorted Items
  const processedItems = useMemo(() => {
    return items
      .filter((item) => {
        const meta = calculateItemUrgency(item);

        // 1. Text Search Filter
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          item.name.toLowerCase().includes(query) ||
          (item.brand && item.brand.toLowerCase().includes(query)) ||
          (item.provider && item.provider.toLowerCase().includes(query)) ||
          (item.location_tag && item.location_tag.toLowerCase().includes(query)) ||
          (item.policy_number && item.policy_number.toLowerCase().includes(query));

        if (!matchesQuery) return false;

        // 2. Category Dropdown Filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // 3. Status Tabs Filter
        if (activeFilter === 'expired') return meta.status === 'expired';
        if (activeFilter === 'expiring') return meta.status === 'expiring';
        if (activeFilter === 'warranty') return meta.isWarranty;
        if (activeFilter === 'renewal') return meta.isRenewal;

        return true;
      })
      .sort((a, b) => {
        if (currentSort === 'recent') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }

        if (currentSort === 'name') {
          return a.name.localeCompare(b.name);
        }

        // Default 'urgent': prioritize expired (negative days), then expiring soon, then future
        const metaA = calculateItemUrgency(a);
        const metaB = calculateItemUrgency(b);
        return metaA.daysRemaining - metaB.daysRemaining;
      });
  }, [items, searchQuery, activeFilter, selectedCategory, currentSort]);

  // Recently Added Items (Top 3)
  const recentlyAdded = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Welcome back, {user?.user_metadata?.full_name || user?.email}
            </h2>
            <p className="text-xs text-slate-600">
              Surveillance active on <strong className="text-slate-800">{items.length} records</strong>.
            </p>
          </div>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={() => {
            setEditingItem(null);
            setFormModalMode('add');
            setFormModalOpen(true);
          }}
          className="gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* KPI Metric Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        <MetricCard
          label="Total Items"
          count={metrics.total}
          variant="default"
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        />
        <MetricCard
          label="Expired"
          count={metrics.expired}
          variant="danger"
          active={activeFilter === 'expired'}
          onClick={() => setActiveFilter('expired')}
        />
        <MetricCard
          label="Expiring Soon"
          count={metrics.expiring}
          variant="warning"
          active={activeFilter === 'expiring'}
          onClick={() => setActiveFilter('expiring')}
        />
        <MetricCard
          label="Warranty Ending"
          count={metrics.warrantySoon}
          variant="info"
          active={activeFilter === 'warranty'}
          onClick={() => setActiveFilter('warranty')}
        />
        <MetricCard
          label="Renewals Due"
          count={metrics.renewalsSoon}
          variant="purple"
          active={activeFilter === 'renewal'}
          onClick={() => setActiveFilter('renewal')}
        />
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by item name, brand, location, or policy no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Tabs & Sort Dropdowns */}
      <FilterTabs
        currentView={activeFilter}
        onViewChange={setActiveFilter}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        currentSort={currentSort}
        onSortChange={setCurrentSort}
      />

      {/* Main Tracked Items Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {activeFilter === 'all'
              ? 'All Tracked Items'
              : activeFilter === 'expired'
              ? 'Expired Items'
              : activeFilter === 'expiring'
              ? 'Items Expiring Soon (≤ 15 Days)'
              : activeFilter === 'warranty'
              ? 'Warranties & Electronics'
              : 'Renewals & Official Documents'}{' '}
            ({processedItems.length})
          </h3>
          <span className="text-xs text-slate-500">
            {currentSort === 'urgent'
              ? 'Sorted by nearest deadline'
              : currentSort === 'recent'
              ? 'Sorted by newest'
              : 'Sorted alphabetically'}
          </span>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : processedItems.length === 0 ? (
          <EmptyState
            title="No items found in this view"
            description={
              searchQuery
                ? `No items matched your search "${searchQuery}".`
                : 'No records matching the selected status or category.'
            }
            actionLabel="Add New Item"
            onAction={() => {
              setEditingItem(null);
              setFormModalMode('add');
              setFormModalOpen(true);
            }}
          />
        ) : (
          processedItems.map((item) => {
            const meta = calculateItemUrgency(item);
            const catMeta = ITEM_CATEGORIES.find((c) => c.id === item.category);

            return (
              <Card
                key={item.id}
                onClick={() => setViewingItem(item)}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 cursor-pointer hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {catMeta?.label || item.category}
                    </span>
                    <Badge status={meta.status} />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      {meta.dateLabel}: <strong className="text-slate-800">{meta.targetDate || 'None'}</strong>
                    </span>
                    {item.brand && (
                      <span>
                        Brand: <strong className="text-slate-700">{item.brand}</strong>
                      </span>
                    )}
                    {item.location_tag && (
                      <span>
                        Location: <em>{item.location_tag}</em>
                      </span>
                    )}
                    {item.policy_number && (
                      <span>
                        Ref No: <strong className="font-mono text-slate-700">{item.policy_number}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold block ${
                        meta.status === 'expired'
                          ? 'text-rose-600'
                          : meta.status === 'expiring'
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {meta.urgencyText}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingItem(item);
                    }}
                  >
                    View
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Recently Added Drawer */}
      {recentlyAdded.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Clock className="h-4 w-4 text-emerald-600" />
            <span>Recently Added to Vault</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {recentlyAdded.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setViewingItem(rec)}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer transition-colors"
              >
                <span className="font-semibold text-slate-800 block truncate">{rec.name}</span>
                <span className="text-[11px] text-slate-500 capitalize">{rec.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ItemFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        mode={formModalMode}
      />

      <ItemDetailModal
        item={viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={(item) => {
          setViewingItem(null);
          setEditingItem(item);
          setFormModalMode('edit');
          setFormModalOpen(true);
        }}
        onDelete={handleDeleteItem}
      />
    </div>
  );
}