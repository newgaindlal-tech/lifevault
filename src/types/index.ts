// Core domain types for LifeVault UI representations

export type ItemCategory = 
  | 'medicine' 
  | 'grocery' 
  | 'warranty' 
  | 'renewal' 
  | 'general';

export type ItemStatus = 'safe' | 'expiring' | 'expired';

export interface VaultItemSummary {
  id: string;
  name: string;
  category: ItemCategory;
  expiryDate: string; // ISO format: YYYY-MM-DD
  daysRemaining: number;
  status: ItemStatus;
  notes?: string;
}