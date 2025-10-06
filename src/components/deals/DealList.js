import React from 'react';
import { useMemo, useState, useEffect, useRef } from 'react'; // Adicionado useRef
import { Edit, Trash2, MoreVertical } from 'lucide-react'; // Adicionado Ícones
import { formatCurrency, parseBrazilianCurrency } from '../../utils/formatter';

// Componentes genéricos que serão refatorados depois
const Paginator = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center mt-4 p-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50">
                {'<'} {/* CORREÇÃO AQUI */}
            </button>
            <span className="px-4 text-sm font-medium">Página {currentPage} de {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50">
                {'>'} {/* CORREÇÃO AQUI */}
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
                            {!isMini && <td className="p-4 relative"><ActionsMenu onEdit={() => onEdit('deal', d)} onDelete={() => onDelete('deals', d.id)} /></td>}
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
