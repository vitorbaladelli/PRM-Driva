import React from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Upload, Trash2, Filter, XCircle } from 'lucide-react';

const Header = ({ openModal, startDate, endDate, setStartDate, setEndDate, selectedDealsCount, onBulkDeleteDeals, selectedPaymentsCount, onBulkDeletePayments }) => {
    const location = useLocation();
    const isDetailView = location.pathname.includes('/partners/');
    const viewTitles = {
        '/': 'Dashboard de Canais',
        '/partners': 'Gestão de Parceiros',
        '/opportunities': 'Oportunidades',
        '/commissioning': 'Cálculo de Comissionamento',
        '/resources': 'Central de Recursos',
        '/nurturing': 'Nutrição de Parceiros',
        detail: 'Detalhes do Parceiro'
    };
    const currentTitle = isDetailView ? viewTitles.detail : (viewTitles[location.pathname] || 'PRM Driva');
    const buttonInfo = {
        '/partners': { label: 'Novo Parceiro', action: () => openModal('partner') },
        '/opportunities': { label: 'Registrar Oportunidade', action: () => openModal('deal') },
        '/resources': { label: 'Novo Recurso', action: () => openModal('resource') },
        '/nurturing': { label: 'Novo Conteúdo', action: () => openModal('nurturing') },
    };
    const showFilters = ['/', '/partners', '/opportunities', '/commissioning'].includes(location.pathname) || isDetailView;

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{currentTitle}</h1>
                <div className="flex items-center gap-2">
                    {location.pathname === '/partners' && (
                        <button onClick={() => openModal('importPartners')} className="flex items-center bg-white text-sky-500 border border-sky-500 px-4 py-2 rounded-lg shadow-sm hover:bg-sky-50">
                            <Upload className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Importar Parceiros</span>
                        </button>
                    )}
                    {location.pathname === '/opportunities' && selectedDealsCount > 0 && (
                        <button onClick={onBulkDeleteDeals} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-red-700">
                            <Trash2 className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Excluir ({selectedDealsCount})</span>
                        </button>
                    )}
                    {location.pathname === '/opportunities' && (
                        <button onClick={() => openModal('importDeals')} className="flex items-center bg-white text-sky-500 border border-sky-500 px-4 py-2 rounded-lg shadow-sm hover:bg-sky-50">
                            <Upload className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Importar Oportunidades</span>
                        </button>
                    )}
                    {location.pathname === '/commissioning' && selectedPaymentsCount > 0 && (
                        <button onClick={onBulkDeletePayments} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-red-700">
                            <Trash2 className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Excluir ({selectedPaymentsCount})</span>
                        </button>
                    )}
                    {location.pathname === '/commissioning' && (
                        <button onClick={() => openModal('importPayments')} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-600">
                            <Upload className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Importar Pagamentos</span>
                        </button>
                    )}
                    {buttonInfo[location.pathname] && (
                        <button onClick={() => buttonInfo[location.pathname].action()} className="flex items-center bg-sky-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-sky-600">
                            <Plus className="h-5 w-5 mr-2" />
                            <span className="font-semibold">{buttonInfo[location.pathname].label}</span>
                        </button>
                    )}
                </div>
            </div>
            {showFilters && (
                <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center gap-4">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <div className="flex items-center gap-2">
                        <label htmlFor="start-date" className="text-sm font-medium text-gray-700">De:</label>
                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="end-date" className="text-sm font-medium text-gray-700">Até:</label>
                        <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="flex items-center text-sm text-gray-600 hover:text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Limpar Filtro
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Header;
