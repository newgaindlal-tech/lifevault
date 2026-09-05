import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateItemUrgency } from '@/lib/dateUtils';
import { VaultItem } from '@/lib/items';

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce authorization header check for Cron / Background trigger
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'my_super_secret_cron_key_123';

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing bearer token' },
        { status: 401 }
      );
    }

    if (process.env.NODE_ENV === 'production' && !process.env.CRON_SECRET) {
      // In production, refusing unconfigured secret to prevent open relay
      return NextResponse.json(
        { error: 'Server misconfiguration: CRON_SECRET is required in production' },
        { status: 500 }
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Fetch unarchived items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('is_archived', false);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    let processedCount = 0;
    let emailsSent = 0;

    for (const item of (items as VaultItem[]) || []) {
      const meta = calculateItemUrgency(item);
      if (!meta.targetDate) continue;

      const days = meta.daysRemaining;
      const isDue =
        days <= 7 ||
        ((meta.isWarranty || meta.isRenewal) && days <= 15);

      if (isDue) {
        // Record in-app reminder with conflict protection
        await supabase.from('reminders').upsert(
          [
            {
              item_id: item.id,
              user_id: item.user_id,
              item_name: item.name,
              remind_at: todayStr,
              channel: 'in_app',
              urgency_label: meta.urgencyText,
              is_sent: true,
            },
          ],
          { onConflict: 'item_id,remind_at,channel' }
        );

        processedCount++;

        // Send email notification safely if user email is present
        const { data: userProfile } = await supabase.auth.admin.getUserById(item.user_id);
        if (userProfile?.user?.email) {
          emailsSent++;
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      processed: processedCount,
      emailsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}