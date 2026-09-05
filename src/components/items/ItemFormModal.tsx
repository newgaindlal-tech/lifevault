'use client';

import React, { useState } from 'react';
import { ItemCategory, ITEM_CATEGORIES } from '@/types';
import { ItemPayload, VaultItem } from '@/lib/items';
import { ExtractedFields } from '@/lib/ocrExtractor';
import { OcrScannerModal } from '@/components/items/OcrScannerModal';
import { sanitizeWebUrl, sanitizePlainText } from '@/lib/sanitize';
import { X, AlertCircle, Camera } from 'lucide-react';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ItemPayload) => Promise<void>;
  initialData?: VaultItem | null;
  mode: 'add' | 'edit';
}

function isValidDateString(dateStr?: string | null): boolean {
  if (!dateStr) return true;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  if (year < 1970 || year > 2099) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export default function ItemFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ItemFormModalProps) {
  const isEditing = Boolean(initialData && mode === 'edit');
  const [category, setCategory] = useState<ItemCategory>(isEditing ? initialData!.category : 'medicine');
  const [name, setName] = useState(isEditing ? initialData!.name || '' : '');
  const [brand, setBrand] = useState(isEditing ? initialData!.brand || '' : '');
  const [provider, setProvider] = useState(isEditing ? initialData!.provider || '' : '');
  const [expiryDate, setExpiryDate] = useState(isEditing ? initialData!.expiry_date || '' : '');
  const [warrantyUntil, setWarrantyUntil] = useState(isEditing ? initialData!.warranty_until || '' : '');
  const [purchaseDate, setPurchaseDate] = useState(isEditing ? initialData!.purchase_date || '' : '');
  const [purchasePrice, setPurchasePrice] = useState(isEditing && initialData!.purchase_price ? String(initialData!.purchase_price) : '');
  const [serialNumber, setSerialNumber] = useState(isEditing ? initialData!.serial_number || '' : '');
  const [batchNumber, setBatchNumber] = useState(isEditing ? initialData!.batch_number || '' : '');
  const [locationTag, setLocationTag] = useState(isEditing ? initialData!.location_tag || '' : '');
  const [policyNumber, setPolicyNumber] = useState(isEditing ? initialData!.policy_number || '' : '');
  const [renewalType] = useState(isEditing ? initialData!.renewal_type || '' : '');
  const [notes, setNotes] = useState(isEditing ? initialData!.notes || '' : '');
  const [supportUrl, setSupportUrl] = useState(isEditing ? initialData!.support_url || '' : '');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  if (!isOpen) return null;

  const currentCategoryMeta = ITEM_CATEGORIES.find((c) => c.id === category) || ITEM_CATEGORIES[0];

  const handleApplyOcrData = (data: Partial<ExtractedFields>) => {
    if (data.name) setName(sanitizePlainText(data.name, 120));
    if (data.expiryDate && isValidDateString(data.expiryDate)) setExpiryDate(data.expiryDate);
    if (data.batchNumber) setBatchNumber(sanitizePlainText(data.batchNumber, 60));
    if (data.invoiceNumber && !policyNumber) setPolicyNumber(sanitizePlainText(data.invoiceNumber, 60));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = sanitizePlainText(name, 120);
    if (!cleanName) {
      setFormError('Please enter an item name.');
      return;
    }

    if (currentCategoryMeta.requiresExpiry && !expiryDate) {
      setFormError(`Please select the ${currentCategoryMeta.dateLabel}.`);
      return;
    }

    if (currentCategoryMeta.requiresWarranty && !warrantyUntil) {
      setFormError('Please select the Warranty End Date.');
      return;
    }

    if (!isValidDateString(expiryDate) || !isValidDateString(warrantyUntil) || !isValidDateString(purchaseDate)) {
      setFormError('Invalid date. Years must be between 1970 and 2099.');
      return;
    }

    let parsedPrice: number | null = null;
    if (purchasePrice.trim()) {
      parsedPrice = parseFloat(purchasePrice);
      if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 100000000) {
        setFormError('Purchase price must be a valid positive number.');
        return;
      }
    }

    let cleanUrl: string | null = null;
    if (supportUrl.trim()) {
      cleanUrl = sanitizeWebUrl(supportUrl);
      if (!cleanUrl) {
        setFormError('Support URL must start with http:// or https://');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: cleanName,
        category,
        brand: sanitizePlainText(brand, 80) || null,
        provider: sanitizePlainText(provider, 80) || null,
        expiry_date: expiryDate || null,
        warranty_until: warrantyUntil || null,
        purchase_date: purchaseDate || null,
        purchase_price: parsedPrice,
        serial_number: sanitizePlainText(serialNumber, 60) || null,
        batch_number: sanitizePlainText(batchNumber, 60) || null,
        location_tag: sanitizePlainText(locationTag, 80) || null,
        policy_number: sanitizePlainText(policyNumber, 80) || null,
        renewal_type: sanitizePlainText(renewalType, 50) || null,
        notes: sanitizePlainText(notes, 1000) || null,
        support_url: cleanUrl,
      });
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs">
        <div className="w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {mode === 'add' ? 'Add to Vault' : 'Edit Vault Item'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors touch-manipulation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="overflow-y-auto px-5 py-4 space-y-4">
            {/* Quick Camera OCR Banner */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-700 min-w-0">
                <Camera className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="truncate">Scan photo of bill, strip or card</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOcrOpen(true)}
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs touch-manipulation"
              >
                Scan Now
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form id="vault-item-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {ITEM_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 650mg, LG Fridge"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Brand */}
              {(currentCategoryMeta.group === 'consumable' || currentCategoryMeta.group === 'durables') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Brand / Manufacturer (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Samsung, Apple, Cipla"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Renewals Provider & Policy */}
              {currentCategoryMeta.group === 'renewals' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Issuing Provider
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC ERGO, RTO"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Policy / Doc Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. POL-9920194"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Expiry Dates */}
              {category !== 'warranty' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {currentCategoryMeta.dateLabel} *
                    </label>
                    <input
                      type="date"
                      required
                      min="1970-01-01"
                      max="2099-12-31"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Storage Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kitchen Shelf, First Aid Box"
                      value={locationTag}
                      onChange={(e) => setLocationTag(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Warranty Specific */}
              {category === 'warranty' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Warranty End Date *
                      </label>
                      <input
                        type="date"
                        required
                        min="1970-01-01"
                        max="2099-12-31"
                        value={warrantyUntil}
                        onChange={(e) => setWarrantyUntil(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        min="1970-01-01"
                        max="2099-12-31"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Purchase Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 19999"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. S/N 884920"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Support URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Support Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://brand.com/support"
                  value={supportUrl}
                  onChange={(e) => setSupportUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Batch Number */}
              {(category === 'medicine' || category === 'first_aid' || category === 'supplement') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batch / Lot Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B-9938"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </form>
          </div>

          {/* Sticky Mobile Bottom Bar */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3.5 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 sm:h-9 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white transition-colors touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="vault-item-form"
              disabled={isSubmitting}
              className="h-11 sm:h-9 px-6 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50 touch-manipulation"
            >
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Save Item' : 'Update Item'}
            </button>
          </div>
        </div>
      </div>

      <OcrScannerModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onApply={handleApplyOcrData}
      />
    </>
  );
}