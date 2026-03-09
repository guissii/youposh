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

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-700';
        case 'processing': return 'bg-blue-100 text-blue-700';
        case 'cancelled': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

export const getStatusLabel = (status: string) => {
    switch (status) {
        case 'pending': return 'En attente';
        case 'processing': return 'Traitement';
        case 'cancelled': return 'Annulé';
        default: return status;
    }
};
