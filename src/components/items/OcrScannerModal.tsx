'use client';

import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { parseOcrText, ExtractedFields } from '@/lib/ocrExtractor';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';

interface OcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: Partial<ExtractedFields>) => void;
}

export const OcrScannerModal: React.FC<OcrScannerModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [reviewedName, setReviewedName] = useState('');
  const [reviewedExpiry, setReviewedExpiry] = useState('');
  const [reviewedBatch, setReviewedBatch] = useState('');
  const [reviewedInvoice, setReviewedInvoice] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image exceeds 10 MB. Please choose a smaller file.');
      return;
    }

    setErrorMessage(null);
    setImagePreview(URL.createObjectURL(file));
    setIsProcessing(true);
    setProgressStatus('Initializing OCR engine...');
    setExtracted(null);

    let worker: Tesseract.Worker | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      worker = await createWorker('eng');

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('OCR engine timed out. Please enter details manually.'));
        }, 20000);
      });

      setProgressStatus('Reading text in photo...');
      const recognitionPromise = worker.recognize(file);

      const ret = (await Promise.race([recognitionPromise, timeoutPromise])) as Tesseract.RecognizeResult;

      if (timeoutId) clearTimeout(timeoutId);

      const parsed = parseOcrText(ret.data.text);
      setExtracted(parsed);

      setReviewedName(parsed.name || '');
      setReviewedExpiry(parsed.expiryDate || '');
      setReviewedBatch(parsed.batchNumber || '');
      setReviewedInvoice(parsed.invoiceNumber || '');
    } catch (err: unknown) {
      console.error('OCR Processing error:', err);
      const msg = err instanceof Error ? err.message : 'Could not scan image cleanly.';
      setErrorMessage(msg);
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Worker termination safe
        }
      }
      setIsProcessing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  };

  const handleConfirmAndApply = () => {
    onApply({
      name: reviewedName.trim() || undefined,
      expiryDate: reviewedExpiry || undefined,
      batchNumber: reviewedBatch.trim() || undefined,
      invoiceNumber: reviewedInvoice.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Scan via Photo</h3>
              <p className="text-[11px] text-slate-500">Fast client-side extraction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!imagePreview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Take Photo Button (Direct Camera Trigger) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl p-6 text-center touch-manipulation transition-all"
              >
                <Camera className="h-8 w-8 text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">Open Camera</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Take photo of box / strip</span>
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelect}
              />

              {/* Gallery / File Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50/40 hover:bg-slate-100 rounded-2xl p-6 text-center touch-manipulation transition-all"
              >
                <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-800">Upload from Gallery</span>
                <span className="text-[11px] text-slate-500 mt-0.5">JPEG, PNG, WebP</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          )}

          {isProcessing && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">{progressStatus}</p>
            </div>
          )}

          {extracted && !isProcessing && (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Verify all scanned details before applying to form.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={reviewedName}
                  onChange={(e) => setReviewedName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={reviewedExpiry}
                    onChange={(e) => setReviewedExpiry(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batch / Lot No.
                  </label>
                  <input
                    type="text"
                    value={reviewedBatch}
                    onChange={(e) => setReviewedBatch(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => {
              setImagePreview(null);
              setExtracted(null);
              setErrorMessage(null);
            }}
            disabled={isProcessing || !imagePreview}
            className="text-xs text-slate-600 font-semibold disabled:opacity-30 touch-manipulation"
          >
            Retake
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 sm:h-9 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing || !extracted}
              onClick={handleConfirmAndApply}
              className="h-11 sm:h-9 px-5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 touch-manipulation flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};