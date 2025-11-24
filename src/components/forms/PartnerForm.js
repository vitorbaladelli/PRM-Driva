import React, { useState } from 'react';
import { FormInput, FormSelect, FormButton } from '../common/FormElements';

const PartnerForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        type: initialData?.type || 'Finder',
        tier: initialData?.tier || 'Prata',
        contactName: initialData?.contactName || '',
        contactEmail: initialData?.contactEmail || ''
    });

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="name" name="name" label="Nome do Parceiro" value={formData.name} onChange={handleChange} required />
            <FormSelect id="type" name="type" label="Tipo de Parceiro" value={formData.type} onChange={handleChange} required>
                <option value="Finder">Finder</option>
                <option value="Seller">Seller</option>
            </FormSelect>
            <FormSelect id="tier" name="tier" label="Nível de Parceria" value={formData.tier} onChange={handleChange} required>
                <option value="Prata">Prata</option>
                <option value="Ouro">Ouro</option>
                <option value="Diamante">Diamante</option>
            </FormSelect>
            <FormInput id="contactName" name="contactName" label="Nome do Contato" value={formData.contactName} onChange={handleChange} required />
            <FormInput id="contactEmail" name="contactEmail" label="Email do Contato" type="email" value={formData.contactEmail} onChange={handleChange} required />
            <FormButton>{initialData?.id ? 'Salvar Alterações' : 'Salvar Parceiro'}</FormButton>
        </form>
    );
};

export default PartnerForm;
