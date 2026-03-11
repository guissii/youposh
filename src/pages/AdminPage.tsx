import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  LayoutDashboard, ShoppingBag, Package, Settings,
  LogOut, Search, Bell, DollarSign, Clock, CheckCircle,
  Eye, EyeOff, Plus, Pencil, Trash2, X,
  TrendingUp, RefreshCw, ChevronDown, Ticket, FolderOpen, Save, Image, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchDashboardStats, fetchRecentOrders, fetchTopProducts,
  fetchProducts, updateProduct, deleteProduct,
  fetchOrders, updateOrderStatus, deleteOrder,
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
import { loadHeroSettings, saveHeroSettings, type HeroSettings } from '@/data/heroSettings';
import { loadStoreSettings, saveStoreSettings } from '@/data/storeSettings';
import { getImageUrl } from '@/lib/utils';
import * as XLSX from 'xlsx';

type TabId = 'dashboard' | 'orders' | 'products' | 'categories' | 'promos' | 'hero' | 'settings';

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
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

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
    try { const [s, ro, tp] = await Promise.all([fetchDashboardStats(), fetchRecentOrders(), fetchTopProducts()]); setStats(s); setRecentOrders(ro); setTopProducts(tp); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const query = searchQuery ? `search=${encodeURIComponent(searchQuery)}&all=true` : 'all=true';
      setProducts(await fetchProducts(query));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [searchQuery]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try { const p = new URLSearchParams(); if (statusFilter) p.set('status', statusFilter); if (searchQuery) p.set('search', searchQuery); setOrders(await fetchOrders(p.toString())); } catch (e) { console.error(e); }
    setLoading(false);
  }, [statusFilter, searchQuery]);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try { setCategories(await fetchCategories()); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const loadPromoCodes = useCallback(async () => {
    setLoading(true);
    try { setPromoCodes(await fetchPromoCodes()); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    setSearchQuery(''); setStatusFilter(''); setDeliveryStatusFilter('');
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'promos') loadPromoCodes();
  }, [activeTab]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (activeTab === 'products') loadProducts();
      if (activeTab === 'orders') loadOrders();
    }, 300); return () => clearTimeout(t);
  }, [searchQuery, statusFilter]);

  const handleStatusChange = async (oid: string, status: string) => {
    try { await updateOrderStatus(oid, status); loadOrders(); if (orderDetail?.id === oid) setOrderDetail((p: any) => ({ ...p, status })); } catch (e) { console.error(e); }
  };

  const getVisibleOrders = useCallback(
    () => orders.filter(o => !deliveryStatusFilter || getDeliveryStatusFromOrderStatus(o.status) === deliveryStatusFilter),
    [orders, deliveryStatusFilter]
  );

  const toggleVisibility = async (product: any) => {
    try { await updateProduct(product.id, { isVisible: !product.isVisible }); loadProducts(); } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'product') { await deleteProduct(deleteConfirm.id); loadProducts(); }
      else if (deleteConfirm.type === 'order') { await deleteOrder(deleteConfirm.id); loadOrders(); }
      else if (deleteConfirm.type === 'category') { await deleteCategory(deleteConfirm.id); loadCategories(); }
      else if (deleteConfirm.type === 'promo') { await deletePromoCode(deleteConfirm.id); loadPromoCodes(); }
    } catch (e) { console.error(e); }
    setDeleteConfirm(null);
  };

  // ─── Dashboard ──────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#333]">Vue d'ensemble</h2>
        <button onClick={loadDashboard} className="p-2 hover:bg-gray-100 rounded-lg text-[#666]"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      {/* Watermark */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-[#333] mb-4">Watermark (overlay visuel non destructif)</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!storeForm.watermarkEnabled}
                onChange={e => setStoreForm((f: any) => ({ ...f, watermarkEnabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-[var(--yp-blue)] focus:ring-[var(--yp-blue)]"
              />
              <span className="text-sm text-[#666]">Activer le watermark</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Opacité ({storeForm.watermarkOpacity}%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={storeForm.watermarkOpacity ?? 20}
                onChange={e => setStoreForm((f: any) => ({ ...f, watermarkOpacity: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Taille ({storeForm.watermarkSize}%)</label>
              <input
                type="range"
                min={10}
                max={80}
                value={storeForm.watermarkSize ?? 30}
                onChange={e => setStoreForm((f: any) => ({ ...f, watermarkSize: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Position X ({storeForm.watermarkPosX}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={storeForm.watermarkPosX ?? 50}
                  onChange={e => setStoreForm((f: any) => ({ ...f, watermarkPosX: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Position Y ({storeForm.watermarkPosY}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={storeForm.watermarkPosY ?? 50}
                  onChange={e => setStoreForm((f: any) => ({ ...f, watermarkPosY: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={async () => {
                  try {
                    await setWatermarkStatusAPI(true);
                    setStoreForm((f: any) => ({ ...f, watermarkEnabled: true }));
                    toast.success('Watermark appliqué à toutes les images (overlay)');
                  } catch {
                    toast.error('Impossible d’activer le watermark');
                  }
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
              >
                Appliquer à toutes les photos
              </button>
              <button
                onClick={async () => {
                  try {
                    await setWatermarkStatusAPI(false);
                    setStoreForm((f: any) => ({ ...f, watermarkEnabled: false }));
                    toast.success('Watermark retiré de toutes les images (overlay)');
                  } catch {
                    toast.error('Impossible de désactiver le watermark');
                  }
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
              >
                Retirer de toutes les photos
              </button>
              <button onClick={handleStoreSave} className="px-6 py-2.5 bg-[var(--yp-blue)] text-white rounded-xl hover:bg-[var(--yp-blue-dark)] font-medium">Sauvegarder</button>
            </div>
          </div>
          {/* Preview — draggable */}
          <div>
            <p className="text-sm text-[#666] mb-2">Prévisualisation (drag pour déplacer)</p>
            <div
              className="relative w-full aspect-square bg-[var(--yp-gray-200)] rounded-2xl overflow-hidden select-none"
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
              {storeForm.watermarkEnabled && (
                <img
                  src="/images/finalwatermak.png"
                  alt="Watermark"
                  className="absolute pointer-events-none drop-shadow-md"
                  style={{
                    width: `${storeForm.watermarkSize ?? 30}%`,
                    opacity: (storeForm.watermarkOpacity ?? 20) / 100,
                    left: `${storeForm.watermarkPosX ?? 50}%`,
                    top: `${storeForm.watermarkPosY ?? 50}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Commandes', value: stats?.totalOrders ?? '—', icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
          { label: 'Revenus', value: stats ? `${stats.totalRevenue.toFixed(2)} MAD` : '—', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
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

  const renderOrders = () => {
    const visibleOrders = getVisibleOrders();
    return <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-5 border-b flex items-center justify-between flex-wrap gap-4">
        <h3 className="font-semibold text-[#333]">Commandes ({visibleOrders.length})</h3>
        <div className="flex gap-3">
          <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" /><input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--yp-blue)]" /></div>
          <div className="relative"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--yp-blue)] appearance-none pr-8 bg-white"><option value="">Commande: Tous</option><option value="pending">Commande: En attente</option><option value="processing">Commande: En cours de traitement</option><option value="shipped">Commande: Confirmée</option><option value="delivered">Commande: Terminée</option><option value="cancelled">Commande: Annulée</option></select><ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" /></div>
          <div className="relative"><select value={deliveryStatusFilter} onChange={e => setDeliveryStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--yp-blue)] appearance-none pr-8 bg-white"><option value="">Livraison: Tous</option><option value="not_shipped">Livraison: Non expédiée</option><option value="prepared">Livraison: Préparée</option><option value="shipped">Livraison: Expédiée</option><option value="delivered">Livraison: Livrée</option><option value="returned">Livraison: Retour</option></select><ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" /></div>
          <button onClick={() => setExportModal(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 shadow-sm whitespace-nowrap"><Save className="w-4 h-4" /> Export Excel</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80"><tr>{['ID', 'Date', 'Client', 'Téléphone', 'Ville', 'Adresse', 'Articles', 'Total', 'Statut commande', 'Statut livraison', 'Actions'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#999] uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody className="divide-y">
            {visibleOrders.length === 0 && <tr><td colSpan={11} className="px-5 py-12 text-center text-[#999]">Aucune commande trouvée</td></tr>}
            {visibleOrders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4 font-mono text-xs text-[#666]" title={o.id}>{o.id.slice(0, 8)}...</td>
                <td className="px-5 py-4 text-sm text-[#666]">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="px-5 py-4 font-medium text-[#333] text-sm">{o.customerName}</td>
                <td className="px-5 py-4 text-sm text-[#666]">{o.phone}</td>
                <td className="px-5 py-4 text-sm text-[#666]">{o.city}</td>
                <td className="px-5 py-4 text-sm text-[#666] max-w-[200px] truncate" title={o.address}>{o.address || '—'}</td>
                <td className="px-5 py-4 text-sm text-[#666]">{o.items?.length || 0}</td>
                <td className="px-5 py-4 font-semibold text-[var(--yp-blue)] text-sm">{o.total.toFixed(2)} MAD</td>
                <td className="px-5 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span></td>
                <td className="px-5 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(getDeliveryStatusFromOrderStatus(o.status))}`}>{getDeliveryStatusLabel(getDeliveryStatusFromOrderStatus(o.status))}</span></td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    <button onClick={() => setOrderDetail(o)} className="p-2 hover:bg-blue-50 rounded-lg text-[#666] hover:text-blue-600" title="Détails"><Eye className="w-4 h-4" /></button>
                    {o.status === 'pending' && <button onClick={() => handleStatusChange(o.id, 'processing')} className="p-2 hover:bg-green-50 rounded-lg text-[#666] hover:text-green-600" title="Accepter"><CheckCircle className="w-4 h-4" /></button>}
                    <button onClick={() => setDeleteConfirm({ type: 'order', id: o.id })} className="p-2 hover:bg-red-50 rounded-lg text-[#666] hover:text-red-500" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>;
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

        <div className="w-full max-w-[calc(100vw-300px)] overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50/80"><tr>{['Produit', 'Catégorie', 'Prix', 'Stock', 'Ventes', 'Flags', 'Visible', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#999] uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {filteredProducts.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-[#999]">Aucun produit trouvé</td></tr>}
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
                    <div className="flex flex-wrap gap-1">
                      {p.originalPrice && p.originalPrice > p.price && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600">🏷 Promo</span>}
                      {p.isNew && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-600">✨ Nouveau</span>}
                      {p.isBestSeller && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-600">🔥 Best</span>}
                      {p.isFeatured && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-600">⭐ Mis en avant</span>}
                      {!p.originalPrice && !p.isNew && !p.isBestSeller && !p.isFeatured && <span className="text-xs text-[#ccc]">—</span>}
                    </div>
                  </td>
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
      <div className="p-5 border-b flex items-center justify-between">
        <h3 className="font-semibold text-[#333]">Catégories ({categories.length})</h3>
        <button onClick={() => setCategoryModal({ open: true })} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4" />Nouvelle catégorie</button>
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
                <button onClick={() => setDeleteConfirm({ type: 'category', id: c.id })} className="p-1.5 hover:bg-red-50 rounded-lg text-[#999] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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
      <div className="p-5 border-b flex items-center justify-between">
        <h3 className="font-semibold text-[#333]">Codes Promo ({promoCodes.length})</h3>
        <button onClick={() => setPromoModal({ open: true })} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4" />Nouveau code</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
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


  // ─── Settings ───────────────────────────────────────────────
  const [storeForm, setStoreForm] = useState(loadStoreSettings());
  const [storeSaved, setStoreSaved] = useState(false);

  const handleStoreSave = async () => {
    try {
      await saveStoreSettings(storeForm);
      setStoreSaved(true);
      toast.success('Paramètres enregistrés');
      setTimeout(() => setStoreSaved(false), 2000);
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-[#333] mb-4">Informations de la boutique</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-[#666] mb-1">Nom de la boutique</label><input type="text" value={storeForm.storeName} onChange={e => setStoreForm((f: any) => ({ ...f, storeName: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="Edupoche" /></div>
          <div><label className="block text-sm font-medium text-[#666] mb-1">Téléphone WhatsApp</label><input type="text" value={storeForm.phone} onChange={e => setStoreForm((f: any) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="+212 6XX XXX XXX" /></div>
          <div><label className="block text-sm font-medium text-[#666] mb-1">Email de contact</label><input type="email" value={storeForm.email} onChange={e => setStoreForm((f: any) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="contact@youposh.ma" /></div>
          <div><label className="block text-sm font-medium text-[#666] mb-1">Devise</label><input type="text" value={storeForm.currency} onChange={e => setStoreForm((f: any) => ({ ...f, currency: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="MAD" /></div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Couleur principale (logo)</label>
            <div className="flex items-center gap-2">
              <input type="color" value={storeForm.brandPrimary || '#2563EB'} onChange={e => setStoreForm((f: any) => ({ ...f, brandPrimary: e.target.value }))} className="w-12 h-11 border border-gray-200 rounded-xl p-1 bg-white" />
              <input type="text" value={storeForm.brandPrimary || ''} onChange={e => setStoreForm((f: any) => ({ ...f, brandPrimary: e.target.value }))} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)]" placeholder="#2563EB" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Couleur secondaire (logo)</label>
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
    </div>
  );

  // ─── Hero Section ──────────────────────────────────────────
  const [heroForm, setHeroForm] = useState<HeroSettings>(loadHeroSettings());
  const [heroSaved, setHeroSaved] = useState(false);

  const handleHeroSave = async () => {
    try {
      await saveHeroSettings(heroForm);
      setHeroSaved(true);
      setTimeout(() => setHeroSaved(false), 2000);
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const heroInput = (label: string, key: keyof HeroSettings, type: string = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-[#666] mb-1">{label}</label>
      <input
        type={type}
        value={heroForm[key] as string}
        onChange={e => setHeroForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] text-sm"
        placeholder={placeholder}
      />
    </div>
  );

  const heroCheckbox = (label: string, key: keyof HeroSettings) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={heroForm[key] as boolean}
        onChange={e => setHeroForm(f => ({ ...f, [key]: e.target.checked }))}
        className="w-4 h-4 rounded border-gray-300 text-[var(--yp-blue)] focus:ring-[var(--yp-blue)]"
      />
      <span className="text-sm text-[#666]">{label}</span>
    </label>
  );

  const renderHero = () => (
    <div className="space-y-6">
      {heroSaved && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Hero sauvegardé ! Rechargez la page d'accueil pour voir les changements.
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-[#333] mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-[var(--yp-blue)]" /> Contenu Hero</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {heroInput('Badge', 'badgeText', 'text', 'Boutique N°1 au Maroc')}
            {heroInput('Slogan de marque', 'slogan', 'text', 'Votre boutique tendance au Maroc')}
          </div>
          {heroInput('Titre principal', 'title', 'text', 'Des produits tendance...')}
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Sous-titre</label>
            <textarea
              rows={2}
              value={heroForm.subtitle}
              onChange={e => setHeroForm(f => ({ ...f, subtitle: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-[#333] mb-4">Boutons d'action (CTA)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {heroInput('Texte bouton principal', 'primaryCtaText', 'text', 'Explorer la boutique')}
          {heroInput('Lien bouton principal', 'primaryCtaLink', 'text', '/shop')}
          {heroInput('Texte bouton secondaire', 'secondaryCtaText', 'text', 'Voir les promotions')}
          {heroInput('Lien bouton secondaire', 'secondaryCtaLink', 'text', '/shop?filter=promo')}
        </div>
      </div>

      {/* Video */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-[#333] mb-4">Vidéo Hero</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {heroInput('URL de la vidéo', 'videoUrl', 'text', '/videos/demo.mp4')}
          {heroInput('Image poster (fallback)', 'videoPosterUrl', 'text', '/images/products/headphones.jpg')}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
          {heroCheckbox('✅ Activer la vidéo', 'videoEnabled')}
          {heroCheckbox('▶️ Autoplay', 'videoAutoplay')}
          {heroCheckbox('🔇 Sourdine par défaut', 'videoMuted')}
          {heroCheckbox('🔁 Boucle', 'videoLoop')}
          {heroCheckbox('📱 Afficher sur mobile', 'showOnMobile')}
        </div>
        {/* Overlay opacity */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#666] mb-1">Opacité overlay : {heroForm.overlayOpacity}%</label>
          <input
            type="range"
            min={0} max={100} step={5}
            value={heroForm.overlayOpacity}
            onChange={e => setHeroForm(f => ({ ...f, overlayOpacity: Number(e.target.value) }))}
            className="w-full accent-[var(--yp-blue)]"
          />
          <div className="flex justify-between text-[10px] text-[#999] mt-1"><span>Clair</span><span>Sombre</span></div>
        </div>
        {/* Preview */}
        {heroForm.videoPosterUrl && (
          <div className="mt-4">
            <p className="text-xs text-[#999] mb-2">Aperçu poster :</p>
            <div className="w-[120px] aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <img src={heroForm.videoPosterUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </div>

      <button onClick={handleHeroSave} className="px-6 py-3 bg-[var(--yp-blue)] text-white rounded-xl hover:bg-[var(--yp-blue-dark)] font-semibold flex items-center gap-2 shadow-sm">
        <Save className="w-4 h-4" /> Sauvegarder le Hero
      </button>
    </div>
  );

  // ─── Order Detail Modal ─────────────────────────────────────
  const renderOrderDetail = () => {
    if (!orderDetail) return null;
    const o = orderDetail;
    const deliveryStatus = getDeliveryStatusFromOrderStatus(o.status);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                <button onClick={() => handleStatusChange(o.id, 'processing')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${deliveryStatus === 'prepared' ? 'bg-[var(--yp-blue)] text-white' : 'bg-gray-100 text-[#666] hover:bg-[var(--yp-blue)]/10'}`}>Préparée</button>
                <button onClick={() => handleStatusChange(o.id, 'shipped')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${deliveryStatus === 'shipped' ? 'bg-[var(--yp-blue)] text-white' : 'bg-gray-100 text-[#666] hover:bg-[var(--yp-blue)]/10'}`}>Expédiée</button>
                <button onClick={() => handleStatusChange(o.id, 'delivered')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${deliveryStatus === 'delivered' ? 'bg-[var(--yp-blue)] text-white' : 'bg-gray-100 text-[#666] hover:bg-[var(--yp-blue)]/10'}`}>Livrée</button>
                <button onClick={() => handleStatusChange(o.id, 'cancelled')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${deliveryStatus === 'returned' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>Retour</button>
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
    { id: 'hero', label: 'Hero Section', icon: Image },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const tabTitles: Record<TabId, string> = { dashboard: t('dashboard'), orders: t('orders'), products: t('products'), categories: 'Catégories', promos: 'Codes Promo', hero: 'Hero Section', settings: t('settings') };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <aside className="w-[260px] bg-white shadow-lg fixed h-full z-10 border-r border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--yp-blue)] to-[var(--yp-blue-dark)] rounded-xl flex items-center justify-center shadow-md"><ShoppingBag className="w-5 h-5 text-white" /></div>
            <div><span className="font-bold text-[#333] text-lg">{storeForm.storeName || 'Boutique'}</span><p className="text-[10px] text-[#999] font-medium uppercase tracking-wider">Admin Pro</p></div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${activeTab === item.id ? 'bg-[var(--yp-blue)]/10 text-[var(--yp-blue)] font-semibold' : 'text-[#666] hover:bg-gray-50'}`}>
              <item.icon className="w-5 h-5" />{item.label}{activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 bg-[var(--yp-blue)] rounded-full" />}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-2.5 text-[#666] hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors text-sm"><LogOut className="w-5 h-5" />{t('logout')}</button>
        </div>
      </aside>

      <main className="flex-1 ml-[260px]">
        <header className="bg-white/80 backdrop-blur-md shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-[5] border-b border-gray-100">
          <div><h1 className="text-xl font-bold text-[#333]">{tabTitles[activeTab]}</h1><p className="text-xs text-[#999] mt-0.5">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 hover:bg-gray-100 rounded-xl relative"><Bell className="w-5 h-5 text-[#666]" />{(stats?.pendingOrders ?? 0) > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">{stats?.pendingOrders}</span>}</button>
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--yp-blue)] to-[var(--yp-blue-dark)] rounded-xl flex items-center justify-center text-white font-bold shadow-md">A</div>
          </div>
        </header>
        <div className="p-6 lg:p-8">
          {loading && <div className="flex items-center justify-center py-4 mb-4"><RefreshCw className="w-5 h-5 animate-spin text-[var(--yp-blue)]" /><span className="ml-2 text-sm text-[#999]">Chargement...</span></div>}
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'categories' && renderCategories()}
          {activeTab === 'promos' && renderPromoCodes()}
          {activeTab === 'hero' && renderHero()}
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
