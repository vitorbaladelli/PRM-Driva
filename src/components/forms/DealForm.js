import React, { useState } from 'react';
import { FormInput, FormSelect, FormButton } from '../common/FormElements';

const DealForm = ({ onSubmit, partners, initialData }) => {
    const [formData, setFormData] = useState({
        clientName: initialData?.clientName || '',
        partnerId: initialData?.partnerId || '',
        submissionDate: initialData?.submissionDate?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        value: initialData?.value || '',
        status: initialData?.status || 'Pendente'
    });

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        const selectedPartner = partners.find(p => p.id === formData.partnerId);
        const dataToSubmit = {
            ...formData,
            value: formData.value,
            partnerName: selectedPartner ? selectedPartner.name : 'N/A'
        };
        onSubmit(dataToSubmit);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="clientName" name="clientName" label="Nome do Cliente Final" value={formData.clientName} onChange={handleChange} required />
            <FormSelect id="partnerId" name="partnerId" label="Parceiro Responsável" value={formData.partnerId} onChange={handleChange} required>
                <option value="">Selecione um parceiro</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </FormSelect>
            <FormInput id="submissionDate" name="submissionDate" label="Data da Indicação" type="date" value={formData.submissionDate} onChange={handleChange} required />
            <FormInput id="value" name="value" label="Valor Estimado (R$)" type="text" value={formData.value} onChange={handleChange} required placeholder="Ex: 1.250,50" />
            <FormSelect id="status" name="status" label="Status" value={formData.status} onChange={handleChange} required>
                <option>Pendente</option>
                <option>Aprovado</option>
                <option>Ganho</option>
                <option>Perdido</option>
            </FormSelect>
            <FormButton>{initialData?.id ? 'Salvar Alterações' : 'Registrar Oportunidade'}</FormButton>
        </form>
    );
};

export default DealForm;
