'use client';

import React from 'react';
import { GroupModeType } from '@/lib/filterEngine';
import { LayoutList, CalendarClock, Folders } from 'lucide-react';

interface ViewModeSelectorProps {
  currentMode: GroupModeType;
  onChange: (mode: GroupModeType) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({ currentMode, onChange }) => {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
      <button
        type="button"
        onClick={() => onChange('none')}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${
          currentMode === 'none'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-500 hover:text-slate-700'
        }`}
        title="Standard Flat List"
      >
        <LayoutList className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Flat</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('timeline')}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${
          currentMode === 'timeline'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-500 hover:text-slate-700'
        }`}
        title="Group by Expiry Timeline"
      >
        <CalendarClock className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Timeline</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('category')}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${
          currentMode === 'category'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-500 hover:text-slate-700'
        }`}
        title="Group by Category"
      >
        <Folders className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Category</span>
      </button>
    </div>
  );
};