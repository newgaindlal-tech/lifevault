import { supabase } from '@/lib/supabase';
import { ItemDocument } from '@/types';

const BUCKET_NAME = 'item-documents';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Compresses an image client-side via HTML5 canvas before uploading.
 * Leaves PDFs untouched.
 */
async function compressImageIfApplicable(file: File): Promise<Blob | File> {
  if (file.type === 'application/pdf') return file;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Restrict max resolution dimension to 1600px
      const maxDim = 1600;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        'image/jpeg',
        0.82 // 82% quality delivers sharp receipt text at ~250KB
      );
    };
    img.onerror = () => resolve(file);
  });
}

// 1. Fetch documents associated with an item
export async function fetchItemDocuments(itemId: string): Promise<ItemDocument[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('item_documents')
    .select('*')
    .eq('item_id', itemId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error(error.message);
  }

  const docs = (data as ItemDocument[]) || [];

  // Generate safe temporary signed URLs for each file (valid for 60 mins)
  const docsWithSignedUrls = await Promise.all(
    docs.map(async (doc) => {
      const { data: urlData } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(doc.file_path, 3600);

      return {
        ...doc,
        signedUrl: urlData?.signedUrl || undefined,
      };
    })
  );

  return docsWithSignedUrls;
}

// 2. Upload a new document and register in PostgreSQL
export async function uploadItemDocument(itemId: string, file: File): Promise<ItemDocument> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  // File type validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, WebP, and PDF documents are allowed.');
  }

  // File size validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds the 10 MB size limit.');
  }

  // Compress photo before uploading
  const uploadPayload = await compressImageIfApplicable(file);

  // Secure isolated path: userId/itemId/timestamp-filename
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${user.id}/${itemId}/${Date.now()}-${cleanFileName}`;

  // Upload to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, uploadPayload, {
      contentType: file.type,
      upsert: false,
    });

  if (storageError) {
    console.error('Storage upload error:', storageError);
    throw new Error(`Upload failed: ${storageError.message}`);
  }

  // Register file metadata in item_documents table
  const { data: docRecord, error: dbError } = await supabase
    .from('item_documents')
    .insert([
      {
        item_id: itemId,
        user_id: user.id,
        file_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
      },
    ])
    .select()
    .single();

  if (dbError) {
    // If DB insert fails, cleanup orphaned file in storage
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    throw new Error(`Database record failed: ${dbError.message}`);
  }

  // Generate immediate signed URL for display
  const { data: urlData } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600);

  return {
    ...(docRecord as ItemDocument),
    signedUrl: urlData?.signedUrl,
  };
}

// 3. Delete a document from Storage and Database
export async function deleteItemDocument(documentId: string, storagePath: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  // Delete from Storage first
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (storageError) {
    console.warn('Storage delete warning:', storageError);
  }

  // Delete record from DB
  const { error: dbError } = await supabase
    .from('item_documents')
    .delete()
    .eq('id', documentId);

  if (dbError) {
    throw new Error(dbError.message);
  }
}