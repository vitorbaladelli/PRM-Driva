import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, MoreVertical } from 'lucide-react';

// Funções e componentes que serão movidos para ficheiros de utilitários mais tarde
const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (isNaN(numberValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
};

const Paginator = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center mt-4 p-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50">
                {'<'}
            </button>
            <span className="px-4 text-sm font-medium">Página {currentPage} de {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50">
                {'>'}
            </button>
        </div>
    );
};

const usePagination = (data, itemsPerPage = 10) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        return data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [data, currentPage, itemsPerPage]);

    useEffect(() => {
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      } else if (currentPage < 1 && totalPages > 0) {
        setCurrentPage(1);
      } else if (data.length > 0 && totalPages > 0 && currentPage === 0) {
        setCurrentPage(1);
      }
    }, [data.length, totalPages, currentPage]);

    const PaginatorComponent = () => <Paginator currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />;

    return [paginatedData, PaginatorComponent, currentPage, setCurrentPage];
};

const ActionsMenu = ({ onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => { const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
    return (<div className="relative" ref={menuRef}><button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-200"><MoreVertical size={18} /></button>{isOpen && (<div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border"><button onClick={(e) => { e.stopPropagation(); onEdit(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"><Edit size={16} className="mr-2" /> Editar</button><button onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"><Trash2 size={16} className="mr-2" /> Excluir</button></div>)}</div>);
};


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
