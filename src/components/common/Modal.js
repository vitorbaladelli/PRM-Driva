import React from 'react';
import { X } from 'lucide-react';
import PartnerForm from '../forms/PartnerForm';
import DealForm from '../forms/DealForm';
import ResourceForm from '../forms/ResourceForm';
import NurturingForm from '../forms/NurturingForm';
import ActivityForm from '../forms/ActivityForm';
import ImportForm from '../forms/ImportForm';

const Modal = ({ closeModal, modalType, handleAdd, handleUpdate, handleImport, partners, initialData }) => {
    const isEditMode = !!(initialData && initialData.id);

    // Lógica centralizada para submissão
    const handleFormSubmit = (formData) => {
        const collectionMap = {
            partner: 'partners',
            deal: 'deals',
            resource: 'resources',
            nurturing: 'nurturing',
            activity: 'activities',
        };
        const collectionName = collectionMap[modalType];

        if (isEditMode) {
            handleUpdate(collectionName, initialData.id, formData);
        } else {
            handleAdd(collectionName, formData);
        }
    };

    const renderForm = () => {
        switch (modalType) {
            case 'partner': return <PartnerForm onSubmit={handleFormSubmit} initialData={initialData} />;
            case 'deal': return <DealForm onSubmit={handleFormSubmit} partners={partners} initialData={initialData} />;
            case 'resource': return <ResourceForm onSubmit={handleFormSubmit} initialData={initialData} />;
            case 'nurturing': return <NurturingForm onSubmit={handleFormSubmit} initialData={initialData} />;
            case 'activity': return <ActivityForm onSubmit={handleFormSubmit} initialData={initialData} />;
            case 'importPartners': return <ImportForm collectionName="partners" onSubmit={handleImport} closeModal={closeModal} partners={partners} />;
            case 'importDeals': return <ImportForm collectionName="deals" partners={partners} onSubmit={handleImport} closeModal={closeModal} />;
            default: return null;
        }
    };
    const titles = {
        partner: isEditMode ? 'Editar Parceiro' : 'Adicionar Parceiro',
        deal: isEditMode ? 'Editar Oportunidade' : 'Registrar Oportunidade',
        resource: isEditMode ? 'Editar Recurso' : 'Adicionar Recurso',
        nurturing: isEditMode ? 'Editar Conteúdo' : 'Adicionar Conteúdo',
        activity: isEditMode ? 'Editar Atividade' : 'Adicionar Atividade',
        importPartners: 'Importar Planilha de Parceiros',
        importDeals: 'Importar Planilha de Oportunidades'
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">{titles[modalType]}</h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">{renderForm()}</div>
            </div>
        </div>
    );
};

export default Modal;
