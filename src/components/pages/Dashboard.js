import React, { useMemo } from 'react';
import { Users, Briefcase, DollarSign, Target, Activity as ActivityIcon } from 'lucide-react';
import DealList from '../deals/DealList'; // <<< NOVO: Importa o DealList
import { formatCurrency } from '../../utils/formatter';

const RecentActivities = ({ activities, partners }) => {
    const partnerNameMap = useMemo(() => {
        const map = {};
        partners.forEach(p => { map[p.id] = p.name; });
        return map;
    }, [partners]);

    return (
        <div>
            <h2 className="text-xl font-bold text-slate-700 mb-4">Últimas Atividades</h2>
            <div className="bg-white p-4 rounded-xl shadow-md">
                {activities.length === 0 ? (
                    <p className="p-4 text-center text-gray-500">Nenhuma atividade registrada.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {activities.slice(0, 5).map(activity => (
                             <li key={activity.id} className="p-3 flex items-start space-x-4">
                                <div className="bg-sky-100 rounded-full p-2">
                                    <ActivityIcon className="h-5 w-5 text-sky-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{activity.title}</p>
                                    <p className="text-sm text-slate-500">
                                        Parceiro: <span className="font-medium text-slate-600">{partnerNameMap[activity.partnerId] || 'Desconhecido'}</span>
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {activity.createdAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const Dashboard = ({ partners, deals, activities }) => { // <<< ALTERAÇÃO: Não recebe mais DealList como prop
    const { totalPayments, totalGeneratedRevenue } = useMemo(() => {
        const totalPayments = partners.reduce((sum, p) => sum + p.paymentsReceived, 0);
        const totalGeneratedRevenue = partners.reduce((sum, p) => sum + p.generatedRevenue, 0);
        return { totalPayments, totalGeneratedRevenue };
    }, [partners]);
    
    const stats = [
        { title: 'Total de Parceiros', value: partners.length, icon: Users, color: 'text-blue-500' },
        { title: 'Oportunidades no Período', value: deals.length, icon: Briefcase, color: 'text-orange-500' },
        { title: 'Receita Gerada (Ganhos)', value: formatCurrency(totalGeneratedRevenue), icon: Target, color: 'text-indigo-500' },
        { title: 'Pagamentos Recebidos', value: formatCurrency(totalPayments), icon: DollarSign, color: 'text-green-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => (
                    <div key={stat.title} className="bg-white p-6 rounded-xl shadow-md flex items-center">
                        <div className={`p-3 rounded-full bg-opacity-20 ${stat.color.replace('text-', 'bg-')}`}>
                            <stat.icon className={`h-8 w-8 ${stat.color}`} />
                        </div>
                        <div className="ml-4">
                            <p className="text-gray-500">{stat.title}</p>
                            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Oportunidades Recentes no Período</h2>
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <DealList 
                            deals={deals.slice(0, 5)} 
                            partners={partners} 
                            isMini={true}
                            // Estas props não são necessárias na versão mini, mas mantemos para consistência
                            selectedDeals={[]} 
                            setSelectedDeals={() => {}}
                        />
                    </div>
                </div>
                <RecentActivities activities={activities} partners={partners} />
            </div>
        </div>
    );
};

export default Dashboard;
