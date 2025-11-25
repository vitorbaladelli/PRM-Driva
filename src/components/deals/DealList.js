import React, { useMemo, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { formatCurrency, parseBrazilianCurrency } from '../../utils/formatter';
import usePagination from '../../hooks/usePagination';
import ActionsMenu from '../common/ActionsMenu';

const DealList = ({ deals = [], partners = [], onEdit, onDelete, selectedDeals = [], setSelectedDeals, isMini = false }) => {
    const statusColors = { 'Pendente': 'bg-yellow-100 text-yellow-800', 'Aprovado': 'bg-blue-100 text-blue-800', 'Ganho': 'bg-green-100 text-green-800', 'Perdido': 'bg-red-100 text-red-800' };
    const [searchTerm, setSearchTerm] = useState('');

    // Ensure selectedDeals is always an array
    const safeSelectedDeals = Array.isArray(selectedDeals) ? selectedDeals : [];

    const partnerNameMap = useMemo(() => {
        if (!Array.isArray(partners)) return {};
        const map = {};
        partners.forEach(p => { map[p.id] = p.name; });
        return map;
    }, [partners]);

    const handleSelectAll = (e) => setSelectedDeals(e.target.checked ? paginatedDeals.map(d => d.id) : []);
    const handleSelectOne = (e, id) => setSelectedDeals(e.target.checked ? [...safeSelectedDeals, id] : safeSelectedDeals.filter(dealId => dealId !== id));

    const filteredDeals = useMemo(() => {
        if (!Array.isArray(deals)) return [];
        return deals.filter(deal => {
            const searchLower = searchTerm.toLowerCase();
            const clientName = deal.clientName?.toLowerCase() || '';
            const partnerName = (partnerNameMap[deal.partnerId] || deal.partnerName || '').toLowerCase();

            return clientName.includes(searchLower) || partnerName.includes(searchLower);
        });
    }, [deals, searchTerm, partnerNameMap]);

    const [paginatedDeals, PaginatorComponent] = usePagination(filteredDeals, 10);

    return (
        <div className="space-y-4">
            {!isMini && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Oportunidades</h2>
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar oportunidades..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition duration-150 ease-in-out"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className={!isMini ? "bg-white rounded-xl shadow-md" : ""}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={!isMini ? "bg-slate-50 border-b border-slate-200" : ""}>
                            <tr>
                                {!isMini && <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={paginatedDeals.length > 0 && safeSelectedDeals.length === paginatedDeals.length} className="rounded" /></th>}
                                {!isMini && <th className="p-4 font-semibold text-slate-600">Data</th>}
                                <th className="p-4 font-semibold text-slate-600">Cliente Final</th>
                                <th className="p-4 font-semibold text-slate-600">Parceiro</th>
                                <th className="p-4 font-semibold text-slate-600">Valor</th>
                                <th className="p-4 font-semibold text-slate-600">Status</th>
                                {!isMini && <th className="p-4 font-semibold text-slate-600">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDeals.map(d => (<tr key={d.id} className={`border-b border-slate-100 ${safeSelectedDeals.includes(d.id) ? 'bg-sky-50' : 'hover:bg-slate-50'}`}>
                                {!isMini && <td className="p-4"><input type="checkbox" checked={safeSelectedDeals.includes(d.id)} onChange={(e) => handleSelectOne(e, d.id)} className="rounded" /></td>}
                                {!isMini && <td className="p-4 text-slate-600">{d.submissionDate?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</td>}
                                <td className="p-4 text-slate-800 font-medium">{d.clientName}</td>
                                <td className="p-4 text-slate-600">{partnerNameMap[d.partnerId] || d.partnerName || 'Desconhecido'}</td>
                                <td className="p-4 text-slate-600">{formatCurrency(parseBrazilianCurrency(d.value))}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded-full text-sm font-semibold ${statusColors[d.status] || 'bg-gray-100'}`}>{d.status}</span></td>
                                {!isMini && <td className="p-4 relative"><ActionsMenu onEdit={() => onEdit(d)} onDelete={() => onDelete('deals', d.id)} /></td>}
                            </tr>))}
                        </tbody>
                    </table>
                </div>
                {filteredDeals.length === 0 && <p className="p-4 text-center text-gray-500">Nenhuma oportunidade encontrada.</p>}
                {!isMini && <PaginatorComponent />}
            </div>
        </div>
    );
};

export default DealList;
