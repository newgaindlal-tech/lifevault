import { supabase } from '@/lib/supabase';
import { ItemCategory } from '@/types';

export interface ItemPayload {
  name: string;
  category: ItemCategory;
  brand?: string | null;
  provider?: string | null;
  expiry_date?: string | null;
  warranty_until?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  serial_number?: string | null;
  batch_number?: string | null;
  location_tag?: string | null;
  renewal_type?: string | null;
  policy_number?: string | null;
  notes?: string | null;
}

export interface VaultItem extends ItemPayload {
  id: string;
  user_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// 1. Fetch all active items for logged-in user
export async function fetchUserItems(): Promise<VaultItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to fetch vault items.');

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vault items:', error);
    throw new Error(error.message);
  }

  return (data as VaultItem[]) || [];
}

// 2. Insert new item
export async function createVaultItem(payload: ItemPayload): Promise<VaultItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to create items.');

  const { data, error } = await supabase
    .from('items')
    .insert([{ ...payload, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating vault item:', error);
    throw new Error(error.message);
  }

  return data as VaultItem;
}

// 3. Update existing item
export async function updateVaultItem(id: string, payload: Partial<ItemPayload>): Promise<VaultItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('items')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating vault item:', error);
    throw new Error(error.message);
  }

  return data as VaultItem;
}

// 4. Delete item
export async function deleteVaultItem(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting vault item:', error);
    throw new Error(error.message);
  }
}