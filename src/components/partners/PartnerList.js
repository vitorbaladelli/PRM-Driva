import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatter';
import usePagination from '../../hooks/usePagination';
import ActionsMenu from '../common/ActionsMenu';

const PartnerList = ({ partners, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const [paginatedPartners, PaginatorComponent] = usePagination(partners);

    return (
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
         {partners.length === 0 && <p className="p-4 text-center text-gray-500">Nenhum parceiro registrado.</p>}
         <PaginatorComponent />
    </div>
    )
};

export default PartnerList;
