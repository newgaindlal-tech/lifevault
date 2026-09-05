import { NextResponse } from 'next/server';
import { generateDueReminders } from '@/lib/reminders';

/**
 * POST /api/reminders/process
 * Evaluates expiring medicines, warranties, and renewals.
 * Designed to be triggered by cron or manually from the dashboard.
 */
export async function POST() {
  try {
    const result = await generateDueReminders();
    return NextResponse.json({
      status: 'success',
      generatedCount: result.generated,
      activeNotifications: result.notifications.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process reminders';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}