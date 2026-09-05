'use client';

import React from 'react';

interface MetricCardProps {
  label: string;
  count: number;
  active?: boolean;
  onClick?: () => void;
  variant: 'default' | 'danger' | 'warning' | 'info' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  count,
  active = false,
  onClick,
  variant,
}) => {
  const variantStyles = {
    default: 'bg-emerald-50/50 text-emerald-800 border-emerald-200 hover:bg-emerald-50',
    danger: 'bg-rose-50/50 text-rose-800 border-rose-200 hover:bg-rose-50',
    warning: 'bg-amber-50/50 text-amber-800 border-amber-200 hover:bg-amber-50',
    info: 'bg-blue-50/50 text-blue-800 border-blue-200 hover:bg-blue-50',
    purple: 'bg-purple-50/50 text-purple-800 border-purple-200 hover:bg-purple-50',
  };

  const activeStyles = active
    ? 'ring-2 ring-slate-900 border-transparent shadow-sm'
    : 'border';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`rounded-xl p-3.5 sm:p-4 transition-all text-left select-none cursor-pointer ${variantStyles[variant]} ${activeStyles}`}
    >
      <span className="block text-[11px] font-bold uppercase tracking-wider opacity-85 truncate">
        {label}
      </span>
      <span className="block text-2xl sm:text-3xl font-extrabold mt-1">
        {count}
      </span>
    </div>
  );
};