import { useMemo, useState, useEffect, useRef } from 'react';
import { X, Save, Eye, TrendingUp, ShoppingCart, BarChart3, Plus, Upload, Loader2, Star } from 'lucide-react';
import { createProduct, updateProduct, fetchCategories, fetchAttributeLibrary, uploadProductImage } from '@/lib/api';
import { loadStoreSettings } from '@/data/storeSettings';
import { getImageUrl } from '@/lib/utils';

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
        image: product?.image || '', images: product?.images || [], sku: product?.sku || '',
        inStock: product?.inStock ?? true,
        tags: product?.tags?.join(', ') || '', features: product?.features?.join(', ') || '',
        variants: product?.variants || [],
        attributeValueIds: Array.isArray(product?.attributeValues)
            ? product.attributeValues.map((av: any) => Number(av.attributeValueId ?? av.attributeValue?.id)).filter((n: any) => Number.isFinite(n))
            : [],
        // ── Visibility & Status ──
        status: product?.status || 'published',
        isVisible: product?.isVisible ?? true,
        // ── Marketing flags ──
        isNew: product ? product.isNew : true,
        isPopular: product?.isPopular || false,
        isBestSeller: product?.isBestSeller || false,
        isFeatured: product?.isFeatured || false,
        // ── Date & order ──
        publishedAt: product?.publishedAt ? product.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0],
        sortOrder: product?.sortOrder || 0,
        // ── Card crop ──
        cardZoom: product?.cardZoom ?? 1.0,
        cardFocalX: product?.cardFocalX ?? 50,
        cardFocalY: product?.cardFocalY ?? 50,
    });
    const [saving, setSaving] = useState(false);
    const [uploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [applyWatermark, setApplyWatermark] = useState<boolean>(true);
    const [watermarkPos, setWatermarkPos] = useState({ x: 50, y: 50 });
    const [previewImages, setPreviewImages] = useState<Array<{ url: string, file?: File, isExisting: boolean }>>(() => {
        const initial: Array<{ url: string, file?: File, isExisting: boolean }> = [];
        if (product?.image) initial.push({ url: product.image, isExisting: true });
        if (product?.images?.length) product.images.forEach((img: string) => initial.push({ url: img, isExisting: true }));
        return initial;
    });
    const [primaryIndex, setPrimaryIndex] = useState(0);
    const previewRef = useRef<HTMLDivElement>(null);
    const [storeSettingsConfig, setStoreSettingsConfig] = useState<any>(null);
    const [attributeLibrary, setAttributeLibrary] = useState<any[]>([]);
    const [variantLibraryQuery, setVariantLibraryQuery] = useState('');

    useEffect(() => {
        fetchCategories().then(setCategories).catch(() => { });
        fetchAttributeLibrary().then(setAttributeLibrary).catch(() => { });
        const settings = loadStoreSettings();
        setApplyWatermark(settings.watermarkEnabled);
        setStoreSettingsConfig(settings);
    }, []);

    const selectedCategory = categories.find(c => c.slug === form.categorySlug);
    const categoryAttributes = Array.isArray(selectedCategory?.attributes) ? selectedCategory.attributes : [];

    const filteredVariantLibrary = useMemo(() => {
        const q = variantLibraryQuery.trim().toLowerCase();
        if (!q) return attributeLibrary;
        return attributeLibrary.filter((a: any) => {
            const name = String(a?.name ?? '').toLowerCase();
            const code = String(a?.code ?? '').toLowerCase();
            return name.includes(q) || code.includes(q);
        });
    }, [attributeLibrary, variantLibraryQuery]);

    const recommendedVariantCodes = useMemo(() => {
        const slug = String(form.categorySlug || '').toLowerCase();
        if (/(mode|fashion)/.test(slug)) return ['size', 'color', 'material', 'gender'];
        if (/(chauss|shoe)/.test(slug)) return ['shoe_size', 'color', 'material', 'gender'];
        if (/(electron|gaming)/.test(slug)) return ['storage', 'ram', 'connectivity', 'color'];
        if (/(auto|moto)/.test(slug)) return ['color', 'model', 'length', 'width', 'height'];
        return [];
    }, [form.categorySlug]);

    useEffect(() => {
        const allowed = new Set<number>();
        categoryAttributes.forEach((a: any) => (Array.isArray(a.values) ? a.values : []).forEach((v: any) => {
            const id = Number(v?.id);
            if (Number.isFinite(id)) allowed.add(id);
        }));
        setForm(f => ({
            ...f,
            attributeValueIds: Array.isArray(f.attributeValueIds) ? f.attributeValueIds.filter((id: number) => allowed.has(id)) : [],
        }));
    }, [form.categorySlug, selectedCategory?.id]);

    // Clean up local preview URLs when component unmounts or files change
    useEffect(() => {
        return () => {
            previewImages.forEach(img => {
                if (!img.isExisting) URL.revokeObjectURL(img.url);
            });
        };
    }, [previewImages]);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!previewRef.current) return;

        const container = previewRef.current;
        const rect = container.getBoundingClientRect();

        const updatePosition = (clientX: number, clientY: number) => {
            const x = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
            const y = Math.max(0, Math.min(100, Math.round(((clientY - rect.top) / rect.height) * 100)));
            setWatermarkPos({ x, y });
        };

        const onMouseMove = (moveEvent: MouseEvent) => {
            updatePosition(moveEvent.clientX, moveEvent.clientY);
        };
        const onTouchMove = (moveEvent: TouchEvent) => {
            updatePosition(moveEvent.touches[0].clientX, moveEvent.touches[0].clientY);
        };

        const onEnd = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onEnd);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onEnd);

        if ('touches' in e) {
            updatePosition(e.touches[0].clientX, e.touches[0].clientY);
        } else {
            updatePosition((e as React.MouseEvent).clientX, (e as React.MouseEvent).clientY);
        }
    };

    const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newFiles = Array.from(e.target.files);

        const newPreviews = newFiles.map(file => ({
            url: URL.createObjectURL(file),
            file,
            isExisting: false
        }));
        setPreviewImages(prev => [...prev, ...newPreviews]);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setPreviewImages(prev => {
            const copy = [...prev];
            if (!copy[index].isExisting) URL.revokeObjectURL(copy[index].url);
            copy.splice(index, 1);
            return copy;
        });
        if (primaryIndex === index) setPrimaryIndex(0);
        else if (primaryIndex > index) setPrimaryIndex(primaryIndex - 1);
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const finalUrls: string[] = [];

            for (const img of previewImages) {
                if (img.file) {
                    const result = await uploadProductImage(img.file);
                    finalUrls.push(result.url);
                } else {
                    finalUrls.push(img.url);
                }
            }

            const finalImageUrl = finalUrls.length > 0 ? finalUrls[primaryIndex] : '';
            const finalImagesArray = finalUrls.filter((_, i) => i !== primaryIndex);

            const data = {
                ...form,
                image: finalImageUrl,
                images: finalImagesArray,
                price: Number(form.price),
                originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
                stock: Number(form.stock),
                sortOrder: Number(form.sortOrder),
                cardZoom: Number(form.cardZoom),
                cardFocalX: Number(form.cardFocalX),
                cardFocalY: Number(form.cardFocalY),
                publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
                tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
                features: form.features ? form.features.split(',').map((f: string) => f.trim()).filter(Boolean) : [],
                variants: (Array.isArray(form.variants) ? form.variants : [])
                    .map((v: any) => ({
                        ...v,
                        options: (Array.isArray(v?.options) ? v.options : [])
                            .map((o: any) => {
                                if (typeof o === 'string') return o.trim();
                                const value = typeof o?.value === 'string' ? o.value.trim() : '';
                                if (!value) return null;
                                const stock = typeof o?.stock === 'number' ? Math.max(0, Math.floor(o.stock)) : undefined;
                                return typeof stock === 'number' ? { value, stock } : { value };
                            })
                            .filter(Boolean),
                    }))
                    .filter((v: any) => String(v?.name || '').trim().length > 0 && (Array.isArray(v.options) ? v.options.length > 0 : true)),
                // These are now handled by algorithm, forces to false
                isFeatured: false,
                isNew: false,
                isBestSeller: false,
                isPopular: false
            };
            if (isEdit) await updateProduct(product.id, data);
            else await createProduct(data);
            onSave();
        } catch (error) { console.error('Error saving product:', error); }
        finally { setSaving(false); }
    };

    const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-[var(--yp-blue)]/20 text-sm";
    const formatVariantOptions = (opts: any[]): string => {
        if (!Array.isArray(opts)) return '';
        return opts.map(o => {
            if (typeof o === 'string') return o;
            const value = typeof o?.value === 'string' ? o.value : '';
            return value || '';
        }).filter(Boolean).join(', ');
    };
    const getVariantOptionValue = (o: any): string => {
        if (typeof o === 'string') return o;
        if (o && typeof o === 'object' && typeof o.value === 'string') return o.value;
        return '';
    };

    const isVariantOptionOutOfStock = (o: any): boolean => {
        if (!o || typeof o !== 'object') return false;
        return typeof o.stock === 'number' && o.stock <= 0;
    };

    const parseVariantOptions = (raw: string, previousOptions: any[] = []): any[] => {
        const prevByValue = new Map<string, any>();
        (Array.isArray(previousOptions) ? previousOptions : []).forEach(o => {
            const v = getVariantOptionValue(o).trim();
            if (v) prevByValue.set(v, o);
        });

        const values = (raw || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        return values.map(v => {
            const prev = prevByValue.get(v);
            if (prev && isVariantOptionOutOfStock(prev)) return { value: v, stock: 0 };
            return v;
        });
    };

    const toggleVariantOptionAvailability = (variantIdx: number, value: string) => {
        setForm(f => {
            const variants = Array.isArray(f.variants) ? [...f.variants] : [];
            const variant = variants[variantIdx];
            if (!variant) return f;
            const options = Array.isArray(variant.options) ? [...variant.options] : [];

            const idx = options.findIndex(o => getVariantOptionValue(o).trim() === value.trim());
            if (idx === -1) return f;

            const current = options[idx];
            const nextOut = !isVariantOptionOutOfStock(current);
            options[idx] = nextOut ? { value: getVariantOptionValue(current).trim(), stock: 0 } : getVariantOptionValue(current).trim();

            variants[variantIdx] = { ...variant, options };
            return { ...f, variants };
        });
    };

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

                    {/* ═══════════════════════════════════════════════
                        IMAGE — Upload ou URL avec Live Preview
                        ═══════════════════════════════════════════════ */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-[#666]">Image du produit</label>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#666]">
                                    <input
                                        type="checkbox"
                                        checked={applyWatermark}
                                        onChange={e => setApplyWatermark(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--yp-blue)] focus:ring-[var(--yp-blue)]"
                                    />
                                    Ajouter un filigrane
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start mb-4">
                            {/* Upload button */}
                            <div className="flex-shrink-0">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleLocalImageSelect}
                                    className="hidden"
                                    id="product-image-upload"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-4 py-2.5 bg-[var(--yp-blue)]/10 text-[var(--yp-blue)] border border-[var(--yp-blue)]/30 rounded-xl text-sm font-medium hover:bg-[var(--yp-blue)]/20 flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {uploading ? 'Upload...' : 'Ajouter des images'}
                                </button>
                            </div>
                            {/* URL input */}
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    id="url-input-temp"
                                    className={inputClass}
                                    placeholder="ou coller l'URL d'une image ici..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = e.currentTarget.value;
                                            if (val) {
                                                setPreviewImages(prev => [...prev, { url: val, isExisting: false }]);
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.getElementById('url-input-temp') as HTMLInputElement;
                                        if (input && input.value) {
                                            setPreviewImages(prev => [...prev, { url: input.value, isExisting: false }]);
                                            input.value = '';
                                        }
                                    }}
                                    className="px-3 bg-gray-100 text-[#666] border border-gray-200 rounded-xl text-sm hover:bg-gray-200"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </div>

                        {/* Image Gallery Grid */}
                        {previewImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs font-medium text-[#666] mb-2 uppercase tracking-wider">Galerie ({previewImages.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {previewImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${primaryIndex === idx ? 'border-[var(--yp-blue)] shadow-md scale-105' : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'}`}
                                            onClick={() => setPrimaryIndex(idx)}
                                        >
                                            <img src={getImageUrl(img.url)} alt={`Preview ${idx}`} className="w-full h-full object-cover" />

                                            {/* Primary Badge */}
                                            {primaryIndex === idx && (
                                                <div className="absolute top-1 left-1 bg-[var(--yp-blue)] text-white p-0.5 rounded shadow">
                                                    <Star className="w-3 h-3 fill-current" />
                                                </div>
                                            )}

                                            {/* Delete button */}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                                className="absolute top-1 right-1 bg-white/80 text-red-500 p-0.5 rounded shadow hover:bg-white transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interactive Image Preview with Watermark Drag & Drop */}
                        {previewImages.length > 0 && previewImages[primaryIndex] && (
                            <div className="mt-3">
                                <p className="text-xs font-medium text-[#666] mb-2 uppercase tracking-wider">Aperçu en direct (Photo Principale)</p>
                                <div
                                    ref={previewRef}
                                    className="relative w-full max-w-[300px] aspect-square rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner select-none touch-none bg-gray-50 flex items-center justify-center mx-auto"
                                    onMouseDown={applyWatermark ? handleDragStart : undefined}
                                    onTouchStart={applyWatermark ? handleDragStart : undefined}
                                >
                                    <img
                                        src={previewImages[primaryIndex].file ? getImageUrl(previewImages[primaryIndex].url) : getImageUrl(previewImages[primaryIndex].url)}
                                        crossOrigin="anonymous"
                                        alt="Aperçu du produit"
                                        className="w-full h-full object-contain pointer-events-none"
                                    />

                                    {/* Watermark Overlay (CSS Client-side only) */}
                                    {applyWatermark && storeSettingsConfig && (
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                            <img
                                                src="/images/categories/logo final.png"
                                                alt="Watermark"
                                                className="absolute select-none pointer-events-none z-10 drop-shadow-lg filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
                                                style={{
                                                    width: `${storeSettingsConfig.watermarkSize}%`,
                                                    height: 'auto',
                                                    opacity: storeSettingsConfig.watermarkOpacity / 100,
                                                    left: `${watermarkPos.x}%`,
                                                    top: `${watermarkPos.y}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    mixBlendMode: 'multiply'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-[10px] text-gray-500 font-medium">
                                        {applyWatermark ? 'Glissez le logo sur l\'image pour changer sa position.' : 'Filigrane désactivé pour cette image.'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════════
                            CADRAGE CARTE PRODUIT
                            ═══════════════════════════════════════════════ */}
                        {previewImages.length > 0 && previewImages[primaryIndex] && (
                            <div className="mt-4 border border-blue-100 bg-blue-50/30 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-[#333] flex items-center gap-2">
                                        🖼️ Cadrage carte produit
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, cardZoom: 1.0, cardFocalX: 50, cardFocalY: 50 }))}
                                        className="text-xs text-[var(--yp-blue)] hover:underline"
                                    >
                                        Réinitialiser
                                    </button>
                                </div>

                                {/* Live card preview */}
                                <div className="flex justify-center">
                                    <div className="w-[160px] h-[200px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner bg-[#F5F5F5]">
                                        <img
                                            src={getImageUrl(previewImages[primaryIndex].url)}
                                            alt="Card preview"
                                            className="w-full h-full object-cover"
                                            style={{
                                                objectPosition: `${form.cardFocalX}% ${form.cardFocalY}%`,
                                                transform: `scale(${form.cardZoom})`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 text-center">Aperçu du rendu dans la grille catégorie</p>

                                {/* Sliders */}
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs text-[#666] mb-1">
                                            <span>Zoom</span>
                                            <span className="font-mono">{Number(form.cardZoom).toFixed(2)}×</span>
                                        </div>
                                        <input type="range" min="0.8" max="2.0" step="0.05" value={form.cardZoom}
                                            onChange={e => setForm(f => ({ ...f, cardZoom: parseFloat(e.target.value) }))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--yp-blue)]" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-[#666] mb-1">
                                            <span>Position horizontale</span>
                                            <span className="font-mono">{Math.round(form.cardFocalX)}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" step="1" value={form.cardFocalX}
                                            onChange={e => setForm(f => ({ ...f, cardFocalX: parseFloat(e.target.value) }))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--yp-blue)]" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-[#666] mb-1">
                                            <span>Position verticale</span>
                                            <span className="font-mono">{Math.round(form.cardFocalY)}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" step="1" value={form.cardFocalY}
                                            onChange={e => setForm(f => ({ ...f, cardFocalY: parseFloat(e.target.value) }))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--yp-blue)]" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-[#666]">Description (FR)</label>
                    </div>
                    <div>
                        <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass + " resize-none"} />
                    </div>

                    {/* Tags Prédéfinis */}
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-2">Tags (Sélectionnez pour ajouter)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {['nouveau', 'promo', 'tendance', 'populaire', 'cadeau', 'premium', 'soles'].map(tag => {
                                const currentTags = (form.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
                                const isSelected = currentTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => {
                                            const newTags = isSelected
                                                ? currentTags.filter((t: string) => t !== tag)
                                                : [...currentTags, tag];
                                            setForm(f => ({ ...f, tags: newTags.join(', ') }));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isSelected ? 'bg-[var(--yp-blue)]/10 text-[var(--yp-blue)] border-[var(--yp-blue)]/30' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        #{tag}
                                    </button>
                                );
                            })}
                        </div>
                        <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className={inputClass} placeholder="Ou tapez vos tags (séparés par virgule)" />
                    </div>

                    {/* Caractéristiques Prédéfinies */}
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-2">Caractéristiques Rapides</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {['Sans fil', 'Bluetooth', 'Étanche (IPX7)', 'Garantie 1 an', 'Livraison Gratuite', 'Haute Qualité', 'Batterie Longue Durée', 'Micro Intégré'].map(feat => {
                                const currentFeats = (form.features || '').split(',').map((t: string) => t.trim()).filter(Boolean);
                                const isSelected = currentFeats.includes(feat);
                                return (
                                    <button
                                        key={feat}
                                        type="button"
                                        onClick={() => {
                                            const newFeats = isSelected
                                                ? currentFeats.filter((t: string) => t !== feat)
                                                : [...currentFeats, feat];
                                            setForm(f => ({ ...f, features: newFeats.join(', ') }));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isSelected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        ✓ {feat}
                                    </button>
                                );
                            })}
                        </div>
                        <input type="text" value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} className={inputClass} placeholder="Ou tapez vos caractéristiques (séparées par virgule)" />
                    </div>

                    {/* ═══════════════════════════════════════════════
                        VARIANTES
                        ═══════════════════════════════════════════════ */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-[#333] flex items-center gap-2">
                                Variantes (Tailles, Couleurs, etc.)
                            </h4>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, variants: [...f.variants, { name: '', nameAr: '', options: [] }] }))}
                                className="text-sm text-[var(--yp-blue)] font-medium flex items-center gap-1 hover:underline shadow-sm border border-gray-100 px-2 py-1 rounded-lg"
                            >
                                <Plus className="w-3 h-3" /> Ajouter
                            </button>
                        </div>

                        {attributeLibrary.length > 0 && (
                            <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider">Prédéfinis</p>
                                    {recommendedVariantCodes.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const existing = new Set((form.variants || []).map((v: any) => String(v?.name || '').trim().toLowerCase()));
                                                const toAdd = attributeLibrary.filter((a: any) => recommendedVariantCodes.includes(String(a?.code || '').toLowerCase()));
                                                const next = toAdd
                                                    .filter((a: any) => !existing.has(String(a?.name || '').trim().toLowerCase()))
                                                    .map((a: any) => ({
                                                        name: a.name,
                                                        nameAr: a.nameAr,
                                                        options: Array.isArray(a.values) ? a.values.map((v: any) => String(v?.value ?? '')).filter(Boolean) : [],
                                                    }));
                                                if (next.length) setForm(f => ({ ...f, variants: [...(f.variants || []), ...next] }));
                                            }}
                                            className="text-xs font-semibold text-[var(--yp-blue)] hover:underline"
                                        >
                                            + Suggestions
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={variantLibraryQuery}
                                    onChange={e => setVariantLibraryQuery(e.target.value)}
                                    className={inputClass}
                                    placeholder="Rechercher: taille, couleur, ram, stockage..."
                                />
                                <div className="flex flex-wrap gap-2">
                                    {filteredVariantLibrary.slice(0, 10).map((a: any) => {
                                        const exists = (form.variants || []).some((v: any) => String(v?.name || '').trim().toLowerCase() === String(a?.name || '').trim().toLowerCase());
                                        return (
                                            <button
                                                key={a.id || a.code}
                                                type="button"
                                                disabled={exists}
                                                onClick={() => {
                                                    const next = {
                                                        name: a.name,
                                                        nameAr: a.nameAr,
                                                        options: Array.isArray(a.values) ? a.values.map((v: any) => String(v?.value ?? '')).filter(Boolean) : [],
                                                    };
                                                    setForm(f => ({ ...f, variants: [...(f.variants || []), next] }));
                                                }}
                                                className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${exists
                                                    ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-200 bg-white hover:bg-gray-50 text-[#333]'
                                                    }`}
                                            >
                                                {a.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {form.variants.map((variant: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex gap-3 relative">
                                <button type="button" onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_: any, i: number) => i !== idx) }))} className="absolute right-2 top-2 text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-2 gap-3 pr-8">
                                        <div>
                                            <input type="text" placeholder="Nom (Ex: Taille)" value={variant.name} onChange={e => {
                                                const newV = [...form.variants]; newV[idx].name = e.target.value; setForm({ ...form, variants: newV });
                                            }} className={inputClass} />
                                        </div>
                                        <div>
                                            <input type="text" placeholder="Nom AR" dir="rtl" value={variant.nameAr} onChange={e => {
                                                const newV = [...form.variants]; newV[idx].nameAr = e.target.value; setForm({ ...form, variants: newV });
                                            }} className={inputClass} />
                                        </div>
                                    </div>
                                    <div>
                                        <input type="text" placeholder="Options séparées par virgule (Ex: S, M, L)" value={formatVariantOptions(variant.options)} onChange={e => {
                                            const newV = [...form.variants];
                                            newV[idx].options = parseVariantOptions(e.target.value, newV[idx].options);
                                            setForm({ ...form, variants: newV });
                                        }} className={inputClass} />
                                    </div>

                                    {Array.isArray(variant.options) && variant.options.filter((o: any) => getVariantOptionValue(o).trim().length > 0).length > 0 && (
                                        <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2">
                                            <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider">Disponibilité</p>
                                            <div className="flex flex-wrap gap-2">
                                                {variant.options
                                                    .map((o: any) => getVariantOptionValue(o).trim())
                                                    .filter(Boolean)
                                                    .map((value: string) => {
                                                        const original = (variant.options || []).find((o: any) => getVariantOptionValue(o).trim() === value);
                                                        const out = isVariantOptionOutOfStock(original);
                                                        return (
                                                            <button
                                                                key={value}
                                                                type="button"
                                                                onClick={() => toggleVariantOptionAvailability(idx, value)}
                                                                className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${out
                                                                    ? 'border-red-200 bg-red-50 text-red-700'
                                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                    }`}
                                                            >
                                                                {value} — {out ? 'Rupture' : 'En stock'}
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                            <div className="text-[11px] text-[#888]">Cliquez sur une option pour basculer En stock / Rupture.</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {categoryAttributes.length > 0 && (
                        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                            <h4 className="text-sm font-bold text-[#333]">Attributs de la catégorie</h4>
                            <div className="space-y-4">
                                {categoryAttributes.map((attr: any) => (
                                    <div key={attr.id || attr.code || attr.name}>
                                        <p className="text-sm font-semibold text-[#333] mb-2">{attr.name}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(Array.isArray(attr.values) ? attr.values : []).map((v: any) => {
                                                const id = Number(v?.id);
                                                if (!Number.isFinite(id)) return null;
                                                const selected = Array.isArray(form.attributeValueIds) && form.attributeValueIds.includes(id);
                                                return (
                                                    <button
                                                        key={id}
                                                        type="button"
                                                        onClick={() => {
                                                            const attrValueIds = new Set((Array.isArray(form.attributeValueIds) ? form.attributeValueIds : []).map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n)));
                                                            const attrValueIdSet = new Set((Array.isArray(attr.values) ? attr.values : []).map((vv: any) => Number(vv?.id)).filter((n: any) => Number.isFinite(n)));
                                                            const isMulti = attr?.isMulti !== false;
                                                            if (!isMulti) {
                                                                [...attrValueIds].forEach(existingId => {
                                                                    if (attrValueIdSet.has(existingId)) attrValueIds.delete(existingId);
                                                                });
                                                            }
                                                            if (selected) attrValueIds.delete(id);
                                                            else attrValueIds.add(id);
                                                            setForm(f => ({ ...f, attributeValueIds: [...attrValueIds] }));
                                                        }}
                                                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${selected
                                                            ? 'border-[var(--yp-blue)] bg-[var(--yp-blue)]/10 text-[var(--yp-blue)]'
                                                            : 'border-gray-200 hover:border-gray-300 text-[#666] bg-white'
                                                            }`}
                                                    >
                                                        {v.value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                            <div className="flex items-end pb-1">
                                <div className="space-y-1">
                                    <label className="flex items-center gap-2 cursor-pointer mt-7">
                                        <input type="checkbox" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))}
                                            className="w-4 h-4 rounded border-gray-300 text-[var(--yp-blue)] focus:ring-[var(--yp-blue)]" />
                                        <span className={`text-sm font-semibold ${form.inStock ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {form.inStock ? '📦 En stock' : '⛔ Rupture de stock'}
                                        </span>
                                    </label>
                                    <div className="text-[11px] text-[#888]">
                                        {form.inStock ? 'Décochez pour mettre en rupture de stock.' : 'Visible sur le site, mais panier/commande bloqués.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isVisible} onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-[var(--yp-blue)] focus:ring-[var(--yp-blue)]" />
                                <span className="text-sm text-[#666]">👁 Visible sur le site</span>
                            </label>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════
                        PERFORMANCE (read-only, edit mode only)
                        ═══════════════════════════════════════════════ */}
                    {isEdit && (
                        <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-[#333] flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-emerald-500" /> Performance
                                </h4>
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Connecté à l'algorithme des ventes</span>
                            </div>
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
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-[var(--yp-blue)] text-white rounded-xl hover:bg-[var(--yp-blue-dark)] font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                            <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Ajouter')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
