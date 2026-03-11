import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { X, Save, FolderOpen, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import { createAttributeLibraryItem, createCategory, fetchAttributeLibrary, updateCategory, uploadCategoryImage } from '@/lib/api';
import { loadStoreSettings } from '@/data/storeSettings';

interface Props {
    category?: any;
    onClose: () => void;
    onSave: () => void;
}

export const CategoryFormModal = ({ category, onClose, onSave }: Props) => {
    const isEdit = !!category;
    const [form, setForm] = useState({
        name: category?.name || '', nameAr: category?.nameAr || '',
        slug: category?.slug || '', icon: category?.icon || '',
        image: category?.image || '',
    });
    const [attributes, setAttributes] = useState<any[]>(() => {
        const attrs = category?.attributes;
        return Array.isArray(attrs)
            ? attrs.map((a: any) => ({
                id: a.id,
                code: a.code,
                name: a.name || '',
                nameAr: a.nameAr || '',
                isMulti: a.isMulti !== false,
                sortOrder: a.sortOrder ?? 0,
                values: Array.isArray(a.values) ? a.values.map((v: any) => ({
                    id: v.id,
                    value: v.value || '',
                    valueAr: v.valueAr || '',
                    sortOrder: v.sortOrder ?? 0,
                })) : [],
            }))
            : [];
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(category?.image || '');
    const [saving, setSaving] = useState(false);
    const [library, setLibrary] = useState<any[]>([]);
    const [libraryQuery, setLibraryQuery] = useState('');
    const [creatingLibrary, setCreatingLibrary] = useState(false);

    useEffect(() => {
        fetchAttributeLibrary().then(setLibrary).catch(() => { });
    }, []);

    const filteredLibrary = useMemo(() => {
        const q = libraryQuery.trim().toLowerCase();
        if (!q) return library;
        return library.filter((a: any) => {
            const name = String(a?.name ?? '').toLowerCase();
            const code = String(a?.code ?? '').toLowerCase();
            return name.includes(q) || code.includes(q);
        });
    }, [library, libraryQuery]);

    const recommendedCodes = useMemo(() => {
        const slug = String(form.slug || '').toLowerCase();
        const name = String(form.name || '').toLowerCase();
        const k = `${slug} ${name}`;
        if (/(mode|fashion|vetement|v[êe]tement)/.test(k)) return ['size', 'color', 'material', 'gender'];
        if (/(chauss|shoe)/.test(k)) return ['shoe_size', 'color', 'material', 'gender'];
        if (/(electron|gadget|gaming|informat|phone|smart)/.test(k)) return ['storage', 'ram', 'connectivity', 'color'];
        if (/(auto|moto|voiture)/.test(k)) return ['color', 'model', 'length', 'width', 'height'];
        return [];
    }, [form.slug, form.name]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let finalImageUrl = form.image;

            if (imageFile) {
                const settings = loadStoreSettings();
                const opacity = settings.watermarkEnabled ? settings.watermarkOpacity : 0;
                const size = settings.watermarkSize || 30;
                const uploadRes = await uploadCategoryImage(imageFile, opacity, size);
                finalImageUrl = uploadRes.url;
            }

            const data = {
                ...form,
                image: finalImageUrl,
                slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                attributes: attributes.map((a: any, i: number) => ({
                    id: a.id,
                    code: a.code,
                    globalAttributeId: a.globalAttributeId,
                    name: String(a.name ?? '').trim(),
                    nameAr: String(a.nameAr ?? '').trim(),
                    isMulti: a.isMulti !== false,
                    sortOrder: i,
                    values: (Array.isArray(a.values) ? a.values : []).map((v: any, j: number) => ({
                        id: v.id,
                        globalValueId: v.globalValueId,
                        value: String(v.value ?? '').trim(),
                        valueAr: String(v.valueAr ?? '').trim(),
                        sortOrder: j,
                    })).filter((v: any) => v.value.length > 0),
                })).filter((a: any) => a.name.length > 0),
            };

            if (isEdit) await updateCategory(category.id, data);
            else await createCategory(data);
            onSave();
        } catch (error: any) {
            console.error('Error saving category:', error);
            toast.error(error.message || "Erreur lors de l'enregistrement de la catégorie");
        }
        finally { setSaving(false); }
    };

    const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-[var(--yp-blue)]/20 text-sm";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center"><FolderOpen className="w-5 h-5 text-teal-600" /></div>
                        <h3 className="text-lg font-bold text-[#333]">{isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Nom (FR) *</label>
                            <input type="text" required value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Nom (AR)</label>
                            <input type="text" dir="rtl" value={form.nameAr} onChange={e => setForm((f: any) => ({ ...f, nameAr: e.target.value }))} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Slug *</label>
                            <input type="text" required value={form.slug} onChange={e => setForm((f: any) => ({ ...f, slug: e.target.value }))} className={inputClass} placeholder="electronique" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Icône</label>
                            <input type="text" value={form.icon} onChange={e => setForm((f: any) => ({ ...f, icon: e.target.value }))} className={inputClass} placeholder="Smartphone" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-2">Image de la catégorie</label>
                        <div className="flex items-center gap-4">
                            {/* Preview */}
                            <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                )}
                            </div>

                            {/* Upload Button */}
                            <div className="flex-1">
                                <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-500 hover:bg-teal-50 cursor-pointer transition-colors group">
                                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-teal-600" />
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-teal-600">
                                        {imageFile ? imageFile.name : "Cliquez pour uploader une image"}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                                <p className="text-xs text-gray-400 mt-1.5 ml-1">PNG, JPG, WEBP jusqu'à 5MB</p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-[#333]">Attributs (taille, couleur, etc.)</h4>
                            <button
                                type="button"
                                onClick={() => setAttributes(prev => ([...prev, { name: '', nameAr: '', code: '', isMulti: true, values: [] }]))}
                                className="text-sm text-[var(--yp-blue)] font-medium flex items-center gap-1 hover:underline"
                            >
                                <Plus className="w-4 h-4" /> Ajouter
                            </button>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider">Bibliothèque (prédéfinis)</p>
                                <div className="flex items-center gap-3">
                                    {recommendedCodes.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const existingCodes = new Set(attributes.map((x: any) => String(x.code || '').trim().toLowerCase()));
                                                const toAdd = library.filter((a: any) => recommendedCodes.includes(String(a.code || '').toLowerCase()));
                                                const nextAttrs = toAdd
                                                    .filter((a: any) => !existingCodes.has(String(a.code || '').trim().toLowerCase()))
                                                    .map((a: any) => ({
                                                        globalAttributeId: a.id,
                                                        code: a.code,
                                                        name: a.name,
                                                        nameAr: a.nameAr,
                                                        isMulti: a.isMulti !== false,
                                                        values: Array.isArray(a.values) ? a.values.map((v: any) => ({
                                                            globalValueId: v.id,
                                                            value: v.value,
                                                            valueAr: v.valueAr,
                                                        })) : [],
                                                    }));
                                                if (nextAttrs.length) setAttributes(prev => [...prev, ...nextAttrs]);
                                            }}
                                            className="text-xs font-semibold text-[var(--yp-blue)] hover:underline"
                                        >
                                            + Suggestions
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        disabled={creatingLibrary}
                                        onClick={async () => {
                                            const name = libraryQuery.trim();
                                            if (!name) return;
                                            setCreatingLibrary(true);
                                            try {
                                                const created = await createAttributeLibraryItem({ name, code: name, values: [] });
                                                setLibrary(prev => [created, ...prev]);
                                                setLibraryQuery('');
                                            } catch { }
                                            finally { setCreatingLibrary(false); }
                                        }}
                                        className="text-xs font-semibold text-[var(--yp-blue)] hover:underline disabled:opacity-50"
                                    >
                                        + Créer
                                    </button>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={libraryQuery}
                                onChange={e => setLibraryQuery(e.target.value)}
                                className={inputClass}
                                placeholder="Rechercher un attribut (ex: taille, couleur, ram...)"
                            />
                            {filteredLibrary.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {filteredLibrary.slice(0, 12).map((a: any) => {
                                        const already = attributes.some((x: any) => String(x.code || '').trim().toLowerCase() === String(a.code || '').trim().toLowerCase());
                                        return (
                                            <button
                                                key={a.id || a.code}
                                                type="button"
                                                disabled={already}
                                                onClick={() => {
                                                    const next = {
                                                        globalAttributeId: a.id,
                                                        code: a.code,
                                                        name: a.name,
                                                        nameAr: a.nameAr,
                                                        isMulti: a.isMulti !== false,
                                                        values: Array.isArray(a.values) ? a.values.map((v: any) => ({
                                                            globalValueId: v.id,
                                                            value: v.value,
                                                            valueAr: v.valueAr,
                                                        })) : [],
                                                    };
                                                    setAttributes(prev => [...prev, next]);
                                                }}
                                                className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${already
                                                    ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-200 bg-white hover:bg-gray-50 text-[#333]'
                                                    }`}
                                            >
                                                {a.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {attributes.length === 0 && (
                            <div className="text-xs text-gray-400">Aucun attribut pour cette catégorie.</div>
                        )}
                        <div className="space-y-3">
                            {attributes.map((attr: any, idx: number) => (
                                <div key={idx} className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-3 relative">
                                    <button
                                        type="button"
                                        onClick={() => setAttributes(prev => prev.filter((_: any, i: number) => i !== idx))}
                                        className="absolute right-2 top-2 p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="grid grid-cols-2 gap-3 pr-8">
                                        <input
                                            type="text"
                                            placeholder="Nom (FR) (ex: Taille)"
                                            value={attr.name}
                                            onChange={e => setAttributes(prev => prev.map((a: any, i: number) => i === idx ? { ...a, name: e.target.value } : a))}
                                            className={inputClass}
                                        />
                                        <input
                                            type="text"
                                            dir="rtl"
                                            placeholder="Nom (AR)"
                                            value={attr.nameAr}
                                            onChange={e => setAttributes(prev => prev.map((a: any, i: number) => i === idx ? { ...a, nameAr: e.target.value } : a))}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Code (optionnel) (ex: size)"
                                            value={attr.code}
                                            onChange={e => setAttributes(prev => prev.map((a: any, i: number) => i === idx ? { ...a, code: e.target.value } : a))}
                                            className={inputClass}
                                        />
                                        <label className="flex items-center gap-2 text-sm text-[#666] px-2">
                                            <input
                                                type="checkbox"
                                                checked={attr.isMulti !== false}
                                                onChange={e => setAttributes(prev => prev.map((a: any, i: number) => i === idx ? { ...a, isMulti: e.target.checked } : a))}
                                                className="w-4 h-4 rounded border-gray-300 text-[var(--yp-blue)] focus:ring-[var(--yp-blue)]"
                                            />
                                            Multi-sélection
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold text-[var(--yp-gray-500)] uppercase tracking-wider">Valeurs</p>
                                            <button
                                                type="button"
                                                onClick={() => setAttributes(prev => prev.map((a: any, i: number) => i === idx ? { ...a, values: [...(a.values || []), { value: '', valueAr: '' }] } : a))}
                                                className="text-xs text-[var(--yp-blue)] font-semibold flex items-center gap-1 hover:underline"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Ajouter
                                            </button>
                                        </div>
                                        {Array.isArray(attr.values) && attr.values.length > 0 ? (
                                            <div className="space-y-2">
                                                {attr.values.map((v: any, vIdx: number) => (
                                                    <div key={vIdx} className="grid grid-cols-2 gap-3 relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Valeur (FR) (ex: S)"
                                                            value={v.value}
                                                            onChange={e => setAttributes(prev => prev.map((a: any, i: number) => {
                                                                if (i !== idx) return a;
                                                                const next = [...(a.values || [])];
                                                                next[vIdx] = { ...next[vIdx], value: e.target.value };
                                                                return { ...a, values: next };
                                                            }))}
                                                            className={inputClass}
                                                        />
                                                        <input
                                                            type="text"
                                                            dir="rtl"
                                                            placeholder="Valeur (AR)"
                                                            value={v.valueAr}
                                                            onChange={e => setAttributes(prev => prev.map((a: any, i: number) => {
                                                                if (i !== idx) return a;
                                                                const next = [...(a.values || [])];
                                                                next[vIdx] = { ...next[vIdx], valueAr: e.target.value };
                                                                return { ...a, values: next };
                                                            }))}
                                                            className={inputClass}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttributes(prev => prev.map((a: any, i: number) => {
                                                                if (i !== idx) return a;
                                                                return { ...a, values: (a.values || []).filter((_: any, j: number) => j !== vIdx) };
                                                            }))}
                                                            className="absolute -right-1 -top-1 p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-400">Ajoutez des valeurs (ex: S, M, L).</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-[#666] hover:bg-gray-50 font-medium">Annuler</button>
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                            <Save className="w-4 h-4" />{saving ? '...' : (isEdit ? 'Modifier' : 'Créer')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
