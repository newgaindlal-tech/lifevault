'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Tag, 
  Building2, 
  Loader2, 
  Search,
  SlidersHorizontal,
  Lock,
  UserCheck,
  UserX,
  Phone,
  MessageCircle,
  Globe,
  Edit3,
  X
} from 'lucide-react';

interface VerifiedBrand {
  id: string;
  name: string;
  category: string;
  website_url?: string | null;
  support_url?: string | null;
  customer_care_phone?: string | null;
  whatsapp_number?: string | null;
  is_active: boolean;
  created_at: string;
}

interface SystemCategory {
  id: string;
  name: string;
  icon_name?: string;
  created_at: string;
}

export default function AdminControlPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [brands, setBrands] = useState<VerifiedBrand[]>([]);
  const [categories, setCategories] = useState<SystemCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // New Brand Form Fields
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCat, setNewBrandCat] = useState('Electronics');
  const [newBrandUrl, setNewBrandUrl] = useState('');
  const [newBrandPhone, setNewBrandPhone] = useState('');
  const [newBrandWhatsapp, setNewBrandWhatsapp] = useState('');
  const [isAddingBrand, setIsAddingBrand] = useState(false);

  // Edit Brand Modal State
  const [editingBrand, setEditingBrand] = useState<VerifiedBrand | null>(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandCat, setEditBrandCat] = useState('Electronics');
  const [editBrandUrl, setEditBrandUrl] = useState('');
  const [editBrandPhone, setEditBrandPhone] = useState('');
  const [editBrandWhatsapp, setEditBrandWhatsapp] = useState('');
  const [isUpdatingBrand, setIsUpdatingBrand] = useState(false);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // User Management
  const [userIdentifier, setUserIdentifier] = useState('');
  const [isManagingAdmin, setIsManagingAdmin] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [searchBrand, setSearchBrand] = useState('');

  // 1. Role Verification Gate
  useEffect(() => {
    let cancelled = false;

    const verifyAdminAccess = async () => {
      if (!user) {
        router.replace('/admin/login');
        return;
      }

      const hasSessionAuth = sessionStorage.getItem('lifevault_admin_auth') === 'granted';

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        const isAdmin = profile?.is_admin === true || hasSessionAuth;

        if (!isAdmin) {
          if (!cancelled) {
            setIsAuthorized(false);
            router.replace('/admin/login');
          }
          return;
        }

        if (!cancelled) {
          setIsAuthorized(true);
        }
      } catch {
        if (!hasSessionAuth) {
          router.replace('/admin/login');
          return;
        }
        if (!cancelled) setIsAuthorized(true);
      }
    };

    void verifyAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [user, supabase, router]);

  // 2. Fetch directory data
  useEffect(() => {
    if (!isAuthorized) return;

    let cancelled = false;

    const fetchAsync = async () => {
      try {
        const [brandsRes, catRes] = await Promise.all([
          supabase
            .from('verified_brands')
            .select('*')
            .order('name', { ascending: true }),
          supabase
            .from('system_categories')
            .select('*')
            .order('name', { ascending: true }),
        ]);

        if (!cancelled) {
          if (brandsRes.data) setBrands(brandsRes.data as VerifiedBrand[]);
          if (catRes.data) setCategories(catRes.data as SystemCategory[]);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error('Error fetching admin data:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchAsync();

    return () => {
      cancelled = true;
    };
  }, [isAuthorized, supabase]);

  // Promote / Revoke Admin
  const handleSetAdminStatus = async (makeAdmin: boolean) => {
    if (!userIdentifier.trim()) return;
    setIsManagingAdmin(true);
    setAdminActionMsg(null);

    try {
      const { data, error } = await supabase.rpc('set_user_admin_status', {
        target_identifier: userIdentifier.trim(),
        make_admin: makeAdmin,
      });

      if (error) {
        setAdminActionMsg({ type: 'error', text: error.message });
      } else if (data && !data.success) {
        setAdminActionMsg({ type: 'error', text: data.message });
      } else {
        setAdminActionMsg({
          type: 'success',
          text: `${data.email || userIdentifier} is now ${makeAdmin ? 'an Admin' : 'a regular user'}!`,
        });
        setUserIdentifier('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAdminActionMsg({ type: 'error', text: msg });
    } finally {
      setIsManagingAdmin(false);
    }
  };

  // Toggle Brand Status
  const handleToggleBrand = async (brand: VerifiedBrand) => {
    try {
      const { error } = await supabase
        .from('verified_brands')
        .update({ is_active: !brand.is_active })
        .eq('id', brand.id);

      if (!error) {
        setBrands((prev) =>
          prev.map((b) => (b.id === brand.id ? { ...b, is_active: !b.is_active } : b))
        );
      }
    } catch (err: unknown) {
      console.error('Failed to toggle brand status:', err);
    }
  };

  // Open Edit Brand Modal
  const handleOpenBrandEdit = (brand: VerifiedBrand) => {
    setEditingBrand(brand);
    setEditBrandName(brand.name || '');
    setEditBrandCat(brand.category || 'Electronics');
    setEditBrandUrl(brand.support_url || '');
    setEditBrandPhone(brand.customer_care_phone || '');
    setEditBrandWhatsapp(brand.whatsapp_number || '');
  };

  // Save Updated Brand Info
  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editBrandName.trim()) return;
    setIsUpdatingBrand(true);

    const payload = {
      name: editBrandName.trim(),
      category: editBrandCat,
      support_url: editBrandUrl.trim() || null,
      customer_care_phone: editBrandPhone.trim() || null,
      whatsapp_number: editBrandWhatsapp.trim().replace(/[^0-9]/g, '') || null,
    };

    try {
      const { error } = await supabase
        .from('verified_brands')
        .update(payload)
        .eq('id', editingBrand.id);

      if (error) {
        alert(error.message);
      } else {
        setBrands((prev) =>
          prev.map((b) => (b.id === editingBrand.id ? { ...b, ...payload } : b))
        );
        setEditingBrand(null);
      }
    } catch (err: unknown) {
      console.error('Error updating brand details:', err);
    } finally {
      setIsUpdatingBrand(false);
    }
  };

  // Add Brand with Support Links
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setIsAddingBrand(true);

    try {
      const { data, error } = await supabase
        .from('verified_brands')
        .insert([
          {
            name: newBrandName.trim(),
            category: newBrandCat,
            support_url: newBrandUrl.trim() || null,
            customer_care_phone: newBrandPhone.trim() || null,
            whatsapp_number: newBrandWhatsapp.trim().replace(/[^0-9]/g, '') || null,
            is_active: true,
          },
        ])
        .select();

      if (error) {
        alert(error.message);
      } else if (data) {
        setBrands((prev) => [...prev, data[0] as VerifiedBrand].sort((a, b) => a.name.localeCompare(b.name)));
        setNewBrandName('');
        setNewBrandUrl('');
        setNewBrandPhone('');
        setNewBrandWhatsapp('');
      }
    } catch (err: unknown) {
      console.error('Error adding brand:', err);
    } finally {
      setIsAddingBrand(false);
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id: string) => {
    if (!confirm('Are you sure you want to remove this verified brand?')) return;
    try {
      const { error } = await supabase.from('verified_brands').delete().eq('id', id);
      if (!error) {
        setBrands((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err: unknown) {
      console.error('Error deleting brand:', err);
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsAddingCat(true);

    try {
      const { data, error } = await supabase
        .from('system_categories')
        .insert([{ name: newCatName.trim() }])
        .select();

      if (error) {
        alert(error.message);
      } else if (data) {
        setCategories((prev) => [...prev, data[0] as SystemCategory]);
        setNewCatName('');
      }
    } catch (err: unknown) {
      console.error('Error adding category:', err);
    } finally {
      setIsAddingCat(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Remove this category from system defaults?')) return;
    try {
      const { error } = await supabase.from('system_categories').delete().eq('id', id);
      if (!error) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err: unknown) {
      console.error('Error deleting category:', err);
    }
  };

  const handleLockAdmin = () => {
    sessionStorage.removeItem('lifevault_admin_auth');
    router.push('/admin/login');
  };

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(searchBrand.toLowerCase()) ||
      b.category.toLowerCase().includes(searchBrand.toLowerCase())
  );

  if (isAuthorized === null || isAuthorized === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center max-w-sm w-full shadow-sm space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-800">Verifying Security Credentials...</h2>
          <p className="text-xs text-slate-500">Checking admin role and isolation rights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Link
              href="/"
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="h-7 w-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">LifeVault Control Panel</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-9">
            Configure verified manufacturer badges, WhatsApp/Call support, and categories.
          </p>
        </div>

        <div className="flex items-center space-x-2 pl-9 sm:pl-0">
          <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            Admin Mode ({user?.email})
          </span>
          <button
            onClick={handleLockAdmin}
            title="Lock & Exit Admin Mode"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" aria-hidden="true" />
          <p className="text-xs font-medium">Loading control configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Brands Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    Verified Brands & Support Care Directory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Brands show verified badge, official WhatsApp, website and helpline buttons.
                  </p>
                </div>
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchBrand}
                    onChange={(e) => setSearchBrand(e.target.value)}
                    placeholder="Search brand..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Add New Brand Form */}
              <form onSubmit={handleAddBrand} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Add Brand & Customer Care Channels
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Brand name (e.g. Samsung)"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={newBrandCat}
                    onChange={(e) => setNewBrandCat(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Foods">Foods</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Warranty">Warranty</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
                    <input
                      type="url"
                      placeholder="Support website URL"
                      value={newBrandUrl}
                      onChange={(e) => setNewBrandUrl(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Toll-free / Phone no."
                      value={newBrandPhone}
                      onChange={(e) => setNewBrandPhone(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="relative">
                    <MessageCircle className="absolute left-2.5 top-2 h-3 w-3 text-emerald-600" />
                    <input
                      type="text"
                      placeholder="WhatsApp (with country code)"
                      value={newBrandWhatsapp}
                      onChange={(e) => setNewBrandWhatsapp(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isAddingBrand}
                    className="inline-flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isAddingBrand ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    <span>Save Brand & Support Channels</span>
                  </button>
                </div>
              </form>

              {/* Brands Table / List with Edit & Support Channels */}
              <div className="divide-y divide-slate-100 max-h-125 overflow-y-auto">
                {filteredBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleToggleBrand(brand)}
                        className={`p-1 mt-0.5 rounded-md transition-colors ${
                          brand.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'
                        }`}
                        title={brand.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {brand.is_active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-slate-900">{brand.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                            {brand.category}
                          </span>
                        </div>

                        {/* Customer Care Channels Preview */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px]">
                          {brand.support_url && (
                            <a
                              href={brand.support_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline inline-flex items-center gap-0.5"
                            >
                              <Globe className="h-2.5 w-2.5" /> Support Site
                            </a>
                          )}
                          {brand.customer_care_phone && (
                            <span className="text-slate-600 inline-flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5 text-slate-400" /> {brand.customer_care_phone}
                            </span>
                          )}
                          {brand.whatsapp_number && (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-flex items-center gap-0.5">
                              <MessageCircle className="h-2.5 w-2.5 text-emerald-600" /> WhatsApp
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          brand.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {brand.is_active ? 'Active' : 'Disabled'}
                      </span>

                      {/* Edit Brand Button */}
                      <button
                        onClick={() => handleOpenBrandEdit(brand)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Brand & Channels"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Brand Button */}
                      <button
                        onClick={() => handleDeleteBrand(brand.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Brand"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Columns */}
          <div className="space-y-6">
            {/* Grant Admin Role */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Grant Admin Role
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter an email or UUID to grant/revoke admin rights
                </p>
              </div>

              {adminActionMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    adminActionMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {adminActionMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span>{adminActionMsg.text}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <input
                  type="text"
                  placeholder="user@example.com or user-id"
                  value={userIdentifier}
                  onChange={(e) => setUserIdentifier(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAdminStatus(true)}
                    disabled={isManagingAdmin || !userIdentifier.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isManagingAdmin ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5" />
                    )}
                    <span>Make Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetAdminStatus(false)}
                    disabled={isManagingAdmin || !userIdentifier.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    <span>Revoke</span>
                  </button>
                </div>
              </div>
            </div>

            {/* System Categories */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-500" />
                  System Categories
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Available tags for sorting user documents
                </p>
              </div>

              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="New category..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isAddingCat}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isAddingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center space-x-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/70"
                  >
                    <span>{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand Edit Modal */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-emerald-600" />
                  Edit Brand & Support Channels
                </h2>
                <p className="text-xs text-slate-500">
                  Update customer care phone, official website, or WhatsApp for {editingBrand.name}.
                </p>
              </div>
              <button
                onClick={() => setEditingBrand(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBrand} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editBrandName}
                    onChange={(e) => setEditBrandName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editBrandCat}
                    onChange={(e) => setEditBrandCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Foods">Foods</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Warranty">Warranty</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                  Support Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.brand.com/support"
                  value={editBrandUrl}
                  onChange={(e) => setEditBrandUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  Toll-free Helpline / Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1800-40-7267864"
                  value={editBrandPhone}
                  onChange={(e) => setEditBrandPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Official WhatsApp Number (with country code)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 919876543210"
                  value={editBrandWhatsapp}
                  onChange={(e) => setEditBrandWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingBrand}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {isUpdatingBrand ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}