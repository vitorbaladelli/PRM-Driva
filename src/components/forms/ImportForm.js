import React, { useState } from 'react';
import { FormButton } from '../common/FormElements';

const ImportForm = ({ collectionName, onSubmit, closeModal, partners }) => {
    const [file, setFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState('');
    const [selectedPartnerId, setSelectedPartnerId] = useState('');

    const instructions = {
        partners: 'A planilha CSV deve conter as colunas: name, type, contactName, contactEmail.',
        deals: 'A planilha CSV deve conter as colunas: clientName, value, status, submissionDate (formato AAAA-MM-DD). Todas as oportunidades serão associadas ao parceiro selecionado abaixo.'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { setImportStatus('Por favor, selecione um arquivo .csv'); return; }
        if (collectionName === 'deals' && !selectedPartnerId) {
            setImportStatus('Por favor, selecione um parceiro para associar as oportunidades.');
            return;
        }
        setIsImporting(true); setImportStatus('Importando...');
        try {
            const { successfulImports, failedImports } = await onSubmit(file, collectionName, selectedPartnerId);
            setImportStatus(`${successfulImports} itens importados com sucesso. ${failedImports > 0 ? `${failedImports} linhas ignoradas.` : ''}`);
            setTimeout(() => closeModal(), 3000);
        } catch (error) { setImportStatus('Ocorreu um erro durante a importação.'); console.error(error); }
        finally { setIsImporting(false); }
    };

    const requiresPartnerSelection = collectionName === 'deals';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{instructions[collectionName]}</p>

            {requiresPartnerSelection && partners?.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Associar a qual parceiro?</label>
                    <select
                        value={selectedPartnerId}
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Selecione um parceiro</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            )}

            <div>
                <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-2">Selecione um arquivo .csv</label>
                <input id="csv-upload" type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
            </div>
            {importStatus && <p className="text-sm text-center font-medium text-gray-600">{importStatus}</p>}
            <FormButton disabled={isImporting || !file}>{isImporting ? 'Importando...' : 'Iniciar Importação'}</FormButton>
        </form>
    );
};

export default ImportForm;
