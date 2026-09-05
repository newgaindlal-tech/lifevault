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

  // 1. Fetch User Items
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
  }, [loadData]);

  // 2. Add / Edit Handler
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

  // 3. Delete Handler
  const handleDeleteItem = async (id: string) => {
    await deleteVaultItem(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    window.dispatchEvent(new Event('vault-items-updated'));
  };

  // 4. Metrics calculation across total collection
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

  // 5. Run Filter and Sort Engine
  const processedItems = useMemo(() => {
    return filterAndSortItems(items, {
      searchQuery,
      statusFilter,
      categoryFilter,
      sortBy,
    });
  }, [items, searchQuery, statusFilter, categoryFilter, sortBy]);

  // 6. Group items for structured display
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
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        <MetricCard
          label="Expired"
          count={metrics.expired}
          variant="danger"
          active={statusFilter === 'expired'}
          onClick={() => setStatusFilter('expired')}
        />
        <MetricCard
          label="Expiring Soon"
          count={metrics.expiring}
          variant="warning"
          active={statusFilter === 'expiring'}
          onClick={() => setStatusFilter('expiring')}
        />
        <MetricCard
          label="Warranty Ending"
          count={metrics.warrantySoon}
          variant="info"
          active={statusFilter === 'warranty'}
          onClick={() => setStatusFilter('warranty')}
        />
        <MetricCard
          label="Renewals Due"
          count={metrics.renewalsSoon}
          variant="purple"
          active={statusFilter === 'renewal'}
          onClick={() => setStatusFilter('renewal')}
        />
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, brand, location, lot no, policy no, serial no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Multi-Facet Filter Controls */}
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

      {/* View Header & Layout Mode Switcher */}
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

      {/* Items Stream / Grouped Lists */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : processedItems.length === 0 ? (
        <EmptyState
          title="No items found"
          description={
            hasActiveFilters
              ? 'No records match your active search, category, or status criteria.'
              : 'Your vault is clear. Add your first item to start tracking deadlines.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Add Item'}
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
        <div className="space-y-6">
          {itemGroups.map((group) => (
            <div key={group.id} className="space-y-2.5">
              {/* Group Header (if grouped) */}
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

              {/* Items in this group */}
              <div className="space-y-2.5">
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