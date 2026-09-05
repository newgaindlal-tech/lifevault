'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProcessedItem } from '@/lib/filterEngine';
import { ITEM_CATEGORIES } from '@/types';
import { Calendar, MapPin, Tag } from 'lucide-react';

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
      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 cursor-pointer hover:border-slate-300 hover:shadow-xs transition-all select-none"
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-slate-900 truncate max-w-70">
            {item.name}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded capitalize">
            {catMeta?.label || item.category}
          </span>
          <Badge status={meta.status} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{meta.dateLabel}:</span>
            <strong className="text-slate-800">{meta.targetDate || 'None'}</strong>
          </span>

          {item.brand && (
            <span>
              Brand: <strong className="text-slate-700">{item.brand}</strong>
            </span>
          )}

          {item.location_tag && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{item.location_tag}</span>
            </span>
          )}

          {item.policy_number && (
            <span className="flex items-center gap-1 font-mono">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span>{item.policy_number}</span>
            </span>
          )}

          {item.batch_number && (
            <span className="font-mono text-[11px] text-slate-400">
              Lot: {item.batch_number}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
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
            onView();
          }}
        >
          View
        </Button>
      </div>
    </Card>
  );
};