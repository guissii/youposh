import { useState } from 'react';
import { X, Save, FolderOpen, Upload, Image as ImageIcon } from 'lucide-react';
import { createCategory, updateCategory, uploadCategoryImage } from '@/lib/api';
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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(category?.image || '');
    const [saving, setSaving] = useState(false);

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
                slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            };

            if (isEdit) await updateCategory(category.id, data);
            else await createCategory(data);
            onSave();
        } catch (error) { console.error('Error saving category:', error); }
        finally { setSaving(false); }
    };

    const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20 text-sm";

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
