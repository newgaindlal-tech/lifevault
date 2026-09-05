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

  if (!isOpen) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Safety checks on image
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image exceeds 10 MB. Please choose a smaller image.');
      return;
    }

    setErrorMessage(null);
    setImagePreview(URL.createObjectURL(file));
    setIsProcessing(true);
    setProgressStatus('Initializing optical engine...');
    setExtracted(null);

    let worker: Tesseract.Worker | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      worker = await createWorker('eng');

      // 20-second timeout guard
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('OCR engine timed out. Please enter fields manually.'));
        }, 20000);
      });

      setProgressStatus('Reading text in document...');
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
      const msg = err instanceof Error ? err.message : 'Could not extract text. Please enter values manually.';
      setErrorMessage(msg);
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Ignore termination errors
        }
      }
      setIsProcessing(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Scan Document / Box (Optional OCR)
              </h3>
              <p className="text-[11px] text-slate-500">
                100% private. Text is processed locally on your device.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!imagePreview && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all"
          >
            <UploadCloud className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <span className="block text-sm font-semibold text-slate-700">
              Upload photo of medicine strip, warranty, or receipt
            </span>
            <span className="block text-xs text-slate-400 mt-1">
              Supports JPEG, PNG, WebP (Max 10 MB)
            </span>
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
            <p className="text-xs font-semibold text-slate-700 animate-pulse">
              {progressStatus}
            </p>
          </div>
        )}

        {extracted && !isProcessing && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Verify Data:</strong> Check all critical dates before applying.
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detected Item Name
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={reviewedName}
                  onChange={(e) => setReviewedName(e.target.value)}
                  placeholder="Leave blank or edit..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detected Expiry Date
                  </label>
                  <input
                    type="date"
                    value={reviewedExpiry}
                    onChange={(e) => setReviewedExpiry(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch / Lot Number
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={reviewedBatch}
                    onChange={(e) => setReviewedBatch(e.target.value)}
                    placeholder="e.g. B-994"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <details className="text-[11px] text-slate-500 pt-1">
              <summary className="cursor-pointer font-semibold hover:text-slate-700">
                Show raw scanned text ({extracted.confidenceNotes.length} cues detected)
              </summary>
              <pre className="mt-2 p-2 bg-slate-100 rounded-lg max-h-24 overflow-y-auto whitespace-pre-wrap font-mono text-[10px]">
                {extracted.rawText || 'No clear text detected.'}
              </pre>
            </details>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
          <button
            type="button"
            onClick={() => {
              setImagePreview(null);
              setExtracted(null);
              setErrorMessage(null);
            }}
            disabled={isProcessing || !imagePreview}
            className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30"
          >
            Choose Different Image
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing || !extracted}
              onClick={handleConfirmAndApply}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Apply to Form</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};