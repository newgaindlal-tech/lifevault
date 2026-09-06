'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Trash2, 
  Edit3, 
  Tag, 
  Loader2, 
  ScanLine, 
  MapPin, 
  BadgeCheck, 
  ArrowUpDown, 
  Filter, 
  ExternalLink,
  Check,
  Archive,
  Ban,
  Sparkles,
  Calculator,
  CalendarDays,
  Phone,
  MessageCircle,
  Globe
} from 'lucide-react';

export type Category = 
  | 'Electronics' 
  | 'Medicine' 
  | 'Groceries' 
  | 'Foods'
  | 'Cosmetics'
  | 'Warranty' 
  | 'Subscription' 
  | 'Document' 
  | 'Other';

type SortOption = 'expiry_asc' | 'expiry_desc' | 'name_asc' | 'created_desc';

interface VerifiedBrandMeta {
  name: string | null;
  support_url?: string | null;
  customer_care_phone?: string | null;
  whatsapp_number?: string | null;
}

interface VaultItem {
  id: string;
  user_id: string;
  name: string;
  category: Category;
  expiry_date: string;
  mfg_date?: string | null;
  lifespan_months?: number | null;
  brand?: string | null;
  is_verified_brand?: boolean;
  notes?: string | null;
  created_at: string;
}

const CATEGORIES: readonly ['All', ...Category[]] = [
  'All',
  'Electronics',
  'Groceries',
  'Foods',
  'Cosmetics',
  'Medicine',
  'Warranty',
  'Subscription',
  'Document',
  'Other',
];

const sortLabels: Record<SortOption, string> = {
  expiry_asc: 'Expiry: Earliest first',
  expiry_desc: 'Expiry: Furthest first',
  name_asc: 'Name: A to Z',
  created_desc: 'Recently Added',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [items, setItems] = useState<VaultItem[]>([]);
  const [verifiedBrandsMap, setVerifiedBrandsMap] = useState<Record<string, VerifiedBrandMeta>>({});
  const [loading, setLoading] = useState(true);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusTab, setStatusTab] = useState<'all' | 'expiring' | 'expired' | 'valid'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('expiry_asc');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Modal State (Add + Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<Category>('Electronics');
  const [notes, setNotes] = useState('');

  // Expiry Mode & Calculation Fields
  const [expiryMode, setExpiryMode] = useState<'direct' | 'best_before'>('direct');
  const [mfgDate, setMfgDate] = useState('');
  const [bestBeforeMonths, setBestBeforeMonths] = useState<string>('6');
  const [expiryDate, setExpiryDate] = useState('');

  // 1. Initial Load
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [itemsRes, brandsRes] = await Promise.all([
          supabase
            .from('items')
            .select('*')
            .eq('user_id', user.id)
            .order('expiry_date', { ascending: true }),
          supabase
            .from('verified_brands')
            .select('name, support_url, customer_care_phone, whatsapp_number')
            .eq('is_active', true),
        ]);

        if (!cancelled) {
          if (itemsRes.data) {
            setItems(itemsRes.data as VaultItem[]);
          }
          if (brandsRes.data) {
            const map: Record<string, VerifiedBrandMeta> = {};
            (brandsRes.data as VerifiedBrandMeta[]).forEach((b: VerifiedBrandMeta) => {
              if (b.name) {
                map[b.name.trim().toLowerCase()] = b;
              }
            });
            setVerifiedBrandsMap(map);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error('Error fetching dashboard data:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  // 2. Safe reload trigger
  const refreshItems = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true });

      if (!error && data) {
        setItems(data as VaultItem[]);
      }
    } catch (err: unknown) {
      console.error('Error refreshing items:', err);
    }
  }, [user, supabase]);

  // Compute calculated expiry date during render
  const calculatedExpiryDate = useMemo(() => {
    if (expiryMode !== 'best_before' || !mfgDate) {
      return '';
    }

    const months = Number.parseInt(bestBeforeMonths, 10);
    const mfg = new Date(`${mfgDate}T00:00:00`);

    if (!Number.isInteger(months) || months <= 0 || Number.isNaN(mfg.getTime())) {
      return '';
    }

    mfg.setMonth(mfg.getMonth() + months);

    return mfg.toISOString().split('T')[0];
  }, [expiryMode, mfgDate, bestBeforeMonths]);

  const effectiveExpiryDate = expiryMode === 'best_before' ? calculatedExpiryDate : expiryDate;

  // Open Modal in Edit Mode
  const handleOpenEdit = (item: VaultItem) => {
    setEditingItemId(item.id);
    setName(item.name || '');
    setBrand(item.brand || '');
    setCategory(item.category);
    setMfgDate(item.mfg_date ? item.mfg_date.split('T')[0] : '');
    setExpiryDate(item.expiry_date ? item.expiry_date.split('T')[0] : '');
    
    if (item.lifespan_months) {
      setBestBeforeMonths(item.lifespan_months.toString());
      setExpiryMode('best_before');
    } else {
      setBestBeforeMonths('6');
      setExpiryMode('direct');
    }

    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Open Modal in Add Mode
  const handleOpenAdd = () => {
    setEditingItemId(null);
    setName('');
    setBrand('');
    setCategory('Electronics');
    setMfgDate('');
    setBestBeforeMonths('6');
    setExpiryDate('');
    setExpiryMode('direct');
    setNotes('');
    setIsModalOpen(true);
  };

  // Simulated OCR Scanner
  const handleSimulateOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningOCR(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      const detectedName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setName(detectedName || 'Scanned Receipt Item');
      
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setExpiryDate(nextYear.toISOString().split('T')[0]);
      setExpiryMode('direct');
      setNotes('Details extracted via OCR Bill Scanner.');
    } catch {
      alert('OCR reading failed. Please enter details manually.');
    } finally {
      setIsScanningOCR(false);
    }
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !effectiveExpiryDate) {
      alert('Please provide a product name and valid expiry date.');
      return;
    }
    setSubmitting(true);

    const brandKey = brand.trim().toLowerCase();
    const isVerified = brandKey in verifiedBrandsMap;

    const payload: Record<string, unknown> = {
      name: name.trim(),
      brand: brand.trim() || null,
      is_verified_brand: isVerified,
      category,
      expiry_date: effectiveExpiryDate,
      mfg_date: mfgDate.trim() || null,
      lifespan_months: expiryMode === 'best_before' ? parseInt(bestBeforeMonths, 10) || null : null,
      notes: notes.trim() || null,
    };

    try {
      if (editingItemId) {
        const { error } = await supabase
          .from('items')
          .update(payload)
          .eq('id', editingItemId);

        if (error) throw new Error(error.message || 'Update failed');
      } else {
        const { error } = await supabase
          .from('items')
          .insert([{ ...payload, user_id: user.id }]);

        if (error) throw new Error(error.message || 'Insert failed');
      }

      setIsModalOpen(false);
      await refreshItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Supabase Save Error Details:', message, err);
      alert(`Supabase Error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete from Modal
  const handleDeleteFromModal = async () => {
    if (!editingItemId) return;
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('items').delete().eq('id', editingItemId);
      if (!error) {
        setItems((prev) => prev.filter((item) => item.id !== editingItemId));
        setIsModalOpen(false);
      } else {
        alert(error.message);
      }
    } catch (err: unknown) {
      console.error('Error deleting record:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Category Actions
  const getCategoryAction = (cat: Category) => {
    switch (cat) {
      case 'Foods':
      case 'Groceries':
        return {
          label: 'Consumed',
          confirmMsg: `Mark "${name}" as consumed/eaten?`,
          icon: <Check className="h-3.5 w-3.5" aria-hidden="true" />,
          bgColor: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/80',
        };
      case 'Medicine':
        return {
          label: 'Course Finished',
          confirmMsg: `Mark medicine "${name}" course as completed?`,
          icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
          bgColor: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200/80',
        };
      case 'Cosmetics':
        return {
          label: 'Used Up',
          confirmMsg: `Mark cosmetic "${name}" as completely used up?`,
          icon: <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />,
          bgColor: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200/80',
        };
      case 'Subscription':
        return {
          label: 'Cancelled',
          confirmMsg: `Mark subscription for "${name}" as cancelled/ended?`,
          icon: <Ban className="h-3.5 w-3.5" aria-hidden="true" />,
          bgColor: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200',
        };
      case 'Electronics':
      case 'Warranty':
        return {
          label: 'Replaced / Sold',
          confirmMsg: `Remove "${name}" as replaced, sold, or decommissioned?`,
          icon: <Archive className="h-3.5 w-3.5" aria-hidden="true" />,
          bgColor: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/80',
        };
      default:
        return {
          label: 'Archived',
          confirmMsg: `Archive or close "${name}"?`,
          icon: <Archive className="h-3.5 w-3.5" aria-hidden="true" />,
          bgColor: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200',
        };
    }
  };

  const handleSmartDismiss = async () => {
    if (!editingItemId) return;
    const action = getCategoryAction(category);
    if (!confirm(action.confirmMsg)) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('items').delete().eq('id', editingItemId);
      if (!error) {
        setItems((prev) => prev.filter((item) => item.id !== editingItemId));
        setIsModalOpen(false);
      } else {
        alert(error.message);
      }
    } catch (err: unknown) {
      console.error('Error closing record:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Expiry Calculations
  const getExpiryDetails = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exp = new Date(dateStr);
    exp.setHours(0, 0, 0, 0);

    const diffMs = exp.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      const label = absDays === 1 ? 'Expired yesterday' : `Expired ${absDays} days ago`;
      return {
        tag: 'Expired',
        detailText: label,
        badgeColor: 'bg-red-50 text-red-700 border-red-200',
        textColor: 'text-red-600 font-semibold',
        type: 'expired' as const,
      };
    }

    if (diffDays === 0) {
      return {
        tag: 'Expires Today',
        detailText: 'Expiring today!',
        badgeColor: 'bg-amber-500 text-white border-amber-600 animate-pulse',
        textColor: 'text-amber-600 font-bold',
        type: 'expiring' as const,
      };
    }

    if (diffDays === 1) {
      return {
        tag: 'Expires Tomorrow',
        detailText: 'Expires tomorrow',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-300',
        textColor: 'text-amber-600 font-medium',
        type: 'expiring' as const,
      };
    }

    if (diffDays <= 30) {
      return {
        tag: `${diffDays} days left`,
        detailText: `Expires in ${diffDays} days`,
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        textColor: 'text-amber-600 font-medium',
        type: 'expiring' as const,
      };
    }

    const months = Math.floor(diffDays / 30);
    const remDays = diffDays % 30;
    const detailText = months > 0 
      ? `Expires in ${months} mo${months > 1 ? 's' : ''}${remDays > 0 ? `, ${remDays} d` : ''}`
      : `Expires in ${diffDays} days`;

    return {
      tag: 'Healthy',
      detailText,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      textColor: 'text-slate-600',
      type: 'valid' as const,
    };
  };

  // Metrics
  const metrics = useMemo(() => {
    let expired = 0;
    let expiring = 0;
    let valid = 0;

    items.forEach((item) => {
      const exp = getExpiryDetails(item.expiry_date);
      if (exp.type === 'expired') expired++;
      else if (exp.type === 'expiring') expiring++;
      else valid++;
    });

    return { total: items.length, expired, expiring, valid };
  }, [items]);

  // Filter & Sort
  const processedItems = useMemo(() => {
    return items
      .filter((item) => {
        const itemCat = (item.category || '').trim().toLowerCase();
        const itemName = (item.name || '').toLowerCase();
        const itemBrand = (item.brand || '').toLowerCase();
        const query = searchQuery.trim().toLowerCase();

        const matchesSearch =
          itemName.includes(query) ||
          itemBrand.includes(query) ||
          itemCat.includes(query);

        const matchesCategory =
          selectedCategory === 'All' ||
          itemCat === selectedCategory.trim().toLowerCase();

        const exp = getExpiryDetails(item.expiry_date);
        const matchesStatus = statusTab === 'all' || exp.type === statusTab;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry_asc') return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
        if (sortBy === 'expiry_desc') return new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime();
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0;
      });
  }, [items, searchQuery, selectedCategory, statusTab, sortBy]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-1 sm:px-0 pb-16">
      {/* Top Banner (Mobile Compact + Clean) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">LifeVault Dashboard</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
              <BadgeCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" /> RLS Protected
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 sm:line-clamp-none">
            Track real-time expiry dates, manufacturing lifespans, official customer care, and WhatsApp channels.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Metrics Grid: 2x2 Clean Grid on Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total</span>
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" aria-hidden="true" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{metrics.total}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Soon</span>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" aria-hidden="true" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{metrics.expiring}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-red-600 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Expired</span>
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" aria-hidden="true" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{metrics.expired}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Safe</span>
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" aria-hidden="true" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{metrics.valid}</p>
        </div>
      </div>

      {/* Controls: Search, Responsive Filters & Custom Sort */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product name, brand, or tag..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Status Pills & Sort Bar (Mobile Responsive Stack) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Status Tabs (Segmented control) */}
          <div className="grid grid-cols-4 p-1 bg-slate-100/90 rounded-xl gap-0.5">
            {(['all', 'expiring', 'expired', 'valid'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`text-[11px] sm:text-xs font-semibold py-1.5 rounded-lg capitalize text-center transition-all ${
                  statusTab === tab
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'all' ? 'All' : tab}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="w-full sm:w-auto inline-flex items-center justify-between gap-2 px-3 py-2 sm:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors min-w-42.5"
            >
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate">{sortLabels[sortBy]}</span>
              </div>
              <span className={`transition-transform duration-200 text-slate-400 text-[10px] shrink-0 ${isSortOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isSortOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsSortOpen(false)} 
                />
                <div className="absolute right-0 mt-1.5 w-full sm:w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-40 p-1 divide-y divide-slate-50">
                  {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSortBy(option);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                        sortBy === option
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{sortLabels[option]}</span>
                      {sortBy === option && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Categories Bar: Horizontal Smooth Scroll without Ugly Scrollbars */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center">
            <Filter className="h-3 w-3 mr-1" aria-hidden="true" /> Cat:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-xl shrink-0 font-medium transition-all active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items List (Mobile-Optimized Clean Card Layout) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" aria-hidden="true" />
            <p className="text-xs font-medium">Fetching records...</p>
          </div>
        ) : processedItems.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Package className="h-10 w-10 mx-auto mb-3 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">No records found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || selectedCategory !== 'All'
                ? `No items found under category "${selectedCategory}".`
                : 'Add a product or medicine to monitor its expiry.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {processedItems.map((item) => {
              const exp = getExpiryDetails(item.expiry_date);
              const searchTarget = item.brand ? `${item.brand} service centre near me` : `${item.name} repair service near me`;
              const brandMeta = item.brand ? verifiedBrandsMap[item.brand.trim().toLowerCase()] : null;

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-5 flex flex-col gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Card Header: Name + Badges + Status Tag & Edit Button */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-sm sm:text-base text-slate-900">{item.name}</span>

                        {item.brand && (
                          <span className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                            {item.brand}
                            {brandMeta && (
                              <BadgeCheck 
                                className="h-3 w-3 ml-1 text-blue-600" 
                                role="img" 
                                aria-label="Verified Brand" 
                              />
                            )}
                          </span>
                        )}

                        <span className="inline-flex items-center text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                          <Tag className="h-2.5 w-2.5 mr-1 text-slate-400" aria-hidden="true" />
                          {item.category}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-500 line-clamp-1">{item.notes}</p>
                      )}
                    </div>

                    {/* Top Right Action: Status Pill + Edit Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${exp.badgeColor}`}>
                        {exp.tag}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all active:scale-95"
                        title="Edit Item"
                      >
                        <Edit3 className="h-3 w-3 text-slate-500" />
                        <span className="text-[11px]">Edit</span>
                      </button>
                    </div>
                  </div>

                  {/* Dates Row (Mfg Date + Expiry Date) */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                    {item.mfg_date && (
                      <span className="flex items-center text-slate-600">
                        <CalendarDays className="h-3.5 w-3.5 mr-1 text-slate-400" aria-hidden="true" />
                        Mfg: <span className="ml-1 font-medium text-slate-800">{new Date(item.mfg_date).toLocaleDateString()}</span>
                        {item.lifespan_months && (
                          <span className="ml-1 text-[10px] bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-600">
                            ({item.lifespan_months} mos)
                          </span>
                        )}
                        <span className="mx-2 text-slate-300">•</span>
                      </span>
                    )}

                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" aria-hidden="true" />
                      Expiry: <span className="ml-1 font-medium text-slate-800">{new Date(item.expiry_date).toLocaleDateString()}</span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span className={exp.textColor}>({exp.detailText})</span>
                    </span>
                  </div>

                  {/* Customer Care Channels Bar: Scrollable on Small Mobile */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(searchTarget)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center shrink-0 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-lg font-medium text-[11px] border border-slate-200/70 transition-colors"
                    >
                      <MapPin className="h-3 w-3 mr-1 text-emerald-600" aria-hidden="true" />
                      Nearby Centre
                      <ExternalLink className="h-2.5 w-2.5 ml-1 text-slate-400" aria-hidden="true" />
                    </a>

                    {brandMeta?.support_url && (
                      <a
                        href={brandMeta.support_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center shrink-0 text-blue-700 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 px-2 py-1 rounded-lg font-medium text-[11px] border border-blue-200/70 transition-colors"
                      >
                        <Globe className="h-3 w-3 mr-1 text-blue-600" aria-hidden="true" />
                        Official Support
                      </a>
                    )}

                    {brandMeta?.customer_care_phone && (
                      <a
                        href={`tel:${brandMeta.customer_care_phone}`}
                        className="inline-flex items-center shrink-0 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg font-medium text-[11px] border border-slate-200/80 transition-colors"
                      >
                        <Phone className="h-3 w-3 mr-1 text-slate-500" aria-hidden="true" />
                        Call
                      </a>
                    )}

                    {brandMeta?.whatsapp_number && (
                      <a
                        href={`https://wa.me/${brandMeta.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello, I need customer support for my ${item.name}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center shrink-0 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg font-medium text-[11px] border border-emerald-200 transition-colors"
                      >
                        <MessageCircle className="h-3 w-3 mr-1 text-emerald-600" aria-hidden="true" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal (Mobile Bottom-Sheet Style & Scrollable) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingItemId ? 'Edit Product Record' : 'Add New Record'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {editingItemId ? 'Update details, manufacturing date, or dismiss item' : 'Scan a bill or type manually'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold p-1"
              >
                Close
              </button>
            </div>

            {!editingItemId && (
              <div className="bg-emerald-50/50 border border-dashed border-emerald-300 rounded-xl p-3 text-center">
                <label className="cursor-pointer flex flex-col items-center justify-center space-y-1">
                  {isScanningOCR ? (
                    <div className="flex items-center space-x-2 text-emerald-700 text-xs font-medium py-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Reading Bill / Invoice...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-semibold">
                        <ScanLine className="h-4 w-4" aria-hidden="true" />
                        <span>Upload Bill / Invoice (Auto OCR)</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Upload invoice photo or receipt to auto-fill details
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleSimulateOCR}
                    disabled={isScanningOCR}
                  />
                </label>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product / Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name || ''}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rice Bag, Shampoo, Face Cream"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand / Shop <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={brand || ''}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Amul, Nivea, Local Mart"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Foods">Foods</option>
                  <option value="Cosmetics">Cosmetics</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Warranty">Warranty</option>
                  <option value="Subscription">Subscription</option>
                  <option value="Document">Document</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Manufacturing & Smart Expiry Mode Switcher */}
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5 text-emerald-600" />
                    Expiry Determination
                  </span>
                  
                  <div className="grid grid-cols-2 p-0.5 bg-slate-200/70 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setExpiryMode('direct')}
                      className={`px-2 py-1 rounded-md text-center transition-all ${
                        expiryMode === 'direct'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Exact Expiry
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiryMode('best_before')}
                      className={`px-2 py-1 rounded-md text-center transition-all ${
                        expiryMode === 'best_before'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Best Before
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Manufacturing Date <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={mfgDate || ''}
                      onChange={(e) => setMfgDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {expiryMode === 'best_before' ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Use Within / Best Before
                      </label>
                      <select
                        value={bestBeforeMonths}
                        onChange={(e) => setBestBeforeMonths(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="1">1 Month</option>
                        <option value="2">2 Months</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months (Half year)</option>
                        <option value="9">9 Months</option>
                        <option value="12">12 Months (1 Year)</option>
                        <option value="18">18 Months (1.5 Years)</option>
                        <option value="24">24 Months (2 Years)</option>
                        <option value="36">36 Months (3 Years)</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Exact Expiry Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={expiryDate || ''}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                {expiryMode === 'best_before' && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-medium text-[11px]">Calculated Date:</span>
                    <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                      {calculatedExpiryDate ? new Date(calculatedExpiryDate).toLocaleDateString() : 'Select Mfg Date'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Batch No. / Bill Details
                </label>
                <textarea
                  rows={2}
                  value={notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Batch number, shop details, or receipt note..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Official Brand Support Hub inside Modal */}
              {(() => {
                const currentBrandMeta = brand.trim() ? verifiedBrandsMap[brand.trim().toLowerCase()] : null;
                if (!currentBrandMeta || (!currentBrandMeta.customer_care_phone && !currentBrandMeta.whatsapp_number && !currentBrandMeta.support_url)) {
                  return null;
                }

                return (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BadgeCheck className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900">
                          {currentBrandMeta.name || brand} Official Support
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {currentBrandMeta.whatsapp_number && (
                        <a
                          href={`https://wa.me/${currentBrandMeta.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hello, I need customer support for my ${name || 'product'}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-semibold shadow-2xs transition-all"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <span>WhatsApp Care</span>
                        </a>
                      )}

                      {currentBrandMeta.customer_care_phone && (
                        <a
                          href={`tel:${currentBrandMeta.customer_care_phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-all"
                        >
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          <span>Call: {currentBrandMeta.customer_care_phone}</span>
                        </a>
                      )}

                      {currentBrandMeta.support_url && (
                        <a
                          href={currentBrandMeta.support_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold shadow-2xs transition-all"
                        >
                          <Globe className="h-3.5 w-3.5 text-blue-600" />
                          <span>Official Portal</span>
                          <ExternalLink className="h-3 w-3 text-blue-400 ml-0.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {editingItemId ? (
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const action = getCategoryAction(category);
                      return (
                        <button
                          type="button"
                          onClick={handleSmartDismiss}
                          disabled={isDeleting || submitting}
                          className={`inline-flex items-center gap-1 px-2.5 py-2 border rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${action.bgColor}`}
                        >
                          {action.icon}
                          <span className="truncate max-w-20 sm:max-w-none">{action.label}</span>
                        </button>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={handleDeleteFromModal}
                      disabled={isDeleting || submitting}
                      className="inline-flex items-center gap-1 px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                ) : (
                  <div />
                )}

                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || isScanningOCR || isDeleting}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span>{editingItemId ? 'Update' : 'Save'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}