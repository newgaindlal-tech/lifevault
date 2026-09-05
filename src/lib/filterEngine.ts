import { VaultItem } from '@/lib/items';
import { calculateItemUrgency, ItemUrgencyMeta } from '@/lib/dateUtils';

export type StatusFilterType = 'all' | 'expired' | 'expiring' | 'safe' | 'warranty' | 'renewal';
export type SortOptionType = 'urgent_asc' | 'urgent_desc' | 'recent' | 'name_asc' | 'name_desc' | 'category';
export type GroupModeType = 'none' | 'timeline' | 'category';

export interface FilterParams {
  searchQuery: string;
  statusFilter: StatusFilterType;
  categoryFilter: string; // 'all' or specific ItemCategory
  sortBy: SortOptionType;
}

export interface ProcessedItem {
  item: VaultItem;
  meta: ItemUrgencyMeta;
}

export interface ItemGroup {
  id: string;
  title: string;
  count: number;
  badgeVariant?: 'danger' | 'warning' | 'default' | 'info';
  items: ProcessedItem[];
}

/**
 * High-performance search matcher.
 * Matches multi-token queries against name, brand, location, serial number, batch, policy, and notes.
 */
function matchSearchQuery(item: VaultItem, queryTokens: string[]): boolean {
  if (queryTokens.length === 0) return true;

  const searchableText = [
    item.name,
    item.brand || '',
    item.location_tag || '',
    item.serial_number || '',
    item.batch_number || '',
    item.policy_number || '',
    item.provider || '',
    item.notes || '',
  ]
    .join(' ')
    .toLowerCase();

  // All tokens must match (AND condition)
  return queryTokens.every((token) => searchableText.includes(token));
}

/**
 * Filter, sort, and process items
 */
export function filterAndSortItems(items: VaultItem[], params: FilterParams): ProcessedItem[] {
  const queryTokens = params.searchQuery
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // 1. Process items with urgency metadata and filter
  const filtered: ProcessedItem[] = [];

  for (const item of items) {
    // Search matching
    if (!matchSearchQuery(item, queryTokens)) continue;

    // Category matching
    if (params.categoryFilter !== 'all' && item.category !== params.categoryFilter) {
      continue;
    }

    const meta = calculateItemUrgency(item);

    // Status matching
    if (params.statusFilter === 'expired' && meta.status !== 'expired') continue;
    if (params.statusFilter === 'expiring' && meta.status !== 'expiring') continue;
    if (params.statusFilter === 'safe' && meta.status !== 'safe') continue;
    if (params.statusFilter === 'warranty' && !meta.isWarranty) continue;
    if (params.statusFilter === 'renewal' && !meta.isRenewal) continue;

    filtered.push({ item, meta });
  }

  // 2. Multi-strategy sorting
  return filtered.sort((a, b) => {
    switch (params.sortBy) {
      case 'urgent_asc':
        // Most urgent first: expired negative numbers first, then nearest future
        return a.meta.daysRemaining - b.meta.daysRemaining;

      case 'urgent_desc':
        // Furthest deadline first
        return b.meta.daysRemaining - a.meta.daysRemaining;

      case 'recent':
        return new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime();

      case 'name_asc':
        return a.item.name.localeCompare(b.item.name, undefined, { sensitivity: 'base' });

      case 'name_desc':
        return b.item.name.localeCompare(a.item.name, undefined, { sensitivity: 'base' });

      case 'category':
        return a.item.category.localeCompare(b.item.category);

      default:
        return 0;
    }
  });
}

/**
 * Groups processed items by Timeline Urgency or Category
 */
export function groupItems(processed: ProcessedItem[], groupMode: GroupModeType): ItemGroup[] {
  if (groupMode === 'none') {
    return [{ id: 'all', title: 'All Items', count: processed.length, items: processed }];
  }

  if (groupMode === 'timeline') {
    const expired: ProcessedItem[] = [];
    const dueThisWeek: ProcessedItem[] = [];
    const dueThisMonth: ProcessedItem[] = [];
    const safeFuture: ProcessedItem[] = [];
    const noDate: ProcessedItem[] = [];

    processed.forEach((p) => {
      if (!p.meta.targetDate) {
        noDate.push(p);
      } else if (p.meta.status === 'expired') {
        expired.push(p);
      } else if (p.meta.daysRemaining <= 7) {
        dueThisWeek.push(p);
      } else if (p.meta.daysRemaining <= 30) {
        dueThisMonth.push(p);
      } else {
        safeFuture.push(p);
      }
    });

    const groups: ItemGroup[] = [];
    if (expired.length > 0) {
      groups.push({ id: 'expired', title: 'Expired / Overdue', count: expired.length, badgeVariant: 'danger', items: expired });
    }
    if (dueThisWeek.length > 0) {
      groups.push({ id: 'due_week', title: 'Urgent (Due Within 7 Days)', count: dueThisWeek.length, badgeVariant: 'warning', items: dueThisWeek });
    }
    if (dueThisMonth.length > 0) {
      groups.push({ id: 'due_month', title: 'Coming Up (Within 30 Days)', count: dueThisMonth.length, badgeVariant: 'info', items: dueThisMonth });
    }
    if (safeFuture.length > 0) {
      groups.push({ id: 'safe_future', title: 'Safe & Distant Expiries', count: safeFuture.length, badgeVariant: 'default', items: safeFuture });
    }
    if (noDate.length > 0) {
      groups.push({ id: 'no_date', title: 'No Deadline Specified', count: noDate.length, items: noDate });
    }

    return groups;
  }

  if (groupMode === 'category') {
    const map = new Map<string, ProcessedItem[]>();

    processed.forEach((p) => {
      const cat = p.item.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    });

    const groups: ItemGroup[] = [];
    map.forEach((catItems, cat) => {
      groups.push({
        id: cat,
        title: cat.toUpperCase().replace('_', ' '),
        count: catItems.length,
        items: catItems,
      });
    });

    return groups.sort((a, b) => a.title.localeCompare(b.title));
  }

  return [];
}