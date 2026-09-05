'use client';

import React from 'react';
import { Home, PlusCircle, Calendar, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Vault', icon: Home },
    { id: 'add', label: 'Add Item', icon: PlusCircle },
    { id: 'calendar', label: 'Timeline', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Top Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 border-b border-slate-200 bg-white px-8 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation Bar (Fixed for mobile thumb ergonomics) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-16 py-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
};