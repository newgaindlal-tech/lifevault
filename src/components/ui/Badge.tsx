import React from 'react';
import { ItemStatus } from '@/types';

interface BadgeProps {
  status: ItemStatus;
  text?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, text }) => {
  const badgeConfig = {
    safe: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      defaultLabel: 'Safe',
    },
    expiring: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      defaultLabel: 'Expiring Soon',
    },
    expired: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      defaultLabel: 'Expired',
    },
  };

  const config = badgeConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}
    >
      {text || config.defaultLabel}
    </span>
  );
};
