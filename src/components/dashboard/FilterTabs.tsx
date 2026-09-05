'use client';

import React from 'react';
import { StatusFilterType, SortOptionType } from '@/lib/filterEngine';
import { ITEM_CATEGORIES } from '@/types';
import { Filter, ArrowUpDown, X } from 'lucide-react';

interface FilterTabsProps {
  currentStatus: StatusFilterType;
  onStatusChange: (status: StatusFilterType) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  currentSort: SortOptionType;
  onSortChange: (sort: SortOptionType) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  currentStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  currentSort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}) => {
  const statusTabs: { id: StatusFilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'expired', label: 'Expired' },
    { id: 'expiring', label: 'Expiring Soon' },
    { id: 'safe', label: 'Safe' },
    { id: 'warranty', label: 'Warranties' },
    { id: 'renewal', label: 'Renewals' },
  ];

  return (
    <div className="space-y-3 pt-1">
      {/* Top row: Status Chips + Clear Button */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                currentStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors whitespace-nowrap"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Bottom row: Category Dropdown & Sorting Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            {ITEM_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as SortOptionType)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="urgent_asc">Sort: Nearest Deadline (Urgent)</option>
            <option value="urgent_desc">Sort: Furthest Deadline</option>
            <option value="recent">Sort: Recently Added</option>
            <option value="name_asc">Sort: Name (A - Z)</option>
            <option value="name_desc">Sort: Name (Z - A)</option>
            <option value="category">Sort: Category</option>
          </select>
        </div>
      </div>
    </div>
  );
};