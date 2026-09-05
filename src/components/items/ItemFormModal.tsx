'use client';

import React, { useState } from 'react';
import { ItemCategory, ITEM_CATEGORIES } from '@/types';
import { ItemPayload, VaultItem } from '@/lib/items';
import { X, AlertCircle } from 'lucide-react';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ItemPayload) => Promise<void>;
  initialData?: VaultItem | null;
  mode: 'add' | 'edit';
}

const getInitialFormState = (initialData?: VaultItem | null, mode: 'add' | 'edit' = 'add') => {
  const isEditMode = mode === 'edit' && !!initialData;

  return {
    category: isEditMode ? initialData.category : ('medicine' as ItemCategory),
    name: isEditMode ? initialData.name || '' : '',
    brand: isEditMode ? initialData.brand || '' : '',
    provider: isEditMode ? initialData.provider || '' : '',
    expiryDate: isEditMode ? initialData.expiry_date || '' : '',
    warrantyUntil: isEditMode ? initialData.warranty_until || '' : '',
    purchaseDate: isEditMode ? initialData.purchase_date || '' : '',
    purchasePrice: isEditMode && initialData.purchase_price !== null && initialData.purchase_price !== undefined
      ? String(initialData.purchase_price)
      : '',
    serialNumber: isEditMode ? initialData.serial_number || '' : '',
    batchNumber: isEditMode ? initialData.batch_number || '' : '',
    locationTag: isEditMode ? initialData.location_tag || '' : '',
    policyNumber: isEditMode ? initialData.policy_number || '' : '',
    renewalType: isEditMode ? initialData.renewal_type || '' : '',
    notes: isEditMode ? initialData.notes || '' : '',
  };
};

const ItemFormContent: React.FC<Pick<ItemFormModalProps, 'onClose' | 'onSubmit' | 'initialData' | 'mode'>> = ({
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const initialState = getInitialFormState(initialData, mode);
  const [category, setCategory] = useState<ItemCategory>(initialState.category);
  const [name, setName] = useState(initialState.name);
  const [brand, setBrand] = useState(initialState.brand);
  const [provider, setProvider] = useState(initialState.provider);
  const [expiryDate, setExpiryDate] = useState(initialState.expiryDate);
  const [warrantyUntil, setWarrantyUntil] = useState(initialState.warrantyUntil);
  const [purchaseDate, setPurchaseDate] = useState(initialState.purchaseDate);
  const [purchasePrice, setPurchasePrice] = useState(initialState.purchasePrice);
  const [serialNumber, setSerialNumber] = useState(initialState.serialNumber);
  const [batchNumber, setBatchNumber] = useState(initialState.batchNumber);
  const [locationTag, setLocationTag] = useState(initialState.locationTag);
  const [policyNumber, setPolicyNumber] = useState(initialState.policyNumber);
  const [renewalType, setRenewalType] = useState<string>(initialState.renewalType);
  const [notes, setNotes] = useState(initialState.notes);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCategoryMeta = ITEM_CATEGORIES.find((c) => c.id === category) || ITEM_CATEGORIES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a name for this item.');
      return;
    }

    // Category-specific date validations
    if (currentCategoryMeta.requiresExpiry && !expiryDate) {
      setFormError(`Please select the ${currentCategoryMeta.dateLabel}.`);
      return;
    }

    if (currentCategoryMeta.requiresWarranty && !warrantyUntil) {
      setFormError('Please select the Warranty End Date.');
      return;
    }

    if (currentCategoryMeta.requiresRenewal && !expiryDate) {
      setFormError('Please select the Renewal/Expiry Date.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        category,
        brand: brand.trim() || null,
        provider: provider.trim() || null,
        expiry_date: expiryDate || null,
        warranty_until: warrantyUntil || null,
        purchase_date: purchaseDate || null,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        serial_number: serialNumber.trim() || null,
        batch_number: batchNumber.trim() || null,
        location_tag: locationTag.trim() || null,
        policy_number: policyNumber.trim() || null,
        renewal_type: renewalType.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === 'add' ? 'Add Item to Vault' : 'Edit Vault Item'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item / Product Name *
            </label>
            <input
              type="text"
              required
              placeholder={
                category === 'medicine'
                  ? 'e.g. Paracetamol 650mg'
                  : category === 'warranty'
                  ? 'e.g. Microwave Oven 28L'
                  : category === 'insurance'
                  ? 'e.g. Comprehensive Car Insurance'
                  : 'e.g. Olive Oil 500ml'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Brand / Manufacturer (Consumables & Durables) */}
          {(currentCategoryMeta.group === 'consumable' || currentCategoryMeta.group === 'durables') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand / Manufacturer (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Pfizer, Samsung, Nestlé"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Provider / Insurer (Renewals & Documents) */}
          {currentCategoryMeta.group === 'renewals' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issuing Provider / Agency (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC ERGO, RTO, UIDAI"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy / Document / Reg No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. POL-9920194 or MH-02-..."
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Renewal Type (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual, Quarterly, Auto-renew"
                  value={renewalType}
                  onChange={(e) => setRenewalType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* CATEGORY-AWARE DATES */}
          {/* 1. Expiry Date (Consumables, Renewals, General) */}
          {category !== 'warranty' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {currentCategoryMeta.dateLabel} *
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Storage Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen Top Shelf, Medicine Box"
                  value={locationTag}
                  onChange={(e) => setLocationTag(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* 2. Warranty Dates & Details (Electronics/Appliances) */}
          {category === 'warranty' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warranty End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={warrantyUntil}
                    onChange={(e) => setWarrantyUntil(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 24999.00"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serial Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. S/N 884920412"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Batch number for Medicine & Food */}
          {(category === 'medicine' || category === 'first_aid' || category === 'supplement') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch / Lot Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. B-99382"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Dosage notes, invoice location, renewal terms..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Save to Vault' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ItemFormModal(props: ItemFormModalProps) {
  if (!props.isOpen) {
    return null;
  }

  return <ItemFormContent {...props} />;
}