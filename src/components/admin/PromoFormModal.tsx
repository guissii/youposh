import { useState } from 'react';
import { toast } from 'sonner';
import { X, Save, Ticket } from 'lucide-react';
import { createPromoCode, updatePromoCode } from '@/lib/api';

interface Props {
    promo?: any;
    onClose: () => void;
    onSave: () => void;
}

export const PromoFormModal = ({ promo, onClose, onSave }: Props) => {
    const isEdit = !!promo;
    const [form, setForm] = useState({
        code: promo?.code || '',
        description: promo?.description || '',
        discountType: promo?.discountType || 'percentage',
        discountValue: promo?.discountValue || 0,
        minOrder: promo?.minOrder || 0,
        maxUses: promo?.maxUses || 0,
        isActive: promo?.isActive ?? true,
        endDate: promo?.endDate ? new Date(promo.endDate).toISOString().slice(0, 10) : '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = {
                ...form,
                code: form.code.toUpperCase(),
                discountValue: Number(form.discountValue),
                minOrder: Number(form.minOrder),
                maxUses: Number(form.maxUses),
                endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
            };
            if (isEdit) await updatePromoCode(promo.id, data);
            else await createPromoCode(data);
            onSave();
        } catch (error: any) {
            console.error('Error saving promo:', error);
            toast.error(error.message || "Erreur lors de l'enregistrement du code promo");
        }
        finally { setSaving(false); }
    };

    const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-[var(--yp-blue)]/20 text-sm";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-[#333]">{isEdit ? 'Modifier le code' : 'Nouveau code promo'}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Code *</label>
                            <input type="text" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className={inputClass + " font-mono tracking-wider"} placeholder="PROMO2024" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Type de réduction</label>
                            <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className={inputClass}>
                                <option value="percentage">Pourcentage (%)</option>
                                <option value="fixed">Montant fixe (MAD)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-1">Description</label>
                        <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} placeholder="Réduction spéciale été..." />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Valeur *</label>
                            <input type="number" required step="0.01" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Min. commande</label>
                            <input type="number" step="0.01" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} className={inputClass} placeholder="0 = illimité" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Max utilisations</label>
                            <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} className={inputClass} placeholder="0 = illimité" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Date d'expiration</label>
                            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputClass} />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-[var(--yp-blue)] focus:ring-[var(--yp-blue)]" />
                                <span className="text-sm text-[#666]">✅ Actif</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-[#666] hover:bg-gray-50 font-medium">Annuler</button>
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                            <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Créer le code')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
