'use client';

import React, { useState, useEffect } from 'react';
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
  const [category, setCategory] = useState<ItemCategory>('medicine');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [provider, setProvider] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [warrantyUntil, setWarrantyUntil] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [renewalType, setRenewalType] = useState('');
  const [notes, setNotes] = useState('');
  const [supportUrl, setSupportUrl] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  useEffect(() => {
    const resetForm = () => {
      if (initialData && mode === 'edit') {
        setCategory(initialData.category);
        setName(initialData.name || '');
        setBrand(initialData.brand || '');
        setProvider(initialData.provider || '');
        setExpiryDate(initialData.expiry_date || '');
        setWarrantyUntil(initialData.warranty_until || '');
        setPurchaseDate(initialData.purchase_date || '');
        setPurchasePrice(initialData.purchase_price ? String(initialData.purchase_price) : '');
        setSerialNumber(initialData.serial_number || '');
        setBatchNumber(initialData.batch_number || '');
        setLocationTag(initialData.location_tag || '');
        setPolicyNumber(initialData.policy_number || '');
        setRenewalType(initialData.renewal_type || '');
        setNotes(initialData.notes || '');
        setSupportUrl(initialData.support_url || '');
      } else {
        setCategory('medicine');
        setName('');
        setBrand('');
        setProvider('');
        setExpiryDate('');
        setWarrantyUntil('');
        setPurchaseDate('');
        setPurchasePrice('');
        setSerialNumber('');
        setBatchNumber('');
        setLocationTag('');
        setPolicyNumber('');
        setRenewalType('');
        setNotes('');
        setSupportUrl('');
      }
      setFormError(null);
    };
    resetForm();
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const currentCategoryMeta = ITEM_CATEGORIES.find((c) => c.id === category) || ITEM_CATEGORIES[0];

  const handleApplyOcrData = (data: Partial<ExtractedFields>) => {
    if (data.name) setName(sanitizePlainText(data.name, 100));
    if (data.expiryDate && isValidDateString(data.expiryDate)) setExpiryDate(data.expiryDate);
    if (data.batchNumber) setBatchNumber(sanitizePlainText(data.batchNumber, 50));
    if (data.invoiceNumber && !policyNumber) setPolicyNumber(sanitizePlainText(data.invoiceNumber, 50));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = sanitizePlainText(name, 120);
    if (!cleanName) {
      setFormError('Please enter a valid item name.');
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

    // Validate dates are in acceptable ranges
    if (!isValidDateString(expiryDate) || !isValidDateString(warrantyUntil) || !isValidDateString(purchaseDate)) {
      setFormError('One or more dates are invalid. Years must be between 1970 and 2099.');
      return;
    }

    // Price validation
    let parsedPrice: number | null = null;
    if (purchasePrice.trim()) {
      parsedPrice = parseFloat(purchasePrice);
      if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 100000000) {
        setFormError('Purchase price must be a positive number up to 100,000,000.');
        return;
      }
    }

    // URL validation
    let cleanUrl: string | null = null;
    if (supportUrl.trim()) {
      cleanUrl = sanitizeWebUrl(supportUrl);
      if (!cleanUrl) {
        setFormError('Invalid support link. URLs must begin with http:// or https://');
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
      setFormError(err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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

          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Camera className="h-4 w-4 text-emerald-600" />
              <span>Have a receipt, box, or strip? Auto-fill fields via scan.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOcrOpen(true)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Scan Photo
            </button>
          </div>

          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item / Product Name *
              </label>
              <input
                type="text"
                required
                maxLength={120}
                placeholder={
                  category === 'medicine'
                    ? 'e.g. Paracetamol 650mg'
                    : category === 'warranty'
                    ? 'e.g. Microwave Oven 28L'
                    : 'e.g. Health Insurance'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {(currentCategoryMeta.group === 'consumable' || currentCategoryMeta.group === 'durables') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand / Manufacturer (Optional)
                </label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Samsung, Apple, Cipla"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {currentCategoryMeta.group === 'renewals' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issuing Provider / Agency (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="e.g. HDFC ERGO, RTO"
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
                    maxLength={80}
                    placeholder="e.g. POL-9920194"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {category !== 'warranty' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {currentCategoryMeta.dateLabel} *
                  </label>
                  <input
                    type="date"
                    required
                    min="1970-01-01"
                    max="2099-12-31"
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
                    maxLength={80}
                    placeholder="e.g. Top Shelf, First Aid Box"
                    value={locationTag}
                    onChange={(e) => setLocationTag(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

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
                      min="1970-01-01"
                      max="2099-12-31"
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
                      min="1970-01-01"
                      max="2099-12-31"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Purchase Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100000000"
                      placeholder="e.g. 24999.00"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="e.g. S/N 884920412"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Support Link or Service Ticket (Optional)
              </label>
              <input
                type="url"
                maxLength={200}
                placeholder="https://brand.com/support"
                value={supportUrl}
                onChange={(e) => setSupportUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {(category === 'medicine' || category === 'first_aid' || category === 'supplement') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch / Lot Number (Optional)
                </label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="e.g. B-99382"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Remarks (Optional)
              </label>
              <textarea
                rows={2}
                maxLength={1000}
                placeholder="Dosage notes, invoice location..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

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

      <OcrScannerModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onApply={handleApplyOcrData}
      />
    </>
  );
}