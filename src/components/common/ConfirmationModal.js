import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ onConfirm, onCancel, title = "Confirmar Exclusão", message = "Tem a certeza de que deseja excluir este item? Esta ação não pode ser desfeita." }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="mx-auto bg-red-100 rounded-full h-12 w-12 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-4">{title}</h3>
            <p className="text-sm text-gray-500 mt-2">{message}</p>
            <div className="mt-6 flex justify-center gap-4">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-semibold">Cancelar</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">Confirmar Exclusão</button>
            </div>
        </div>
    </div>
);

export default ConfirmationModal;
