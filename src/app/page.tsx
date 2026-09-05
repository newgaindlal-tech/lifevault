'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { FilterTabs } from '@/components/dashboard/FilterTabs';
import { ViewModeSelector } from '@/components/dashboard/ViewModeSelector';
import { ItemCard } from '@/components/items/ItemCard';
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
import {
  filterAndSortItems,
  groupItems,
  StatusFilterType,
  SortOptionType,
  GroupModeType,
} from '@/lib/filterEngine';
import { calculateItemUrgency } from '@/lib/dateUtils';
import { generateDueReminders } from '@/lib/reminders';
import { Search, Plus, ShieldCheck } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOptionType>('urgent_asc');
  const [groupMode, setGroupMode] = useState<GroupModeType>('none');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [viewingItem, setViewingItem] = useState<VaultItem | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserItems();
      setItems(data);
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

    const handleItemSync = () => void loadData();
    window.addEventListener('vault-items-updated', handleItemSync);
    window.addEventListener('vault-user-signed-out', () => setItems([]));

    return () => {
      window.removeEventListener('vault-items-updated', handleItemSync);
      window.removeEventListener('vault-user-signed-out', () => setItems([]));
    };
  }, [loadData]);

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

  const handleDeleteItem = async (id: string) => {
    await deleteVaultItem(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    window.dispatchEvent(new Event('vault-items-updated'));
  };

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

  const processedItems = useMemo(() => {
    return filterAndSortItems(items, {
      searchQuery,
      statusFilter,
      categoryFilter,
      sortBy,
    });
  }, [items, searchQuery, statusFilter, categoryFilter, sortBy]);

  const itemGroups = useMemo(() => {
    return groupItems(processedItems, groupMode);
  }, [processedItems, groupMode]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || statusFilter !== 'all' || categoryFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-8">
      {/* Top Banner (Touch Friendly) */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {user?.user_metadata?.full_name || user?.email}
            </h2>
            <p className="text-xs text-slate-600">
              <strong className="text-slate-800">{items.length} records</strong> tracked
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
          className="w-full sm:w-auto h-11 sm:h-9 text-sm font-semibold justify-center gap-2 touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Swipeable KPI Ribbon on Mobile */}
      <div className="flex sm:grid sm:grid-cols-5 gap-2 overflow-x-auto pb-1 sm:pb-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="snap-start shrink-0 w-32.5 sm:w-auto">
          <MetricCard
            label="Total Items"
            count={metrics.total}
            variant="default"
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
        </div>
        <div className="snap-start shrink-0 w-32.5 sm:w-auto">
          <MetricCard
            label="Expired"
            count={metrics.expired}
            variant="danger"
            active={statusFilter === 'expired'}
            onClick={() => setStatusFilter('expired')}
          />
        </div>
        <div className="snap-start shrink-0 w-32.5 sm:w-auto">
          <MetricCard
            label="Expiring"
            count={metrics.expiring}
            variant="warning"
            active={statusFilter === 'expiring'}
            onClick={() => setStatusFilter('expiring')}
          />
        </div>
        <div className="snap-start shrink-0 w-32.5 sm:w-auto">
          <MetricCard
            label="Warranty"
            count={metrics.warrantySoon}
            variant="info"
            active={statusFilter === 'warranty'}
            onClick={() => setStatusFilter('warranty')}
          />
        </div>
        <div className="snap-start shrink-0 w-32.5 sm:w-auto">
          <MetricCard
            label="Renewals"
            count={metrics.renewalsSoon}
            variant="purple"
            active={statusFilter === 'renewal'}
            onClick={() => setStatusFilter('renewal')}
          />
        </div>
      </div>

      {/* Search Input (No iOS Zoom) */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-3 sm:top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Search items, brands, serial no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 sm:h-9 text-base sm:text-sm"
        />
      </div>

      {/* Filter Tabs */}
      <FilterTabs
        currentStatus={statusFilter}
        onStatusChange={setStatusFilter}
        selectedCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        currentSort={sortBy}
        onSortChange={setSortBy}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* View Header & Mode Switcher */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Vault Items ({processedItems.length})
          </h3>
          {hasActiveFilters && (
            <span className="text-[11px] text-slate-500">Filtered view active</span>
          )}
        </div>

        <ViewModeSelector currentMode={groupMode} onChange={setGroupMode} />
      </div>

      {/* Items List */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : processedItems.length === 0 ? (
        <EmptyState
          title="No items found"
          description={
            hasActiveFilters
              ? 'No items match your active search or filter criteria.'
              : 'Your vault is clear. Tap "Add Item" to track your first product or document.'
          }
          actionLabel={hasActiveFilters ? 'Reset Filters' : 'Add Item'}
          onAction={
            hasActiveFilters
              ? handleClearFilters
              : () => {
                  setEditingItem(null);
                  setFormModalMode('add');
                  setFormModalOpen(true);
                }
          }
        />
      ) : (
        <div className="space-y-4">
          {itemGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              {groupMode !== 'none' && (
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {group.title}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {group.count}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {group.items.map((proc) => (
                  <ItemCard
                    key={proc.item.id}
                    processed={proc}
                    onView={() => setViewingItem(proc.item)}
                  />
                ))}
              </div>
            </div>
          ))}
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