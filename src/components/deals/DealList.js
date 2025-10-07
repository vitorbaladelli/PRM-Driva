import React, { useMemo, useEffect } from 'react';
import { formatCurrency, parseBrazilianCurrency } from '../../utils/formatter';
import usePagination from '../../hooks/usePagination';
import ActionsMenu from '../common/ActionsMenu';

const DealList = ({ deals, partners, onEdit, onDelete, selectedDeals, setSelectedDeals, isMini = false }) => {
    const statusColors = { 'Pendente': 'bg-yellow-100 text-yellow-800', 'Aprovado': 'bg-blue-100 text-blue-800', 'Ganho': 'bg-green-100 text-green-800', 'Perdido': 'bg-red-100 text-red-800' };

    const [paginatedDeals, PaginatorComponent] = usePagination(deals);

    useEffect(() => {
        if(setSelectedDeals) {
            setSelectedDeals([]);
        }
    }, [deals.length, setSelectedDeals]); // Removido currentPage para evitar resetar a seleção ao paginar

    const handleSelectAll = (e) => setSelectedDeals(e.target.checked ? paginatedDeals.map(d => d.id) : []);
    const handleSelectOne = (e, id) => setSelectedDeals(e.target.checked ? [...selectedDeals, id] : selectedDeals.filter(dealId => dealId !== id));

    const partnerNameMap = useMemo(() => {
        if (!partners) return {};
        const map = {};
        partners.forEach(p => { map[p.id] = p.name; });
        return map;
    }, [partners]);

    return (
        <div className={!isMini ? "bg-white rounded-xl shadow-md" : ""}>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className={!isMini ? "bg-slate-50 border-b border-slate-200" : ""}>
                        <tr>
                            {!isMini && <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={paginatedDeals.length > 0 && selectedDeals.length === paginatedDeals.length} className="rounded" /></th>}
                            {!isMini && <th className="p-4 font-semibold text-slate-600">Data</th>}
                            <th className="p-4 font-semibold text-slate-600">Cliente Final</th>
                            <th className="p-4 font-semibold text-slate-600">Parceiro</th>
                            <th className="p-4 font-semibold text-slate-600">Valor</th>
                            <th className="p-4 font-semibold text-slate-600">Status</th>
                            {!isMini && <th className="p-4 font-semibold text-slate-600">Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedDeals.map(d => (<tr key={d.id} className={`border-b border-slate-100 ${selectedDeals && selectedDeals.includes(d.id) ? 'bg-sky-50' : 'hover:bg-slate-50'}`}>
                            {!isMini && <td className="p-4"><input type="checkbox" checked={selectedDeals && selectedDeals.includes(d.id)} onChange={(e) => handleSelectOne(e, d.id)} className="rounded" /></td>}
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
            {deals.length === 0 && <p className="p-4 text-center text-gray-500">Nenhuma oportunidade encontrada.</p>}
            {!isMini && <PaginatorComponent />}
        </div>
    );
};

export default DealList;
