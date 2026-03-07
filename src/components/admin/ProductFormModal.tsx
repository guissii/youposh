import { useState, useEffect } from 'react';
import { X, Save, Eye, TrendingUp, ShoppingCart, BarChart3 } from 'lucide-react';
import { createProduct, updateProduct, fetchCategories } from '@/lib/api';

interface Props {
    product?: any;
    onClose: () => void;
    onSave: () => void;
}

export const ProductFormModal = ({ product, onClose, onSave }: Props) => {
    const isEdit = !!product;
    const [categories, setCategories] = useState<any[]>([]);
    const [form, setForm] = useState({
        name: product?.name || '', nameAr: product?.nameAr || '',
        price: product?.price || 0, originalPrice: product?.originalPrice || '',
        stock: product?.stock || 0, categorySlug: product?.categorySlug || '',
        description: product?.description || '', descriptionAr: product?.descriptionAr || '',
        image: product?.image || '', sku: product?.sku || '',
        inStock: product?.inStock ?? true,
        tags: product?.tags?.join(', ') || '', features: product?.features?.join(', ') || '',
        // ── Visibility & Status ──
        status: product?.status || 'published',
        isVisible: product?.isVisible ?? true,
        // ── Marketing flags ──
        isNew: product?.isNew || false,
        isPopular: product?.isPopular || false,
        isBestSeller: product?.isBestSeller || false,
        isFeatured: product?.isFeatured || false,
        // ── Date & order ──
        publishedAt: product?.publishedAt ? product.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0],
        sortOrder: product?.sortOrder || 0,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchCategories().then(setCategories).catch(() => { }); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = {
                ...form, price: Number(form.price),
                originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
                stock: Number(form.stock),
                sortOrder: Number(form.sortOrder),
                publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                features: form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : [],
            };
            if (isEdit) await updateProduct(product.id, data);
            else await createProduct(data);
            onSave();
        } catch (error) { console.error('Error saving product:', error); }
        finally { setSaving(false); }
    };

    const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20 text-sm";

    // ── Performance stats (read-only, only in edit mode) ──
    const perfStats = isEdit ? [
        { label: 'Vues', value: product?.viewsCount ?? 0, icon: Eye, color: 'text-blue-500' },
        { label: 'Ajouts panier', value: product?.cartAddCount ?? 0, icon: ShoppingCart, color: 'text-amber-500' },
        { label: 'Commandes', value: product?.salesCount ?? 0, icon: TrendingUp, color: 'text-green-500' },
        { label: 'Score', value: Math.round((product?.salesCount ?? 0) * 10 + (product?.viewsCount ?? 0) * 0.2 + (product?.cartAddCount ?? 0) * 1.5), icon: BarChart3, color: 'text-purple-500' },
    ] : [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
                    <h3 className="text-lg font-bold text-[#333]">{isEdit ? 'Modifier le produit' : 'Ajouter un produit'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* ── Informations de base ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Nom (FR) *</label>
                            <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Nom (AR)</label>
                            <input type="text" dir="rtl" value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Prix (MAD) *</label>
                            <input type="number" required step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Ancien prix</label>
                            <input type="number" step="0.01" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} className={inputClass} placeholder="Pour les soldes" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Stock *</label>
                            <input type="number" required value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Catégorie</label>
                            <select value={form.categorySlug} onChange={e => setForm(f => ({ ...f, categorySlug: e.target.value }))} className={inputClass}>
                                <option value="">— Sélectionner —</option>
                                {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">SKU</label>
                            <input type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-1">Image URL</label>
                        <input type="text" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className={inputClass} placeholder="/images/products/..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-1">Description (FR)</label>
                        <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass + " resize-none"} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-1">Tags (séparés par virgule)</label>
                        <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className={inputClass} placeholder="audio, bluetooth" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-1">Caractéristiques (séparées par virgule)</label>
                        <input type="text" value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} className={inputClass} placeholder="Bluetooth 5.3, 30h autonomie" />
                    </div>

                    {/* ═══════════════════════════════════════════════
                        VISIBILITÉ & MARKETING
                        ═══════════════════════════════════════════════ */}
                    <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-bold text-[#333] flex items-center gap-2">
                            <Eye className="w-4 h-4 text-blue-500" /> Visibilité & Marketing
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[#666] mb-1">Statut</label>
                                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
                                    <option value="draft">📝 Brouillon</option>
                                    <option value="published">✅ Publié</option>
                                    <option value="archived">📦 Archivé</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#666] mb-1">Date de publication</label>
                                <input type="date" value={form.publishedAt} onChange={e => setForm(f => ({ ...f, publishedAt: e.target.value }))} className={inputClass} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[#666] mb-1">Ordre (homepage)</label>
                                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} className={inputClass} placeholder="0" />
                            </div>
                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 text-[#f5a623] focus:ring-[#f5a623]" />
                                    <span className="text-sm text-[#666]">📦 En stock</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                            {[
                                { key: 'isVisible', label: '👁 Visible sur le site' },
                                { key: 'isFeatured', label: '⭐ Mettre en avant (homepage)' },
                                { key: 'isNew', label: '✨ Afficher dans Nouveautés' },
                                { key: 'isBestSeller', label: '🔥 Afficher dans Best-sellers' },
                                { key: 'isPopular', label: '📈 Populaire' },
                            ].map(opt => (
                                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={(form as any)[opt.key]} onChange={e => setForm(f => ({ ...f, [opt.key]: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 text-[#f5a623] focus:ring-[#f5a623]" />
                                    <span className="text-sm text-[#666]">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════
                        PERFORMANCE (read-only, edit mode only)
                        ═══════════════════════════════════════════════ */}
                    {isEdit && (
                        <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-[#333] flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-emerald-500" /> Performance
                            </h4>
                            <div className="grid grid-cols-4 gap-3">
                                {perfStats.map(stat => (
                                    <div key={stat.label} className="bg-white rounded-lg p-3 text-center border border-gray-100">
                                        <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                                        <p className="text-lg font-bold text-[#333]">{stat.value}</p>
                                        <p className="text-[10px] text-[#999] uppercase tracking-wider">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-[#666] hover:bg-gray-50 font-medium">Annuler</button>
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-[#f5a623] text-white rounded-xl hover:bg-[#e09422] font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                            <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Ajouter')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
