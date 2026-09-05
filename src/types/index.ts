// Core Domain Types for LifeVault Items, Documents & Reminders

export type ItemCategory =
  | 'medicine'
  | 'first_aid'
  | 'grocery'
  | 'supplement'
  | 'cosmetic'
  | 'warranty'
  | 'vehicle'
  | 'insurance'
  | 'document'
  | 'general';

export type ItemStatus = 'safe' | 'expiring' | 'expired';

export interface ItemCategoryMeta {
  id: ItemCategory;
  label: string;
  group: 'consumable' | 'durables' | 'renewals' | 'other';
  dateLabel: string;
  requiresExpiry: boolean;
  requiresWarranty: boolean;
  requiresRenewal: boolean;
}

export const ITEM_CATEGORIES: ItemCategoryMeta[] = [
  { id: 'medicine', label: 'Medicine', group: 'consumable', dateLabel: 'Expiry Date', requiresExpiry: true, requiresWarranty: false, requiresRenewal: false },
  { id: 'first_aid', label: 'First Aid', group: 'consumable', dateLabel: 'Expiry Date', requiresExpiry: true, requiresWarranty: false, requiresRenewal: false },
  { id: 'grocery', label: 'Food & Grocery', group: 'consumable', dateLabel: 'Best Before / Expiry', requiresExpiry: true, requiresWarranty: false, requiresRenewal: false },
  { id: 'supplement', label: 'Supplement', group: 'consumable', dateLabel: 'Expiry Date', requiresExpiry: true, requiresWarranty: false, requiresRenewal: false },
  { id: 'cosmetic', label: 'Cosmetic / Skincare', group: 'consumable', dateLabel: 'Expiry Date', requiresExpiry: true, requiresWarranty: false, requiresRenewal: false },
  { id: 'warranty', label: 'Electronics / Appliance', group: 'durables', dateLabel: 'Warranty End Date', requiresExpiry: false, requiresWarranty: true, requiresRenewal: false },
  { id: 'vehicle', label: 'Vehicle (PUC/Service)', group: 'renewals', dateLabel: 'Renewal Date', requiresExpiry: false, requiresWarranty: false, requiresRenewal: true },
  { id: 'insurance', label: 'Insurance Policy', group: 'renewals', dateLabel: 'Policy Expiry Date', requiresExpiry: false, requiresWarranty: false, requiresRenewal: true },
  { id: 'document', label: 'Official Document', group: 'renewals', dateLabel: 'Validity / Expiry Date', requiresExpiry: false, requiresWarranty: false, requiresRenewal: true },
  { id: 'general', label: 'Other', group: 'other', dateLabel: 'Target Date', requiresExpiry: false, requiresWarranty: false, requiresRenewal: false },
];

export interface ItemDocument {
  id: string;
  item_id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_at: string;
  signedUrl?: string;
}

export type ReminderChannel = 'in_app' | 'email';

export interface ReminderNotification {
  id: string;
  item_id: string;
  user_id: string;
  item_name: string;
  remind_at: string;
  channel: ReminderChannel;
  urgency_label: string;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
}