import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY missing' },
        { status: 500 }
      );
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Purge user files from vault_documents bucket
    const { data: fileList } = await adminClient.storage
      .from('vault_documents')
      .list(userId);

    if (fileList && fileList.length > 0) {
      const pathsToDelete = fileList.map((f) => `${userId}/${f.name}`);
      await adminClient.storage.from('vault_documents').remove(pathsToDelete);
    }

    // Delete identity from auth.users (cascades to profile)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to complete account deletion' }, { status: 500 });
  }
}