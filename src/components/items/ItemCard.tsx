'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProcessedItem } from '@/lib/filterEngine';
import { ITEM_CATEGORIES } from '@/types';
import { Calendar, MapPin, Tag, ChevronRight } from 'lucide-react';

interface ItemCardProps {
  processed: ProcessedItem;
  onView: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ processed, onView }) => {
  const { item, meta } = processed;
  const catMeta = ITEM_CATEGORIES.find((c) => c.id === item.category);

  return (
    <Card
      onClick={onView}
      className="p-3.5 sm:p-4 cursor-pointer active:bg-slate-50 sm:hover:border-slate-300 sm:hover:shadow-xs transition-all touch-manipulation select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-slate-900 truncate max-w-55 sm:max-w-85">
              {item.name}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded capitalize">
              {catMeta?.label || item.category}
            </span>
            <Badge status={meta.status} />
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{meta.dateLabel}:</span>
              <strong className="text-slate-800 font-semibold">{meta.targetDate || 'None'}</strong>
            </span>

            {item.brand && (
              <span>
                Brand: <strong className="text-slate-700">{item.brand}</strong>
              </span>
            )}

            {item.location_tag && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{item.location_tag}</span>
              </span>
            )}

            {item.policy_number && (
              <span className="flex items-center gap-1 font-mono">
                <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{item.policy_number}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right side urgency status and mobile chevron */}
        <div className="flex flex-col items-end justify-between shrink-0 pl-1 gap-2">
          <span
            className={`text-xs font-bold ${
              meta.status === 'expired'
                ? 'text-rose-600'
                : meta.status === 'expiring'
                ? 'text-amber-600'
                : 'text-emerald-700'
            }`}
          >
            {meta.urgencyText}
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </Card>
  );
};