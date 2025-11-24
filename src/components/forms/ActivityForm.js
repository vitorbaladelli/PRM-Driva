import React, { useState } from 'react';
import { FormInput, FormSelect, FormTextarea, FormButton } from '../common/FormElements';

const ActivityForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        category: initialData?.category || 'Reunião',
        partnerId: initialData?.partnerId,
        partnerName: initialData?.partnerName
    });

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="title" name="title" label="Título da Atividade" value={formData.title} onChange={handleChange} required />
            <FormSelect id="category" name="category" label="Categoria" value={formData.category} onChange={handleChange} required>
                <option>Reunião</option>
                <option>Ligação</option>
                <option>Email</option>
                <option>Outro</option>
            </FormSelect>
            <FormTextarea id="description" name="description" label="Descrição" value={formData.description} onChange={handleChange} required />
            <FormButton>{initialData?.id ? 'Salvar Alterações' : 'Salvar Atividade'}</FormButton>
        </form>
    );
};

export default ActivityForm;
