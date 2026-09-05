'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ItemDocument } from '@/types';
import {
  fetchItemDocuments,
  uploadDocument,
  deleteDocument,
} from '@/lib/documents';
import {
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface DocumentManagerProps {
  itemId: string;
}

type DocumentPayload = Partial<ItemDocument> & {
  signedUrl?: string | null;
  signed_url?: string | null;
  file_size_bytes?: number | string | null;
  size_bytes?: number | string | null;
  size?: number | string | null;
  uploaded_at?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
};

const normalizeDocument = (doc?: DocumentPayload): ItemDocument => {
  return {
    ...(doc ?? {}),
    file_size_bytes: Number(doc?.file_size_bytes ?? doc?.size_bytes ?? doc?.size ?? 0),
    uploaded_at:
      doc?.uploaded_at ?? doc?.created_at ?? doc?.createdAt ?? new Date().toISOString(),
    signedUrl: doc?.signedUrl ?? doc?.signed_url ?? null,
  } as ItemDocument;
};

export const DocumentManager: React.FC<DocumentManagerProps> = ({ itemId }) => {
  const [documents, setDocuments] = useState<ItemDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDocs = async () => {
      setIsLoading(true);
      try {
        const docs = await fetchItemDocuments(itemId);
        const normalizedDocs: ItemDocument[] = docs.map((doc: DocumentPayload) => normalizeDocument(doc));

        if (isMounted) setDocuments(normalizedDocs);
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load documents');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDocs();
    return () => {
      isMounted = false;
    };
  }, [itemId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsUploading(true);

    try {
      const newDoc = await uploadDocument(itemId, file);
      const normalizedNewDoc: ItemDocument = normalizeDocument(newDoc as DocumentPayload);
      setDocuments((prev) => [normalizedNewDoc, ...prev]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: ItemDocument) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;

    try {
      const record: Parameters<typeof deleteDocument>[0] = {
        id: doc.id,
        user_id: (doc as ItemDocument & { user_id?: string }).user_id ?? '',
        item_id: itemId,
        file_name: doc.file_name,
        file_path: (doc as ItemDocument & { file_path?: string; storage_path?: string }).file_path ?? (doc as ItemDocument & { storage_path?: string }).storage_path ?? doc.file_name,
        file_size: doc.file_size_bytes,
        mime_type: doc.mime_type,
        created_at: doc.uploaded_at,
      };
      await deleteDocument(record);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch {
      alert('Could not delete document.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb > 1000 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Receipts & Attached Documents ({documents.length})
        </h4>

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id={`doc-upload-${itemId}`}
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UploadCloud className="h-3.5 w-3.5" />
          )}
          <span>{isUploading ? 'Uploading...' : 'Attach Receipt / PDF'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-4 text-center text-xs text-slate-400">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
          <FileText className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
          <p className="text-xs font-medium text-slate-600">No receipts or warranties attached yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Upload receipts, warranty cards, or insurance PDFs (up to 10 MB).</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const isPdf = doc.mime_type === 'application/pdf';

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                    isPdf ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {isPdf ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                  </div>

                  <div className="truncate">
                    <span className="block text-xs font-semibold text-slate-800 truncate" title={doc.file_name}>
                      {doc.file_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatFileSize(doc.file_size_bytes)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {doc.signedUrl && (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Open Document"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};