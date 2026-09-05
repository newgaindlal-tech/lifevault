'use client';

import React, { useState } from 'react';
import { VaultItem } from '@/lib/items';
import { ITEM_CATEGORIES } from '@/types';
import { DocumentManager } from '@/components/items/DocumentManager';
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
    if (!confirm(`Are you sure you want to delete "${item.name}" from your vault?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      onClose();
    } catch {
      alert('Failed to delete item. Please check your connection.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
              {categoryMeta?.label || item.category}
            </span>
            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              {item.name}
            </h3>
            {item.brand && (
              <p className="text-xs font-medium text-slate-500">
                Brand: <span className="text-slate-800">{item.brand}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Data Grid */}
        <div className="py-4 space-y-3 text-xs text-slate-700">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-100">
            <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-slate-500">
              {categoryMeta?.dateLabel || 'Target Date'}:
            </span>
            <span className="font-bold text-slate-900">{targetDate}</span>
          </div>

          {item.purchase_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-500">Purchased On:</span>
              <span>{item.purchase_date}</span>
            </div>
          )}

          {item.purchase_price && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-500">Purchase Price:</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(item.purchase_price).toLocaleString()}
              </span>
            </div>
          )}

          {item.provider && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-500">Provider / Insurer:</span>
              <span>{item.provider}</span>
            </div>
          )}

          {item.policy_number && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-500">Policy / Doc No:</span>
              <span className="font-mono">{item.policy_number}</span>
            </div>
          )}

          {item.location_tag && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-500">Storage Location:</span>
              <span>{item.location_tag}</span>
            </div>
          )}

          {item.batch_number && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-500">Batch / Lot:</span>
              <span className="font-mono">{item.batch_number}</span>
            </div>
          )}

          {item.serial_number && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-500">Serial Number:</span>
              <span className="font-mono">{item.serial_number}</span>
            </div>
          )}

          {item.notes && (
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="block font-semibold text-slate-500 mb-1">
                Notes & Reminders:
              </span>
              <p className="whitespace-pre-wrap text-slate-700">{item.notes}</p>
            </div>
          )}

          {/* Document & Receipt Attachment Section */}
          <div className="border-t border-slate-100 pt-3">
            <DocumentManager itemId={item.id} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete Item'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};