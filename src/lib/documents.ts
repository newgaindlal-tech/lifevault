import { supabase } from '@/lib/supabase';

export interface DocumentRecord {
  id: string;
  item_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadDocument(
  itemId: string,
  file: File
): Promise<DocumentRecord> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    throw new Error('You must be logged in to upload attachments.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds maximum allowable size of 5 MB.');
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Unsupported file type. Only JPEG, PNG, WebP, and PDF are allowed.');
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${session.user.id}/${itemId}/${Date.now()}_${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from('vault_documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError.message || uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data, error: dbError } = await supabase
    .from('documents')
    .insert([
      {
        item_id: itemId,
        user_id: session.user.id,
        file_name: sanitizedName,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      },
    ])
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from('vault_documents').remove([filePath]);
    console.error('DB record error:', dbError.message || dbError);
    throw new Error(`Database error: ${dbError.message}`);
  }

  return data as DocumentRecord;
}

export async function fetchItemDocuments(itemId: string): Promise<DocumentRecord[]> {
  if (!itemId) return [];

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    return [];
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('item_id', itemId)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error.message || error.details || JSON.stringify(error));
    return [];
  }

  return (data as DocumentRecord[]) || [];
}

export async function getDocumentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('vault_documents')
    .createSignedUrl(filePath, 300);

  if (error || !data?.signedUrl) {
    throw new Error('Unable to generate secure link');
  }

  return data.signedUrl;
}

export async function deleteDocument(doc: DocumentRecord): Promise<void> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user || session.user.id !== doc.user_id) {
    throw new Error('Unauthorized');
  }

  await supabase.storage.from('vault_documents').remove([doc.file_path]);

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', doc.id)
    .eq('user_id', session.user.id);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}