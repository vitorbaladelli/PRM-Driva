import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { formatCurrency } from '../../utils/formatter';
import usePagination from '../../hooks/usePagination';
import ActionsMenu from '../common/ActionsMenu';

const PartnerList = ({ partners, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPartners = useMemo(() => {
        if (!searchTerm) return partners;
        const lowerTerm = searchTerm.toLowerCase();
        return partners.filter(p =>
            p.name.toLowerCase().includes(lowerTerm) ||
            p.type.toLowerCase().includes(lowerTerm) ||
            (p.contactName && p.contactName.toLowerCase().includes(lowerTerm))
        );
    }, [partners, searchTerm]);

    const [paginatedPartners, PaginatorComponent] = usePagination(filteredPartners);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Parceiros</h2>
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar parceiros..."
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition duration-150 ease-in-out"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Nome do Parceiro</th>
                                <th className="p-4 font-semibold text-slate-600">Tipo</th>
                                <th className="p-4 font-semibold text-slate-600">Nível</th>
                                <th className="p-4 font-semibold text-slate-600">Pagamentos Recebidos</th>
                                <th className="p-4 font-semibold text-slate-600">Receita Gerada (Ganhos)</th>
                                <th className="p-4 font-semibold text-slate-600">Comissão a Pagar</th>
                                <th className="p-4 font-semibold text-slate-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPartners.map(p => (
                                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/partners/${p.id}`)}>
                                    <td className="p-4 text-slate-800 font-medium">{p.name}</td>
                                    <td className="p-4 text-slate-600">{p.type}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center w-fit ${p.tier.bgColor} ${p.tier.color}`}>
                                            <p.tier.icon className="h-4 w-4 mr-2" />
                                            {p.tier.name}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 font-medium">{formatCurrency(p.paymentsReceived)}</td>
                                    <td className="p-4 text-slate-600 font-medium">{formatCurrency(p.generatedRevenue)}</td>
                                    <td className="p-4 text-green-600 font-bold">{formatCurrency(p.commissionToPay)}</td>
                                    <td className="p-4 relative" onClick={(e) => e.stopPropagation()}>
                                        <ActionsMenu onEdit={() => onEdit('partner', p)} onDelete={() => onDelete('partners', p.id)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredPartners.length === 0 && <p className="p-4 text-center text-gray-500">Nenhum parceiro encontrado.</p>}
                <PaginatorComponent />
            </div>
        </div>
    )
};

export default PartnerList;
