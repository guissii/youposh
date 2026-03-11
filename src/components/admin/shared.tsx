import { AlertCircle } from 'lucide-react';

export const ConfirmModal = ({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#333] mb-2">Confirmation</h3>
            <p className="text-[#666] mb-6">{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-[#666] hover:bg-gray-50 font-medium">Annuler</button>
                <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium">Supprimer</button>
            </div>
        </div>
    </div>
);

type StatusMeta = { label: string; color: string };

const ORDER_STATUS_MAP: Record<string, StatusMeta> = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    processing: { label: 'En cours de traitement', color: 'bg-blue-100 text-blue-700' },
    shipped: { label: 'Confirmée', color: 'bg-violet-100 text-violet-700' },
    delivered: { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700' },
    completed: { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
};

const DELIVERY_STATUS_MAP: Record<string, StatusMeta> = {
    not_shipped: { label: 'Non expédiée', color: 'bg-gray-100 text-gray-700' },
    prepared: { label: 'Préparée', color: 'bg-blue-100 text-blue-700' },
    shipped: { label: 'Expédiée', color: 'bg-amber-100 text-amber-700' },
    delivered: { label: 'Livrée', color: 'bg-emerald-100 text-emerald-700' },
    returned: { label: 'Retour', color: 'bg-rose-100 text-rose-700' },
};

export const getDeliveryStatusFromOrderStatus = (status: string) => {
    if (status === 'cancelled') return 'returned';
    if (status === 'pending') return 'not_shipped';
    if (status === 'processing') return 'prepared';
    if (status === 'shipped') return 'shipped';
    if (status === 'delivered' || status === 'completed') return 'delivered';
    return 'not_shipped';
};

export const getOrderStatusColor = (status: string) => ORDER_STATUS_MAP[status]?.color || 'bg-gray-100 text-gray-700';
export const getOrderStatusLabel = (status: string) => ORDER_STATUS_MAP[status]?.label || status;

export const getDeliveryStatusColor = (deliveryStatus: string) => DELIVERY_STATUS_MAP[deliveryStatus]?.color || 'bg-gray-100 text-gray-700';
export const getDeliveryStatusLabel = (deliveryStatus: string) => DELIVERY_STATUS_MAP[deliveryStatus]?.label || deliveryStatus;

export const getStatusColor = getOrderStatusColor;
export const getStatusLabel = getOrderStatusLabel;
