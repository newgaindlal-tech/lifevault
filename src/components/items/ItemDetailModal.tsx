'use client';

import React, { useState } from 'react';
import { VaultItem } from '@/lib/items';
import { ITEM_CATEGORIES } from '@/types';
import { DocumentManager } from '@/components/items/DocumentManager';
import { BrandSupportAssistant } from '@/components/items/BrandSupportAssistant';
import {
  X,
  Calendar,
  MapPin,
  Tag,
  Shield,
  Trash2,
  Edit,
  DollarSign,
  Building,
} from 'lucide-react';

interface ItemDetailModalProps {
  item: VaultItem | null;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => Promise<void>;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item) return null;

  const categoryMeta = ITEM_CATEGORIES.find((c) => c.id === item.category);
  const targetDate = item.warranty_until || item.expiry_date || 'None set';

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.name}" from your vault?`)) return;
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      onClose();
    } catch {
      alert('Failed to delete item. Check your connection.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="min-w-0 pr-2">
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
              {categoryMeta?.label || item.category}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {item.name}
            </h3>
            {item.brand && (
              <p className="text-xs text-slate-500">
                Brand: <span className="text-slate-800 font-semibold">{item.brand}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Data Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 text-xs text-slate-700">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
            <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-slate-500">
              {categoryMeta?.dateLabel || 'Deadline'}:
            </span>
            <span className="font-bold text-slate-900 text-sm">{targetDate}</span>
          </div>

          {item.purchase_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Purchased:</span>
              <span className="font-semibold text-slate-800">{item.purchase_date}</span>
            </div>
          )}

          {item.purchase_price && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Price:</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(item.purchase_price).toLocaleString()}
              </span>
            </div>
          )}

          {item.provider && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Provider:</span>
              <span className="font-semibold text-slate-800">{item.provider}</span>
            </div>
          )}

          {item.policy_number && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Policy / Doc No:</span>
              <span className="font-mono font-semibold text-slate-900">{item.policy_number}</span>
            </div>
          )}

          {item.location_tag && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Location:</span>
              <span className="font-semibold text-slate-800">{item.location_tag}</span>
            </div>
          )}

          {item.batch_number && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Batch / Lot:</span>
              <span className="font-mono text-slate-800">{item.batch_number}</span>
            </div>
          )}

          {item.serial_number && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Serial No:</span>
              <span className="font-mono text-slate-800">{item.serial_number}</span>
            </div>
          )}

          {item.notes && (
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="block font-bold text-slate-600 mb-1">Notes:</span>
              <p className="whitespace-pre-wrap text-slate-800">{item.notes}</p>
            </div>
          )}

          {/* Official Brand Support Assistant */}
          <div className="border-t border-slate-100 pt-3">
            <BrandSupportAssistant
              brand={item.brand}
              productName={item.name}
              customSupportUrl={item.support_url}
            />
          </div>

          {/* Document Attachment Manager */}
          <div className="border-t border-slate-100 pt-3">
            <DocumentManager itemId={item.id} />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 bg-slate-50 shrink-0">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 h-11 sm:h-9 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 touch-manipulation"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 h-11 sm:h-9 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition-colors touch-manipulation"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="h-11 sm:h-9 px-5 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition-colors touch-manipulation"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};