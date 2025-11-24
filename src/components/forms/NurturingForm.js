import React, { useState } from 'react';
import { FormInput, FormTextarea, FormButton } from '../common/FormElements';

const NurturingForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        content: initialData?.content || ''
    });

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="title" name="title" label="Título do Conteúdo" value={formData.title} onChange={handleChange} required />
            <FormTextarea id="content" name="content" label="Conteúdo/Direcionamento" value={formData.content} onChange={handleChange} required />
            <FormButton>{initialData?.id ? 'Salvar Alterações' : 'Publicar Conteúdo'}</FormButton>
        </form>
    );
};

export default NurturingForm;
