import { useState, useEffect, useCallback, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  LayoutDashboard, ShoppingBag, Package, Settings,
  LogOut, Search, Bell, DollarSign, Clock, CheckCircle,
  Eye, EyeOff, Plus, Pencil, Trash2, X,
  TrendingUp, RefreshCw, ChevronDown, Ticket, FolderOpen, Save, Check, Stamp,
  Flame, FileSpreadsheet, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchDashboardStats, fetchRecentOrders, fetchTopProducts,
  fetchProducts, updateProduct, deleteProduct,
  fetchOrders, updateOrderStatus, deleteOrder, syncOrderToSheets,
  fetchCategories, deleteCategory,
  fetchPromoCodes, deletePromoCode,
  type DashboardStats, setWatermarkStatusAPI
} from '@/lib/api';
import {
  ConfirmModal,
  getOrderStatusColor,
  getOrderStatusLabel,
  getDeliveryStatusColor,
  getDeliveryStatusFromOrderStatus,
  getDeliveryStatusLabel
} from '@/components/admin/shared';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { PromoFormModal } from '@/components/admin/PromoFormModal';
import { CategoryFormModal } from '@/components/admin/CategoryFormModal';
import { loadStoreSettings, saveStoreSettings, fetchStoreSettingsGlobal } from '@/data/storeSettings';
import { loadHeroSettings, saveHeroSettings, fetchHeroSettingsGlobal } from '@/data/heroSettings';
import { getImageUrl } from '@/lib/utils';
import * as XLSX from 'xlsx';

type TabId = 'dashboard' | 'orders' | 'products' | 'categories' | 'promos' | 'watermark' | 'hero' | 'settings';

const AdminPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [showArchivedProducts, setShowArchivedProducts] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [productModal, setProductModal] = useState<{ open: boolean; product?: any }>({ open: false });
  const [promoModal, setPromoModal] = useState<{ open: boolean; promo?: any }>({ open: false });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category?: any }>({ open: false });
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: any; label?: string } | null>(null);

  const [exportModal, setExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    id: false, date: false, customerName: true, phone: true, city: true, address: true,
    total: false, status: false, items: false, history: false
  });

  // ─── Loaders ────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const statsData = await fetchDashboardStats().catch(err => {
        console.error("Failed to load stats", err);
        return null;
      });
      if (statsData) setStats(statsData);

      const recentOrdersData = await fetchRecentOrders().catch(err => {
        console.error("Failed to load recent orders", err);
        return [];
      });
      if (Array.isArray(recentOrdersData)) setRecentOrders(recentOrdersData);

      const topProductsData = await fetchTopProducts().catch(err => {
        console.error("Failed to load top products", err);
        return [];
      });
      if (Array.isArray(topProductsData)) setTopProducts(topProductsData);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement du tableau de bord");
    }
    setLoading(false);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.set('all', 'true');
      if (searchQuery) p.set('search', searchQuery);
      if (showArchivedProducts) p.set('includeArchived', 'true');
      const data = await fetchProducts(p.toString());
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Impossible de charger les produits");
    }
    setLoading(false);
  }, [searchQuery, showArchivedProducts]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter) p.set('status', statusFilter);
      if (searchQuery) p.set('search', searchQuery);
      if (monthFilter) {
        const [yy, mm] = monthFilter.split('-');
        const y = Number(yy);
        const m = Number(mm);
        if (Number.isFinite(y) && Number.isFinite(m)) {
          p.set('year', String(y));
          p.set('month', String(m));
        }
      }
      const data = await fetchOrders(p.toString());
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Impossible de charger les commandes");
    }
    setLoading(false);
  }, [statusFilter, searchQuery, monthFilter]);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Impossible de charger les catégories");
    }
    setLoading(false);
  }, []);

  const loadPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPromoCodes();
      setPromoCodes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Impossible de charger les codes promo");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial load for sidebar branding
    fetchStoreSettingsGlobal().then(setStoreForm);
  }, []);

  useEffect(() => {
    setSearchQuery(''); setStatusFilter(''); setDeliveryStatusFilter(''); setMonthFilter('');
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'promos') loadPromoCodes();
    
    // Refresh settings when entering relevant tabs
    if (activeTab === 'settings' || activeTab === 'watermark') {
      loadPromoCodes(); // For global coupon selector
      fetchStoreSettingsGlobal().then(setStoreForm);
    }
    if (activeTab === 'hero') {
      fetchHeroSettingsGlobal().then(setHeroForm);
    }
  }, [activeTab, loadCategories, loadDashboard, loadOrders, loadProducts, loadPromoCodes]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (activeTab === 'products') loadProducts();
      if (activeTab === 'orders') loadOrders();
    }, 300); return () => clearTimeout(t);
  }, [activeTab, loadOrders, loadProducts, searchQuery, statusFilter, monthFilter, showArchivedProducts]);

  const handleStatusChange = async (oid: string, status: string) => {
    try { await updateOrderStatus(oid, status); loadOrders(); if (orderDetail?.id === oid) setOrderDetail((p: any) => ({ ...p, status })); } catch (e) { console.error(e); }
  };

  const getVisibleOrders = useCallback(
    () => orders.filter(o => !deliveryStatusFilter || getDeliveryStatusFromOrderStatus(o.status) === deliveryStatusFilter),
    [orders, deliveryStatusFilter]
  );

  const toggleVisibility = async (product: any) => {
    try {
      const id = Number(product.id);
      if (isNaN(id)) return;
      await updateProduct(id, { isVisible: !product.isVisible });
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isVisible: !product.isVisible } : p));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'product') {
        const id = Number(deleteConfirm.id);
        if (isNaN(id)) throw new Error('ID produit invalide');
        
        const result = await deleteProduct(id);
        if (result?.action === 'archived') {
          toast.success(result.message || 'Produit archivé');
        } else {
          toast.success('Produit supprimé avec succès');
        }
        loadProducts();
      }
      else if (deleteConfirm.type === 'order') {
        const result = await deleteOrder(deleteConfirm.id, { removeFromSheets: true });
        if (result?.sheets && result.sheets.removed === false) {
          toast.success('Commande supprimée (Sheets non modifié)');
        } else {
          toast.success('Commande supprimée avec succès');
        }
        loadOrders();
      }
      else if (deleteConfirm.type === 'category') {
        await deleteCategory(deleteConfirm.id);
        toast.success('Catégorie supprimée avec succès');
        loadCategories();
      }
      else if (deleteConfirm.type === 'promo') {
        await deletePromoCode(deleteConfirm.id);
        toast.success('Code promo supprimé avec succès');
        loadPromoCodes();
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors de la suppression');
    }
    setDeleteConfirm(null);
  };

  // ─── Dashboard ──────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#333]">Vue d'ensemble</h2>
        <button onClick={loadDashboard} className="p-2 hover:bg-gray-100 rounded-lg text-[#666]"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Commandes', value: stats?.totalOrders ?? '—', icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
          { label: 'Revenus', value: stats ? `${stats.totalRevenue.toFixed(2)} MAD` : '—', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Vues Totales', value: stats?.totalPageViews ?? '—', icon: Eye, color: 'from-indigo-500 to-indigo-600' },
          { label: 'Visiteurs Uniques', value: stats?.uniqueVisitors ?? '—', icon: TrendingUp, color: 'from-cyan-500 to-cyan-600' },
          { label: 'En attente', value: stats?.pendingOrders ?? '—', icon: Clock, color: 'from-amber-500 to-orange-500' },
          { label: 'En traitement', value: stats?.processingOrders ?? '—', icon: Package, color: 'from-purple-500 to-purple-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-[#999] text-xs font-medium uppercase tracking-wider">{stat.label}</p><p className="text-2xl font-bold text-[#333] mt-1">{stat.value}</p></div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}><stat.icon className="w-6 h-6 text-white" /></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b flex items-center justify-between"><h3 className="font-semibold text-[#333]">Commandes récentes</h3><button onClick={() => setActiveTab('orders')} className="text-[var(--yp-blue)] hover:underline text-sm font-medium">Voir tout →</button></div>
          <div className="divide-y">
            {recentOrders.length === 0 && <div className="p-8 text-center text-[#999]">Aucune commande</div>}
            {recentOrders.slice(0, 5).map(o => (
              <div key={o.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-[#666]" /></div><div><p className="font-medium text-[#333] text-sm">{o.customerName}</p><p className="text-xs text-[#999]">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</p></div></div>
                <div className="text-right"><p className="font-semibold text-[var(--yp-blue)] text-sm">{o.total.toFixed(2)} MAD</p><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b flex items-center justify-between"><h3 className="font-semibold text-[#333]">Produits populaires</h3><button onClick={() => setActiveTab('products')} className="text-[var(--yp-blue)] hover:underline text-sm font-medium">Voir tout →</button></div>
          <div className="divide-y">
            {topProducts.length === 0 && <div className="p-8 text-center text-[#999]">Aucun produit</div>}
            {topProducts.slice(0, 5).map((p, i) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3"><span className="w-8 h-8 bg-[var(--yp-blue)]/10 rounded-lg flex items-center justify-center text-sm font-bold text-[var(--yp-blue)]">{i + 1}</span><div><p className="font-medium text-[#333] text-sm">{p.name}</p><p className="text-xs text-[#999]">{p.salesCount} ventes</p></div></div>
                <div className="text-right"><p className="font-semibold text-[var(--yp-blue)] text-sm">{p.price.toFixed(2)} MAD</p><p className="text-xs text-[#999]">{p.stock} en stock</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Orders ─────────────────────────────────────────────────
  const handleExportOrders = () => {
    const visibleOrders = getVisibleOrders();
    const phoneCounts: Record<string, number> = {};
    visibleOrders.forEach(o => {
      if (o.phone) {
        phoneCounts[o.phone] = (phoneCounts[o.phone] || 0) + 1;
      }
    });

    const data = visibleOrders.map(o => {
      const row: any = {};
      if (exportColumns.id) row['ID'] = o.id.slice(0, 8);
      if (exportColumns.date) row['Date'] = new Date(o.createdAt).toLocaleDateString('fr-FR');
      if (exportColumns.customerName) row['Nom'] = o.customerName;
      if (exportColumns.phone) row['Téléphone'] = o.phone;
      if (exportColumns.city) row['Ville'] = o.city;
      if (exportColumns.address) row['Adresse'] = o.address;
      if (exportColumns.total) row['Total'] = o.total;
      if (exportColumns.status) row['Statut commande'] = getOrderStatusLabel(o.status);
      row['Statut livraison'] = getDeliveryStatusLabel(getDeliveryStatusFromOrderStatus(o.status));
      if (exportColumns.items) {
        const products = o.items?.map((i: any) => `${i.quantity}x ${i.product?.name}`) || [];
        row['Articles'] = products.join(', ');
      }
      if (exportColumns.history) {
        row['Historique (Nb Commandes)'] = o.phone ? phoneCounts[o.phone] : 1;
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commandes");
    XLSX.writeFile(workbook, "commandes_youposh.xlsx");
    setExportModal(false);
  };

  const handleSyncOrder = async (oid: string) => {
    try {
        toast.promise(syncOrderToSheets(oid), {
            loading: 'Synchronisation en cours...',
            success: 'Commande synchronisée avec Google Sheets !',
            error: (err) => `Erreur sync: ${err.message}`
        });
    } catch (e) {
        console.error(e);
    }
  };

  const renderOrders = () => {
    const visibleOrders = getVisibleOrders();
    const now = new Date();
    const monthOptions = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return { key, label };
    });
    const groupedOrders = visibleOrders.reduce((acc: Array<{ key: string; label: string; orders: any[] }>, o: any) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = acc[acc.length - 1];
      if (existing && existing.key === key) {
        existing.orders.push(o);
        return acc;
      }
      acc.push({ key, label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), orders: [o] });
      return acc;
    }, []);
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
              Commandes
              <span className="bg-blue-50 text-blue-600 text-xs py-1 px-2.5 rounded-full font-semibold">
                {visibleOrders.length}
              </span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">Gérez et suivez les commandes de votre boutique</p>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
            <div className="relative flex-grow min-w-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="N°, Nom, Téléphone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[var(--yp-blue)] transition-all bg-gray-50/50 hover:bg-white"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-blue-100 appearance-none pr-9 bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-700"
                >
                  <option value="">Status: Tous</option>
                  <option value="pending">En attente</option>
                  <option value="processing">En traitement</option>
                  <option value="shipped">Confirmée</option>
                  <option value="delivered">Terminée</option>
                  <option value="cancelled">Annulée</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative flex-1 sm:flex-none">
                <select
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-blue-100 appearance-none pr-9 bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-700"
                >
                  <option value="">Mois: Tous</option>
                  {monthOptions.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={deliveryStatusFilter}
                  onChange={e => setDeliveryStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-blue-100 appearance-none pr-9 bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-700"
                >
                  <option value="">Livraison: Tous</option>
                  <option value="not_shipped">Non expédiée</option>
                  <option value="shipped">Expédiée</option>
                  <option value="delivered">Livrée</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() => setExportModal(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 hover:border-emerald-300 flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar relative bg-gray-50/30">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100">
              <tr>
                {['ID', 'Date', 'Client', 'Contact', 'Livraison', 'Total', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Search className="w-12 h-12 mb-3 text-gray-200" />
                      <p className="text-lg font-medium text-gray-600">Aucune commande trouvée</p>
                      <p className="text-sm">Essayez de modifier vos filtres ou termes de recherche.</p>
                    </div>
                  </td>
                </tr>
              )}
              {groupedOrders.map(g => (
                <Fragment key={g.key}>
                  <tr className="bg-gray-50">
                    <td colSpan={8} className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {g.label}
                    </td>
                  </tr>
                  {g.orders.map(o => (
                    <tr key={o.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-medium text-gray-400 bg-gray-50 p-1.5 rounded-md border border-gray-100" title={o.id}>
                      #{o.id.slice(0, 6)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{new Date(o.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                      <span className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                        {o.customerName ? o.customerName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm max-w-[150px] truncate" title={o.customerName}>{o.customerName}</p>
                        <p className="text-xs text-gray-500">{o.items?.length || 0} article(s)</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-700 font-mono tracking-tight">{o.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">{o.city}</span>
                      <span className="text-xs text-gray-500 max-w-[180px] truncate" title={o.address}>{o.address || 'Aucune adresse'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-[var(--yp-blue)] text-base whitespace-nowrap">
                      {o.total.toFixed(2)} MAD
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 items-start">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase border ${getOrderStatusColor(o.status)}`}>
                        {getOrderStatusLabel(o.status)}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${getDeliveryStatusColor(getDeliveryStatusFromOrderStatus(o.status))}`}>
                        {getDeliveryStatusLabel(getDeliveryStatusFromOrderStatus(o.status))}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setOrderDetail(o)}
                        className="p-2 bg-gray-50 hover:bg-blue-100 rounded-xl text-gray-500 hover:text-blue-700 transition-colors border border-gray-100 hover:border-blue-200 shadow-sm"
                        title="Détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {o.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(o.id, 'processing')}
                          className="p-2 bg-green-50 hover:bg-green-100 rounded-xl text-green-600 hover:text-green-700 transition-colors border border-green-100 hover:border-green-300 shadow-sm"
                          title="Accepter la commande"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleSyncOrder(o.id)}
                        className="p-2 bg-green-50 hover:bg-green-100 rounded-xl text-green-600 hover:text-green-700 transition-colors border border-green-100 hover:border-green-300 shadow-sm"
                        title="Synchroniser vers Google Sheets"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirm({ type: 'order', id: o.id })}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 hover:text-red-700 transition-colors border border-red-100 hover:border-red-300 shadow-sm"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProducts = () => {
    const filteredProducts = products.filter(p =>
      productCategoryFilter === 'all' || p.categorySlug === productCategoryFilter || p.category?.slug === productCategoryFilter
    );

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b flex items-center justify-between flex-wrap gap-4">
          <h3 className="font-semibold text-[#333]">Produits ({filteredProducts.length})</h3>
          <div className="flex gap-3">
            <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" /><input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--yp-blue)]" /></div>
            <button
              onClick={() => setShowArchivedProducts(v => !v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${showArchivedProducts ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-[#666] border-gray-200 hover:bg-gray-100'}`}
            >
              Archivés
            </button>
            <button onClick={() => setProductModal({ open: true })} className="px-4 py-2 bg-[var(--yp-blue)] text-white rounded-xl text-sm font-medium hover:bg-[var(--yp-blue-dark)] flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4" />Ajouter</button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="w-full overflow-hidden border-b border-gray-100 bg-gray-50/50">
          <div className="px-5 py-4 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setProductCategoryFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${productCategoryFilter === 'all' ? 'bg-[var(--yp-blue)] text-white shadow-sm' : 'bg-white text-[#666] border border-gray-200 hover:bg-gray-100'}`}
            >
              Toutes les catégories
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setProductCategoryFilter(c.slug)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${productCategoryFilter === c.slug ? 'bg-[var(--yp-blue)] text-white shadow-sm' : 'bg-white text-[#666] border border-gray-200 hover:bg-gray-100'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50/80"><tr>{['Produit', 'Catégorie', 'Prix', 'Stock', 'Ventes', 'Visible', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#999] uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {filteredProducts.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#999]">Aucun produit trouvé</td></tr>}
              {filteredProducts.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${!p.isVisible ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image && <img src={getImageUrl(p.image)} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />}
                      <div><p className="font-medium text-[#333] text-sm">{p.name}</p><p className="text-xs text-[#999]">{p.sku}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-[#666]">{p.category?.name || p.categorySlug || '—'}</span></td>
                  <td className="px-4 py-3">
                    <p className="text-[var(--yp-blue)] font-semibold text-sm">{p.price.toFixed(2)} MAD</p>
                    {p.originalPrice && <p className="text-xs text-[#999] line-through">{p.originalPrice.toFixed(2)}</p>}
                  </td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${p.stock < 10 ? 'bg-red-100 text-red-600' : p.stock < 30 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{p.stock}</span></td>
                  <td className="px-4 py-3 text-sm text-[#666]"><div className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" />{p.salesCount}</div></td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleVisibility(p)} className={`p-2 rounded-lg transition-colors ${p.isVisible ? 'hover:bg-green-50 text-green-600' : 'hover:bg-red-50 text-red-400'}`} title={p.isVisible ? 'Masquer' : 'Afficher'}>
                      {p.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setProductModal({ open: true, product: p })} className="p-2 hover:bg-blue-50 rounded-lg text-[#666] hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm({ type: 'product', id: p.id })} className="p-2 hover:bg-red-50 rounded-lg text-[#666] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── Categories ─────────────────────────────────────────────
  const renderCategories = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-semibold text-[#333]">Catégories ({categories.length})</h3>
        <button onClick={() => setCategoryModal({ open: true })} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"><Plus className="w-4 h-4" />Nouvelle catégorie</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
        {categories.length === 0 && <div className="col-span-full p-8 text-center text-[#999]">Aucune catégorie</div>}
        {categories.map(c => (
          <div key={c.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center"><FolderOpen className="w-5 h-5 text-teal-600" /></div>
                <div><p className="font-medium text-[#333]">{c.name}</p>{c.nameAr && <p className="text-xs text-[#999]" dir="rtl">{c.nameAr}</p>}</div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setCategoryModal({ open: true, category: c })} className="p-1.5 hover:bg-blue-50 rounded-lg text-[#999] hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => {
                  const id = Number(c.id);
                  if (!isNaN(id)) setDeleteConfirm({ type: 'category', id });
                }} className="p-1.5 hover:bg-red-50 rounded-lg text-[#999] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="bg-gray-100 px-2 py-1 rounded-md text-[#666] font-mono">{c.slug}</span>
              <span className="text-[#999]">{c._count?.products ?? 0} produits</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Promo Codes ────────────────────────────────────────────
  const renderPromoCodes = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-semibold text-[#333]">Codes Promo ({promoCodes.length})</h3>
        <button onClick={() => setPromoModal({ open: true })} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"><Plus className="w-4 h-4" />Nouveau code</button>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-gray-50/80"><tr>{['Code', 'Description', 'Réduction', 'Min. commande', 'Utilisations', 'Statut', 'Expiration', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#999] uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody className="divide-y">
            {promoCodes.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-[#999]">Aucun code promo</td></tr>}
            {promoCodes.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3"><span className="font-mono text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-lg font-semibold">{p.code}</span></td>
                <td className="px-4 py-3 text-sm text-[#666] max-w-[200px] truncate">{p.description || '—'}</td>
                <td className="px-4 py-3 text-sm font-semibold text-[#333]">{p.discountType === 'percentage' ? `${p.discountValue}%` : `${p.discountValue} MAD`}</td>
                <td className="px-4 py-3 text-sm text-[#666]">{p.minOrder > 0 ? `${p.minOrder} MAD` : '—'}</td>
                <td className="px-4 py-3 text-sm text-[#666]">{p.usedCount}{p.maxUses > 0 ? ` / ${p.maxUses}` : ' / ∞'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{p.isActive ? '✅ Actif' : '❌ Inactif'}</span>
                </td>
                <td className="px-4 py-3 text-sm text-[#666]">{p.endDate ? new Date(p.endDate).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setPromoModal({ open: true, promo: p })} className="p-2 hover:bg-blue-50 rounded-lg text-[#666] hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm({ type: 'promo', id: p.id })} className="p-2 hover:bg-red-50 rounded-lg text-[#666] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );


  // ─── Watermark ──────────────────────────────────────────────
  const renderWatermark = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Stamp className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-[#333] text-lg">Watermark (Protection des images)</h3>
          <p className="text-sm text-[#999]">Ajoutez automatiquement un logo sur toutes vos photos produits.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${storeForm.watermarkEnabled ? 'bg-[var(--yp-blue)]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${storeForm.watermarkEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <input
                type="checkbox"
                checked={!!storeForm.watermarkEnabled}
                onChange={e => setStoreForm((f: any) => ({ ...f, watermarkEnabled: e.target.checked }))}
                className="hidden"
              />
              <div>
                <span className="font-semibold text-[#333] block">Activer le watermark</span>
                <span className="text-xs text-[#666]">Appliquer sur toutes les images du site</span>
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-[#666]">Opacité</label>
                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-[#333]">{storeForm.watermarkOpacity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={storeForm.watermarkOpacity ?? 20}
                onChange={e => setStoreForm((f: any) => ({ ...f, watermarkOpacity: Number(e.target.value) }))}
                className="w-full accent-[var(--yp-blue)] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-[#666]">Taille</label>
                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-[#333]">{storeForm.watermarkSize}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={storeForm.watermarkSize ?? 30}
                onChange={e => setStoreForm((f: any) => ({ ...f, watermarkSize: Number(e.target.value) }))}
                className="w-full accent-[var(--yp-blue)] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-[#666]">Position X</label>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-[#333]">{storeForm.watermarkPosX}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={storeForm.watermarkPosX ?? 50}
                  onChange={e => setStoreForm((f: any) => ({ ...f, watermarkPosX: Number(e.target.value) }))}
                  className="w-full accent-[var(--yp-blue)] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-[#666]">Position Y</label>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-[#333]">{storeForm.watermarkPosY}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={storeForm.watermarkPosY ?? 50}
                  onChange={e => setStoreForm((f: any) => ({ ...f, watermarkPosY: Number(e.target.value) }))}
                  className="w-full accent-[var(--yp-blue)] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Modifications instantanées (Overlay non destructif)
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await setWatermarkStatusAPI(true);
                    setStoreForm((f: any) => ({ ...f, watermarkEnabled: true }));
                    toast.success('Watermark activé partout !');
                  } catch {
                    toast.error('Erreur activation');
                  }
                }}
                className="flex-1 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-all"
              >
                Tout activer
              </button>
              <button
                onClick={async () => {
                  try {
                    await setWatermarkStatusAPI(false);
                    setStoreForm((f: any) => ({ ...f, watermarkEnabled: false }));
                    toast.success('Watermark désactivé partout !');
                  } catch {
                    toast.error('Erreur désactivation');
                  }
                }}
                className="flex-1 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-all"
              >
                Tout désactiver
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#333]">Aperçu en direct</p>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Glisser pour déplacer</span>
          </div>
          
          <div
            className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden select-none border border-gray-200 shadow-inner group cursor-crosshair"
            onMouseDown={(e) => {
              const container = e.currentTarget as HTMLDivElement;
              const onMove = (ev: MouseEvent) => {
                const rect = container.getBoundingClientRect();
                const x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
                const y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
                setStoreForm((f: any) => ({ ...f, watermarkPosX: Math.round(x), watermarkPosY: Math.round(y) }));
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          >
            <img
              src="/images/products/headphones.jpg"
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            
            {/* Grid lines for alignment help */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 border-t border-dashed border-gray-400/50"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 border-l border-dashed border-gray-400/50"></div>
            </div>

            {storeForm.watermarkEnabled && (
              <img
                src="/images/finalwatermak.png"
                alt="Watermark"
                className="absolute pointer-events-none drop-shadow-lg transition-all duration-75 ease-out"
                style={{
                  width: `${storeForm.watermarkSize ?? 30}%`,
                  opacity: (storeForm.watermarkOpacity ?? 20) / 100,
                  left: `${storeForm.watermarkPosX ?? 50}%`,
                  top: `${storeForm.watermarkPosY ?? 50}%`,
                  transform: 'translate(-50%, -50%)',
                  mixBlendMode: 'multiply' // Better blending
                }}
              />
            )}
            
            {!storeForm.watermarkEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                <div className="bg-white/90 px-4 py-2 rounded-lg shadow-sm text-xs font-medium text-gray-500 flex items-center gap-2">
                  <EyeOff className="w-3 h-3" />
                  Watermark désactivé
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button onClick={handleStoreSave} className="px-8 py-3 bg-[var(--yp-blue)] text-white rounded-xl hover:bg-[var(--yp-blue-dark)] font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              {storeSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {storeSaved ? 'Enregistré !' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Hero Settings ──────────────────────────────────────────
  const [heroForm, setHeroForm] = useState(loadHeroSettings());
  const [heroSaved, setHeroSaved] = useState(false);

  const handleHeroSave = async () => {
    try {
      await saveHeroSettings(heroForm);
      setHeroSaved(true);
      toast.success('Paramètres Hero enregistrés');
      // Force reload to update colors globally if needed, or rely on event dispatch
      window.dispatchEvent(new Event('youposh_hero_settings_updated'));
      setTimeout(() => setHeroSaved(false), 2000);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors de la sauvegarde');
    }
  };

  const renderHeroSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#333]">Configuration de la section Hero</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#666]">Vidéo d'arrière-plan</span>
            <button
              onClick={() => setHeroForm(f => ({ ...f, heroVideoEnabled: !f.heroVideoEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${heroForm.heroVideoEnabled !== false ? 'bg-[var(--yp-blue)]' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${heroForm.heroVideoEnabled !== false ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">URL vidéo Hero</label>
              <input
                type="text"
                value={heroForm.videoUrl || ''}
                onChange={e => setHeroForm(f => ({ ...f, videoUrl: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]"
                placeholder="/videos/hero video.mp4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Poster image (fallback)</label>
              <input
                type="text"
                value={heroForm.videoPosterUrl || ''}
                onChange={e => setHeroForm(f => ({ ...f, videoPosterUrl: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]"
                placeholder="/images/products/headphones.jpg"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#666]">Masque sombre (overlay)</label>
              <span className="text-sm text-[#666]">{Math.max(0, Math.min(100, Number(heroForm.overlayOpacity ?? 0)))}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.max(0, Math.min(100, Number(heroForm.overlayOpacity ?? 0)))}
              onChange={e => setHeroForm(f => ({ ...f, overlayOpacity: Number(e.target.value) }))}
              className="w-full"
            />
            <p className="mt-1 text-xs text-[#888]">0% = masque supprimé</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Texte du Badge (ex: N°1 au Maroc)</label>
            <input 
              type="text" 
              value={heroForm.badgeText || ''} 
              onChange={e => setHeroForm(f => ({ ...f, badgeText: e.target.value }))} 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" 
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Couleur de fond du Badge</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={heroForm.badgeColor?.startsWith('#') ? heroForm.badgeColor : '#ffffff'} 
                  onChange={e => setHeroForm(f => ({ ...f, badgeColor: e.target.value }))} 
                  className="w-12 h-11 border border-gray-200 rounded-xl p-1 bg-white" 
                />
                <input 
                  type="text" 
                  value={heroForm.badgeColor || ''} 
                  onChange={e => setHeroForm(f => ({ ...f, badgeColor: e.target.value }))} 
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" 
                  placeholder="rgba(255,255,255,0.1) ou #FFFFFF"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Couleur du texte du Badge</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={heroForm.badgeTextColor || '#ffffff'} 
                  onChange={e => setHeroForm(f => ({ ...f, badgeTextColor: e.target.value }))} 
                  className="w-12 h-11 border border-gray-200 rounded-xl p-1 bg-white" 
                />
                <input 
                  type="text" 
                  value={heroForm.badgeTextColor || ''} 
                  onChange={e => setHeroForm(f => ({ ...f, badgeTextColor: e.target.value }))} 
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" 
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Couleur "YOU"</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={heroForm.titleColorYou?.startsWith('#') ? heroForm.titleColorYou : '#2563EB'} 
                  onChange={e => setHeroForm(f => ({ ...f, titleColorYou: e.target.value }))} 
                  className="w-12 h-11 border border-gray-200 rounded-xl p-1 bg-white" 
                />
                <input 
                  type="text" 
                  value={heroForm.titleColorYou || ''} 
                  onChange={e => setHeroForm(f => ({ ...f, titleColorYou: e.target.value }))} 
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" 
                  placeholder="#2563EB"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Couleur "POSH"</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={heroForm.titleColorPosh?.startsWith('#') ? heroForm.titleColorPosh : '#DC2626'} 
                  onChange={e => setHeroForm(f => ({ ...f, titleColorPosh: e.target.value }))} 
                  className="w-12 h-11 border border-gray-200 rounded-xl p-1 bg-white" 
                />
                <input 
                  type="text" 
                  value={heroForm.titleColorPosh || ''} 
                  onChange={e => setHeroForm(f => ({ ...f, titleColorPosh: e.target.value }))} 
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" 
                  placeholder="#DC2626"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Titre Principal</label>
            <input 
              type="text" 
              value={heroForm.title || ''} 
              onChange={e => setHeroForm(f => ({ ...f, title: e.target.value }))} 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Sous-titre</label>
            <textarea 
              value={heroForm.subtitle || ''} 
              onChange={e => setHeroForm(f => ({ ...f, subtitle: e.target.value }))} 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] h-24" 
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={handleHeroSave} className="px-6 py-2.5 bg-[var(--yp-blue)] text-white rounded-xl hover:bg-[var(--yp-blue-dark)] font-medium flex items-center gap-2 transition-colors">
            {heroSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {heroSaved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Settings ───────────────────────────────────────────────
  const [storeForm, setStoreForm] = useState(loadStoreSettings());
  const [storeSaved, setStoreSaved] = useState(false);

  const handleStoreSave = async () => {
    try {
      await saveStoreSettings(storeForm);
      setStoreSaved(true);
      toast.success('Paramètres enregistrés');
      // Force reload global colors
      window.dispatchEvent(new Event('youposh_store_settings_updated'));
      setTimeout(() => setStoreSaved(false), 2000);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors de la sauvegarde');
    }
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-[#333] mb-4">Informations de la boutique</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-[#666] mb-1">Nom de la boutique</label><input type="text" value={storeForm.storeName} onChange={e => setStoreForm((f: any) => ({ ...f, storeName: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="Edupoche" /></div>
          <div><label className="block text-sm font-medium text-[#666] mb-1">Téléphone WhatsApp</label><input type="text" value={storeForm.phone} onChange={e => setStoreForm((f: any) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="+212 690-939090" /></div>
          <div><label className="block text-sm font-medium text-[#666] mb-1">Email de contact</label><input type="email" value={storeForm.email} onChange={e => setStoreForm((f: any) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="youposh.ys@gmail.com" /></div>
          <div><label className="block text-sm font-medium text-[#666] mb-1">Devise</label><input type="text" value={storeForm.currency} onChange={e => setStoreForm((f: any) => ({ ...f, currency: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="MAD" /></div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Couleur "YOU" (Logo)</label>
            <div className="flex items-center gap-2">
              <input type="color" value={storeForm.brandColorYou || '#2563EB'} onChange={e => setStoreForm((f: any) => ({ ...f, brandColorYou: e.target.value }))} className="w-12 h-11 border border-gray-200 rounded-xl p-1 bg-white" />
              <input type="text" value={storeForm.brandColorYou || ''} onChange={e => setStoreForm((f: any) => ({ ...f, brandColorYou: e.target.value }))} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="#2563EB" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Couleur "POSH" (Logo)</label>
            <div className="flex items-center gap-2">
              <input type="color" value={storeForm.brandColorPosh || '#DC2626'} onChange={e => setStoreForm((f: any) => ({ ...f, brandColorPosh: e.target.value }))} className="w-12 h-11 border border-gray-200 rounded-xl p-1 bg-white" />
              <input type="text" value={storeForm.brandColorPosh || ''} onChange={e => setStoreForm((f: any) => ({ ...f, brandColorPosh: e.target.value }))} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="#DC2626" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Couleur "Ajouter au panier"</label>
            <div className="flex items-center gap-2">
              <input type="color" value={storeForm.brandColorCart || '#2563EB'} onChange={e => setStoreForm((f: any) => ({ ...f, brandColorCart: e.target.value }))} className="w-12 h-11 border border-gray-200 rounded-xl p-1 bg-white" />
              <input type="text" value={storeForm.brandColorCart || ''} onChange={e => setStoreForm((f: any) => ({ ...f, brandColorCart: e.target.value }))} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="#2563EB" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Couleur principale (Globale)</label>
            <div className="flex items-center gap-2">
              <input type="color" value={storeForm.brandPrimary || '#2563EB'} onChange={e => setStoreForm((f: any) => ({ ...f, brandPrimary: e.target.value }))} className="w-12 h-11 border border-gray-200 rounded-xl p-1 bg-white" />
              <input type="text" value={storeForm.brandPrimary || ''} onChange={e => setStoreForm((f: any) => ({ ...f, brandPrimary: e.target.value }))} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="#2563EB" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Couleur secondaire (Globale)</label>
            <div className="flex items-center gap-2">
              <input type="color" value={storeForm.brandSecondary || '#DC2626'} onChange={e => setStoreForm((f: any) => ({ ...f, brandSecondary: e.target.value }))} className="w-12 h-11 border border-gray-200 rounded-xl p-1 bg-white" />
              <input type="text" value={storeForm.brandSecondary || ''} onChange={e => setStoreForm((f: any) => ({ ...f, brandSecondary: e.target.value }))} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="#DC2626" />
            </div>
          </div>
          <div><label className="block text-sm font-medium text-[#666] mb-1">Livraison locale / même ville ({storeForm.currency})</label><input type="number" value={storeForm.shippingFeeLocal} onChange={e => setStoreForm((f: any) => ({ ...f, shippingFeeLocal: Number(e.target.value) }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="20" /></div>
          <div><label className="block text-sm font-medium text-[#666] mb-1">Livraison nationale ({storeForm.currency})</label><input type="number" value={storeForm.shippingFeeNational} onChange={e => setStoreForm((f: any) => ({ ...f, shippingFeeNational: Number(e.target.value) }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="35" /></div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={handleStoreSave} className="px-6 py-2.5 bg-[var(--yp-blue)] text-white rounded-xl hover:bg-[var(--yp-blue-dark)] font-medium flex items-center gap-2 transition-colors">
            {storeSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {storeSaved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-[#333] mb-2">Base de données</h3>
        <p className="text-sm text-[#999] mb-3">PostgreSQL connecté via Prisma</p>
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-sm text-green-600 font-medium">Connecté</span></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-[#333] mb-4">Section Promo (Accueil)</h3>
        <p className="text-sm text-[#666] mb-4">Afficher ou masquer la grande section "استمتع بعرض حصري" sur la page d'accueil.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStoreForm((f: any) => ({ ...f, promoSectionEnabled: !f.promoSectionEnabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${storeForm.promoSectionEnabled !== false ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${storeForm.promoSectionEnabled !== false ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm font-medium text-[#333]">
            {storeForm.promoSectionEnabled !== false ? 'Section activée' : 'Section masquée'}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={handleStoreSave} className="px-6 py-2.5 bg-[var(--yp-blue)] text-white rounded-xl hover:bg-[var(--yp-blue-dark)] font-medium flex items-center gap-2 transition-colors">
            {storeSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {storeSaved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-[#333] mb-4">Coupon Global (Pop-up)</h3>
        <p className="text-sm text-[#666] mb-4">Sélectionnez un code promo à afficher sous forme de pop-up sur le site pour tous les visiteurs.</p>
        
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setStoreForm((f: any) => ({ ...f, globalCouponEnabled: !f.globalCouponEnabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${storeForm.globalCouponEnabled !== false ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${storeForm.globalCouponEnabled !== false ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm font-medium text-[#333]">
            {storeForm.globalCouponEnabled !== false ? 'Notification activée' : 'Notification masquée'}
          </span>
        </div>

        <div className="max-w-md">
          <label className="block text-sm font-medium text-[#666] mb-1">Code Promo Actif</label>
          <select
            value={storeForm.activeGlobalCoupon || ''}
            onChange={e => setStoreForm((f: any) => ({ ...f, activeGlobalCoupon: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]"
          >
            <option value="">Aucun coupon actif</option>
            {promoCodes.filter(p => p.isActive).map(p => (
              <option key={p.id} value={p.code}>
                {p.code} ({p.discountType === 'percentage' ? `-${p.discountValue}%` : `-${p.discountValue} MAD`})
              </option>
            ))}
          </select>
          <p className="text-xs text-[#999] mt-2">
            Le coupon s'affichera sur les pages produits et la boutique. Les clients ne peuvent utiliser qu'un seul code promo à la fois.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={handleStoreSave} className="px-6 py-2.5 bg-[var(--yp-blue)] text-white rounded-xl hover:bg-[var(--yp-blue-dark)] font-medium flex items-center gap-2 transition-colors">
            {storeSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {storeSaved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Order Detail Modal ─────────────────────────────────────
  const renderOrderDetail = () => {
    if (!orderDetail) return null;
    const o = orderDetail;
    const deliveryStatus = getDeliveryStatusFromOrderStatus(o.status);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b"><h3 className="text-lg font-bold text-[#333]">Commande {o.id.slice(0, 8)}...</h3><button onClick={() => setOrderDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-[#666] uppercase">Client</p><p className="font-medium text-[#333]">{o.customerName}</p></div>
              <div><p className="text-xs text-[#666] uppercase">Téléphone</p><p className="font-medium text-[#333]">{o.phone}</p></div>
              <div><p className="text-xs text-[#666] uppercase">Ville</p><p className="font-medium text-[#333]">{o.city || '—'}</p></div>
              <div><p className="text-xs text-[#666] uppercase">Total</p><p className="font-bold text-[var(--yp-blue)]">{o.total.toFixed(2)} MAD</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 p-3"><p className="text-[11px] text-[#666] uppercase mb-2">Statut commande</p><span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span></div>
              <div className="rounded-xl border border-gray-100 p-3"><p className="text-[11px] text-[#666] uppercase mb-2">Statut livraison</p><span className={`px-3 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(deliveryStatus)}`}>{getDeliveryStatusLabel(deliveryStatus)}</span></div>
            </div>
            {o.items?.length > 0 && <div><p className="text-xs text-[#666] uppercase mb-2">Articles</p><div className="bg-gray-50 rounded-xl p-3 space-y-2">{o.items.map((it: any, i: number) => <div key={i} className="flex justify-between text-sm"><span className="text-[#333]">{it.product?.name || `#${it.productId}`} × {it.quantity}</span><span className="font-medium text-[var(--yp-blue)]">{(it.price * it.quantity).toFixed(2)} MAD</span></div>)}</div></div>}
            <div><p className="text-xs text-[#666] uppercase mb-2">Changer le statut commande</p>
              <div className="flex flex-wrap gap-2">
                {['pending', 'processing', 'shipped', 'delivered'].map(s => <button key={s} onClick={() => handleStatusChange(o.id, s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${o.status === s ? 'bg-[var(--yp-blue)] text-white' : 'bg-gray-100 text-[#666] hover:bg-[var(--yp-blue)]/10'}`}>{getOrderStatusLabel(s)}</button>)}
                <button onClick={() => handleStatusChange(o.id, 'cancelled')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${o.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>Annulée</button>
              </div>
            </div>
            <div><p className="text-xs text-[#666] uppercase mb-2">Changer le statut livraison</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleStatusChange(o.id, 'pending')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${deliveryStatus === 'not_shipped' ? 'bg-[var(--yp-blue)] text-white' : 'bg-gray-100 text-[#666] hover:bg-[var(--yp-blue)]/10'}`}>Non expédiée</button>
                <button onClick={() => handleStatusChange(o.id, 'shipped')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${deliveryStatus === 'shipped' ? 'bg-[var(--yp-blue)] text-white' : 'bg-gray-100 text-[#666] hover:bg-[var(--yp-blue)]/10'}`}>Expédiée</button>
                <button onClick={() => handleStatusChange(o.id, 'delivered')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${deliveryStatus === 'delivered' ? 'bg-[var(--yp-blue)] text-white' : 'bg-gray-100 text-[#666] hover:bg-[var(--yp-blue)]/10'}`}>Livrée</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sidebarItems: { id: TabId; label: string; icon: any; color?: string }[] = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'orders', label: t('orders'), icon: ShoppingBag },
    { id: 'products', label: t('products'), icon: Package },
    { id: 'categories', label: 'Catégories', icon: FolderOpen },
    { id: 'promos', label: 'Codes Promo', icon: Ticket },
    { id: 'watermark', label: 'Watermark', icon: Stamp },
    { id: 'hero', label: 'Accueil (Hero)', icon: Flame },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const tabTitles: Record<TabId, string> = { dashboard: t('dashboard'), orders: t('orders'), products: t('products'), categories: 'Catégories', promos: 'Codes Promo', watermark: 'Watermark', hero: 'Configuration Accueil', settings: t('settings') };

  const handleLogout = () => {
    localStorage.removeItem('yp_admin_token');
    localStorage.removeItem('yp_admin_user');
    localStorage.removeItem('token'); // Clear legacy token if any
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileSidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
        <aside
          className={`absolute top-0 left-0 w-[260px] bg-white shadow-lg h-full border-r border-gray-100 transform transition-transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--yp-blue)] to-[var(--yp-blue-dark)] rounded-xl flex items-center justify-center shadow-md shrink-0"><ShoppingBag className="w-5 h-5 text-white" /></div>
              <div className="min-w-0"><span className="font-bold text-[#333] text-lg truncate block">{storeForm.storeName || 'Boutique'}</span><p className="text-[10px] text-[#999] font-medium uppercase tracking-wider">Admin Pro</p></div>
            </div>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-[#666]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-3 space-y-0.5">
            {sidebarItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${activeTab === item.id ? 'bg-[var(--yp-blue)]/10 text-[var(--yp-blue)] font-semibold' : 'text-[#666] hover:bg-gray-50'}`}>
                <item.icon className="w-5 h-5" />{item.label}{activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 bg-[var(--yp-blue)] rounded-full" />}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
            <button onClick={() => { setIsMobileSidebarOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[#666] hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors text-sm"><LogOut className="w-5 h-5" />{t('logout')}</button>
          </div>
        </aside>
      </div>

      <aside className="hidden lg:flex flex-col w-[260px] bg-white shadow-lg fixed top-0 left-0 h-full z-10 border-r border-gray-100">
        <div className="p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--yp-blue)] to-[var(--yp-blue-dark)] rounded-xl flex items-center justify-center shadow-md shrink-0"><ShoppingBag className="w-5 h-5 text-white" /></div>
            <div className="min-w-0"><span className="font-bold text-[#333] text-lg truncate block">{storeForm.storeName || 'Boutique'}</span><p className="text-[10px] text-[#999] font-medium uppercase tracking-wider">Admin Pro</p></div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto no-scrollbar">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${activeTab === item.id ? 'bg-[var(--yp-blue)]/10 text-[var(--yp-blue)] font-semibold' : 'text-[#666] hover:bg-gray-50'}`}>
              <item.icon className="w-5 h-5 shrink-0" /><span className="truncate">{item.label}</span>{activeTab === item.id && <div className="ml-auto shrink-0 w-1.5 h-1.5 bg-[var(--yp-blue)] rounded-full" />}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-[#666] hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors text-sm"><LogOut className="w-5 h-5 shrink-0" />{t('logout')}</button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-[260px] min-w-0 flex flex-col min-h-screen">
        <header className="bg-white/80 backdrop-blur-md shadow-sm px-4 py-3 lg:px-8 lg:py-4 flex items-center justify-between sticky top-0 z-[5] border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl text-[#666]">
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg lg:text-xl font-bold text-[#333] truncate">{tabTitles[activeTab]}</h1>
              <p className="hidden sm:block text-xs text-[#999] mt-0.5">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="p-2.5 hover:bg-gray-100 rounded-xl relative"><Bell className="w-5 h-5 text-[#666]" />{(stats?.pendingOrders ?? 0) > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">{stats?.pendingOrders}</span>}</button>
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--yp-blue)] to-[var(--yp-blue-dark)] rounded-xl flex items-center justify-center text-white font-bold shadow-md">A</div>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden">
          {loading && <div className="flex items-center justify-center py-4 mb-4"><RefreshCw className="w-5 h-5 animate-spin text-[var(--yp-blue)]" /><span className="ml-2 text-sm text-[#999]">Chargement...</span></div>}
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'categories' && renderCategories()}
          {activeTab === 'promos' && renderPromoCodes()}
          {activeTab === 'watermark' && renderWatermark()}
          {activeTab === 'hero' && renderHeroSettings()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

      {activeTab === 'products' && productModal.open && <ProductFormModal product={productModal.product} onClose={() => setProductModal({ open: false })} onSave={() => { setProductModal({ open: false }); loadProducts(); toast.success('Produit enregistré avec succès'); }} />}
      {productModal.open && activeTab !== 'products' && <ProductFormModal product={productModal.product} onClose={() => setProductModal({ open: false })} onSave={() => { setProductModal({ open: false }); loadProducts(); toast.success('Produit enregistré avec succès'); }} />}
      {promoModal.open && <PromoFormModal promo={promoModal.promo} onClose={() => setPromoModal({ open: false })} onSave={() => { setPromoModal({ open: false }); loadPromoCodes(); }} />}
      {categoryModal.open && <CategoryFormModal category={categoryModal.category} onClose={() => setCategoryModal({ open: false })} onSave={() => { setCategoryModal({ open: false }); loadCategories(); }} />}
      {renderOrderDetail()}
      {deleteConfirm && <ConfirmModal message={`Êtes-vous sûr de vouloir supprimer ? Cette action est irréversible.`} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} />}

      {/* EXPORT MODAL */}
      {exportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-[#333]">Exporter les Commandes</h3>
              <button onClick={() => setExportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-[#666] mb-4">Sélectionnez les colonnes à inclure dans le fichier Excel :</p>
              {[
                { key: 'id', label: 'ID Commande' },
                { key: 'date', label: 'Date' },
                { key: 'customerName', label: 'Nom du client' },
                { key: 'phone', label: 'Téléphone' },
                { key: 'city', label: 'Ville' },
                { key: 'address', label: 'Adresse détaillée' },
                { key: 'total', label: 'Montant Total' },
                { key: 'history', label: 'Historique (Nb de commandes du client)' },
                { key: 'items', label: 'Articles (Liste)' },
                { key: 'status', label: 'Statut de la commande' }
              ].map(col => (
                <label key={col.key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={(exportColumns as any)[col.key]} onChange={e => setExportColumns(p => ({ ...p, [col.key]: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-[var(--yp-blue)] focus:ring-[var(--yp-blue)]" />
                  <span className="text-sm font-medium text-[#333]">{col.label}</span>
                </label>
              ))}
            </div>
            <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setExportModal(false)} className="px-4 py-2 text-sm font-medium text-[#666] hover:bg-gray-200 rounded-xl transition-colors">Annuler</button>
              <button onClick={handleExportOrders} className="px-4 py-2 bg-[var(--yp-blue)] hover:bg-[var(--yp-blue-dark)] text-white text-sm font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" /> Exporter (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
