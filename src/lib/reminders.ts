import { supabase } from '@/lib/supabase';
import { VaultItem } from '@/lib/items';
import { calculateItemUrgency } from '@/lib/dateUtils';
import { ReminderNotification } from '@/types';

export async function generateDueReminders(): Promise<{
  generated: number;
  notifications: ReminderNotification[];
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { generated: 0, notifications: [] };

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if (itemsError) {
    console.error('Reminder fetch items error:', itemsError);
    return { generated: 0, notifications: [] };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const newRemindersToInsert: Array<{
    item_id: string;
    user_id: string;
    item_name: string;
    remind_at: string;
    channel: 'in_app' | 'email';
    urgency_label: string;
    is_sent: boolean;
  }> = [];

  for (const item of (items as VaultItem[]) || []) {
    const meta = calculateItemUrgency(item);
    if (!meta.targetDate) continue;

    const days = meta.daysRemaining;
    const shouldAlert =
      days <= 15 ||
      ((meta.isWarranty || meta.isRenewal) && days <= 30);

    if (shouldAlert) {
      newRemindersToInsert.push({
        item_id: item.id,
        user_id: user.id,
        item_name: item.name,
        remind_at: todayStr,
        channel: 'in_app',
        urgency_label: meta.urgencyText,
        is_sent: true,
      });
    }
  }

  if (newRemindersToInsert.length > 0) {
    await supabase
      .from('reminders')
      .upsert(newRemindersToInsert, {
        onConflict: 'item_id,remind_at,channel',
        ignoreDuplicates: false, // ताज़ा स्टेटस हमेशा अपडेट रहेगा
      });
  }

  const { data: activeReminders } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50); // अब 6 की जगह 50 तक दिखेंगे

  return {
    generated: newRemindersToInsert.length,
    notifications: (activeReminders as ReminderNotification[]) || [],
  };
}

export async function fetchUserReminders(): Promise<ReminderNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching reminders:', error);
    return [];
  }

  return (data as ReminderNotification[]) || [];
}

export async function deleteReminder(reminderId: string): Promise<void> {
  await supabase.from('reminders').delete().eq('id', reminderId);
}