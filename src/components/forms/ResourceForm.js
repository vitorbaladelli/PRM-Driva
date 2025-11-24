import React, { useState } from 'react';
import { FormInput, FormSelect, FormTextarea, FormButton } from '../common/FormElements';

const ResourceForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        url: initialData?.url || '',
        category: initialData?.category || 'Marketing'
    });

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="title" name="title" label="Título do Recurso" value={formData.title} onChange={handleChange} required />
            <FormTextarea id="description" name="description" label="Descrição" value={formData.description} onChange={handleChange} required />
            <FormInput id="url" name="url" label="URL do Recurso" type="url" value={formData.url} onChange={handleChange} required />
            <FormSelect id="category" name="category" label="Categoria" value={formData.category} onChange={handleChange} required>
                <option>Marketing</option>
                <option>Vendas</option>
                <option>Técnico</option>
                <option>Legal</option>
            </FormSelect>
            <FormButton>{initialData?.id ? 'Salvar Alterações' : 'Salvar Recurso'}</FormButton>
        </form>
    );
};

export default ResourceForm;
