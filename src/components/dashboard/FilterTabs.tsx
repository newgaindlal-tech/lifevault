'use client';

import React from 'react';
import { ITEM_CATEGORIES } from '@/types';

export type FilterView = 'all' | 'expired' | 'expiring' | 'warranty' | 'renewal';
export type SortOption = 'urgent' | 'recent' | 'name';

interface FilterTabsProps {
  currentView: FilterView;
  onViewChange: (view: FilterView) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  currentView,
  onViewChange,
  selectedCategory,
  onCategoryChange,
  currentSort,
  onSortChange,
}) => {
  const views: { id: FilterView; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'expired', label: 'Expired' },
    { id: 'expiring', label: 'Expiring Soon' },
    { id: 'warranty', label: 'Warranties' },
    { id: 'renewal', label: 'Renewals' },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
      {/* Quick Status Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {views.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentView === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dropdown Filters (Category & Sorting) */}
      <div className="flex items-center gap-2">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Categories</option>
          {ITEM_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="urgent">Sort: Most Urgent</option>
          <option value="recent">Sort: Recently Added</option>
          <option value="name">Sort: Name (A-Z)</option>
        </select>
      </div>
    </div>
  );
};