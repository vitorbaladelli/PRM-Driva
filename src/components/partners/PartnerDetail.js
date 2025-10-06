import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft, User, TrendingUp, Plus, Activity as ActivityIcon,
    Calendar, Tag, MoreVertical, Edit, Trash2
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatter';

const ActionsMenu = ({ onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => { const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
    return (<div className="relative" ref={menuRef}><button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-200"><MoreVertical size={18} /></button>{isOpen && (<div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border"><button onClick={(e) => { e.stopPropagation(); onEdit(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"><Edit size={16} className="mr-2" /> Editar</button><button onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"><Trash2 size={16} className="mr-2" /> Excluir</button></div>)}</div>);
};

const ActivityList = ({ activities, onEdit, onDelete }) => {
    return (
        <div className="space-y-4">
            {activities.length === 0 ? (
                <p className="py-4 text-center text-gray-500">Nenhuma atividade registrada para este parceiro.</p>
            ) : (
                activities.map(activity => (
                    <div key={activity.id} className="bg-slate-50 p-4 rounded-lg relative">
                         <div className="absolute top-2 right-2">
                            <ActionsMenu onEdit={() => onEdit('activity', activity)} onDelete={() => onDelete('activities', activity.id)} />
                        </div>
                        <div className="flex items-center mb-2">
                             <h4 className="text-md font-bold text-slate-800 pr-8">{activity.title}</h4>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 space-x-4 mb-2">
                            <span className="flex items-center"><Tag size={14} className="mr-1" />{activity.category}</span>
                            <span className="flex items-center"><Calendar size={14} className="mr-1" />{activity.createdAt?.toDate().toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-slate-600 whitespace-pre-wrap">{activity.description}</p>
                    </div>
                ))
            )}
        </div>
    );
};

const PartnerDetail = ({ allPartners, allActivities, onAddActivity, onDeleteActivity, onEditActivity }) => {
    const { partnerId } = useParams();
    const partner = allPartners.find(p => p.id === partnerId);
    
    const partnerActivities = useMemo(() => {
        return allActivities.filter(a => a.partnerId === partnerId);
    }, [allActivities, partnerId]);

    if (!partner) return <div className="text-center text-gray-500">Parceiro não encontrado.</div>;

    return (
        <div>
            <Link to="/partners" className="flex items-center text-sky-600 hover:underline mb-6 font-semibold">
                <ArrowLeft size={18} className="mr-2" />
                Voltar para a lista de parceiros
            </Link>
            <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                <div className="flex items-center">
                    <div className={`p-3 rounded-full ${partner.tier.bgColor}`}>
                        <partner.tier.icon className={`h-10 w-10 ${partner.tier.color}`} />
                    </div>
                    <div className="ml-4">
                        <h2 className="text-3xl font-bold text-slate-800">{partner.name}</h2>
                        <p className="text-gray-500">{partner.type}</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
                        <User size={20} className="mr-2 text-sky-500" />
                        Informações de Contato
                    </h3>
                    <div className="space-y-2">
                        <p className="text-gray-700"><strong>Nome:</strong> {partner.contactName}</p>
                        <p className="text-gray-700"><strong>Email:</strong> {partner.contactEmail}</p>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
                        <TrendingUp size={20} className="mr-2 text-sky-500" />
                        Métricas (no período)
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <div>
                            <p className="text-sm text-gray-500">Pagamentos Recebidos</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(partner.paymentsReceived)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Comissão a Pagar</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(partner.commissionToPay)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Receita Gerada (Ganhos)</p>
                            <p className="text-2xl font-bold text-slate-800">{formatCurrency(partner.generatedRevenue)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Oportunidades Geradas</p>
                            <p className="text-2xl font-bold text-slate-800">{formatCurrency(partner.totalOpportunitiesValue)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Taxa de Conversão</p>
                            <p className="text-2xl font-bold text-slate-800">{partner.conversionRate.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 bg-white p-6 rounded-xl shadow-md">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center">
                        <ActivityIcon size={20} className="mr-2 text-sky-500" />
                        Atividades
                    </h3>
                    <button 
                        onClick={() => onAddActivity('activity', { partnerId: partner.id, partnerName: partner.name })} 
                        className="flex items-center bg-sky-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-sky-600"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        <span className="font-semibold">Adicionar Atividade</span>
                    </button>
                </div>
                <ActivityList activities={partnerActivities} onEdit={onEditActivity} onDelete={onDeleteActivity} />
            </div>
        </div>
    );
};

export default PartnerDetail;
