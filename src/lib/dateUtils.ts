import { ItemStatus } from '@/types';
import { VaultItem } from '@/lib/items';

export interface ItemUrgencyMeta {
  targetDate: string | null;
  dateLabel: string;
  daysRemaining: number;
  status: ItemStatus;
  urgencyText: string;
  isWarranty: boolean;
  isRenewal: boolean;
}

/**
 * Parses YYYY-MM-DD string into a localized midnight Date object.
 * Avoids the UTC-offset bug where new Date('2026-09-05') shifts back a day.
 */
export function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Determines target lifecycle date, days remaining, and urgency status
 */
export function calculateItemUrgency(item: VaultItem): ItemUrgencyMeta {
  const isWarranty = item.category === 'warranty';
  const isRenewal = item.category === 'vehicle' || item.category === 'insurance' || item.category === 'document';

  // Primary relevant deadline date
  const targetDateStr = item.warranty_until || item.expiry_date;
  const dateLabel = isWarranty ? 'Warranty Ends' : isRenewal ? 'Renewal Due' : 'Expires';

  if (!targetDateStr) {
    return {
      targetDate: null,
      dateLabel,
      daysRemaining: 9999,
      status: 'safe',
      urgencyText: 'No date specified',
      isWarranty,
      isRenewal,
    };
  }

  const targetDate = parseLocalDate(targetDateStr);
  if (!targetDate) {
    return {
      targetDate: targetDateStr,
      dateLabel,
      daysRemaining: 9999,
      status: 'safe',
      urgencyText: 'Invalid date format',
      isWarranty,
      isRenewal,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let status: ItemStatus = 'safe';
  let urgencyText = '';

  if (diffDays < 0) {
    status = 'expired';
    urgencyText = diffDays === -1 ? 'Expired yesterday' : `Expired ${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    status = 'expiring';
    urgencyText = 'Expires today!';
  } else if (diffDays === 1) {
    status = 'expiring';
    urgencyText = 'Expires tomorrow';
  } else if (diffDays <= 15) {
    status = 'expiring';
    urgencyText = `${diffDays} days left`;
  } else if (diffDays <= 30) {
    // Warranties and Renewals show notice up to 30 days
    status = isWarranty || isRenewal ? 'expiring' : 'safe';
    urgencyText = `${diffDays} days left`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    urgencyText = months === 1 ? '1 month left' : `~${months} months left`;
  } else {
    const years = (diffDays / 365).toFixed(1);
    urgencyText = `~${years} years left`;
  }

  return {
    targetDate: targetDateStr,
    dateLabel,
    daysRemaining: diffDays,
    status,
    urgencyText,
    isWarranty,
    isRenewal,
  };
}