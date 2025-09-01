import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc,
    onSnapshot, 
    query,
    serverTimestamp,
    writeBatch,
    Timestamp,
    updateDoc,
    deleteDoc,
    orderBy,
    where,
    getDocs
} from 'firebase/firestore';
import { 
    Users, Briefcase, DollarSign, Book, Plus, X, LayoutDashboard, Gem, Trophy, Star,
    Search, Handshake, Lightbulb, Upload, Filter, XCircle, MoreVertical, Edit, Trash2, AlertTriangle,
    BadgePercent, ArrowLeft, User, TrendingUp, Target, Calendar, Phone, Mail, Award, LogOut, FileText,
    ChevronLeft, ChevronRight
} from 'lucide-react';

// --- Configuração do Firebase ---
// As credenciais serão obtidas das variáveis de ambiente na Vercel
const firebaseConfig = {
  apiKey: typeof __app_id !== 'undefined' ? "YOUR_API_KEY" : (process.env.REACT_APP_API_KEY || ""),
  authDomain: typeof __app_id !== 'undefined' ? "YOUR_AUTH_DOMAIN" : (process.env.REACT_APP_AUTH_DOMAIN || ""),
  projectId: typeof __app_id !== 'undefined' ? "YOUR_PROJECT_ID" : (process.env.REACT_APP_PROJECT_ID || ""),
  storageBucket: typeof __app_id !== 'undefined' ? "YOUR_STORAGE_BUCKET" : (process.env.REACT_APP_STORAGE_BUCKET || ""),
  messagingSenderId: typeof __app_id !== 'undefined' ? "YOUR_MESSAGING_SENDER_ID" : (process.env.REACT_APP_MESSAGING_SENDER_ID || ""),
  appId: typeof __app_id !== 'undefined' ? "YOUR_APP_ID" : (process.env.REACT_APP_APP_ID || "")
};

// --- Inicialização do Firebase ---
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
}

// --- Funções Utilitárias ---
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('pt-BR');
};

const parseBrazilianNumber = (stringValue) => {
    if (typeof stringValue !== 'string') return Number(stringValue) || 0;
    const cleanedString = stringValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanedString) || 0;
};

const parseDateString = (dateString) => {
    if (!dateString) return null;
    try {
        // Formato AAAA-MM-DD ou AAAA-MM-DD HH:MM
        const datePart = dateString.split(' ')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        if (!year || !month || !day) return null;
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) return null;
        return Timestamp.fromDate(date);
    } catch (e) {
        console.error("Erro ao converter data:", dateString, e);
        return null;
    }
};

// --- Componente Principal da Aplicação ---
function App() {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    if (loadingAuth) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl">Carregando...</div></div>;
    }

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={user ? <MainApp /> : <LoginPage />} />
        </Routes>
    );
}

// --- Componente de Login ---
const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!auth) {
            setError("Firebase não inicializado. Verifique as configurações.");
            return;
        }
        try {
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (err) {
            setError('Falha no login. Verifique seu email e senha.');
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div className="flex justify-center">
                    <img src="/logo-driva-positiva.png" alt="Logo Driva" className="w-48" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-900">
                    Acesso ao PRM Driva
                </h2>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="sr-only">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Senha</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-900">
                                Continuar logado
                            </label>
                        </div>
                    </div>
                    <div>
                        <button type="submit" className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Entrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Layout Principal da Aplicação ---
const MainApp = () => {
    const [partners, setPartners] = useState([]);
    const [deals, setDeals] = useState([]);
    const [resources, setResources] = useState([]);
    const [nutritions, setNutritions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    
    const navigate = useNavigate();

    useEffect(() => {
        if (!db) {
            console.error("Firestore DB não está disponível.");
            setLoading(false);
            return;
        }

        const collectionsToFetch = [
            { name: 'partners', setter: setPartners },
            { name: 'deals', setter: setDeals },
            { name: 'resources', setter: setResources },
            { name: 'nutritions', setter: setNutritions },
            { name: 'payments', setter: setPayments },
            { name: 'activities', setter: setActivities, order: 'timestamp' }
        ];

        const unsubscribes = collectionsToFetch.map(c => {
            const collectionRef = collection(db, `${appId}/${c.name}`);
            const q = c.order ? query(collectionRef, orderBy(c.order, "desc")) : query(collectionRef);
            return onSnapshot(q, (snapshot) => {
                const dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                c.setter(dataList);
            }, (error) => console.error(`Erro ao buscar ${c.name}:`, error));
        });

        setLoading(false);

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    const filteredData = useMemo(() => {
        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
        const end = endDate ? new Date(endDate + 'T23:59:59') : null;

        if (!start || !end) {
            return { filteredDeals: deals, filteredPayments: payments };
        }

        const filteredDeals = deals.filter(deal => {
            if (!deal.submissionDate) return false;
            const dealDate = deal.submissionDate.toDate();
            return dealDate >= start && dealDate <= end;
        });

        const filteredPayments = payments.filter(payment => {
            if (!payment.paymentDate) return false;
            const paymentDate = payment.paymentDate.toDate();
            return paymentDate >= start && paymentDate <= end;
        });

        return { filteredDeals, filteredPayments };
    }, [deals, payments, startDate, endDate]);

    const partnerMetrics = useMemo(() => {
        return partners.map(partner => {
            const partnerDeals = filteredData.filteredDeals.filter(d => d.partnerId === partner.id);
            const partnerPayments = filteredData.filteredPayments.filter(p => p.partnerId === partner.id);

            const opportunitiesGenerated = partnerDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
            const wonDeals = partnerDeals.filter(d => d.status === 'Ganho');
            const generatedRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
            const conversionRate = partnerDeals.length > 0 ? (wonDeals.length / partnerDeals.length) * 100 : 0;
            
            const paymentsReceived = partnerPayments.reduce((sum, p) => sum + (p.paymentValue || 0), 0);
            
            let tier = 'N/A';
            let commissionRate = 0;
            const mrr = paymentsReceived;

            if (partner.type === 'Finder') {
                if (mrr >= 499 && mrr <= 5000) { tier = 'Prata'; commissionRate = 0.05; }
                else if (mrr > 5000 && mrr <= 30000) { tier = 'Ouro'; commissionRate = 0.10; }
                else if (mrr > 30000) { tier = 'Diamante'; commissionRate = 0.15; }
            } else if (partner.type === 'Seller') {
                if (mrr >= 499 && mrr <= 5000) { tier = 'Prata'; commissionRate = 0.15; }
                else if (mrr > 5000 && mrr <= 20000) { tier = 'Ouro'; commissionRate = 0.20; }
                else if (mrr > 20000) { tier = 'Diamante'; commissionRate = 0.25; }
            }

            const commissionToPay = paymentsReceived * commissionRate;

            return {
                ...partner,
                opportunitiesGenerated,
                generatedRevenue,
                conversionRate,
                paymentsReceived,
                commissionToPay,
                tier,
                commissionRate,
            };
        });
    }, [partners, filteredData.filteredDeals, filteredData.filteredPayments]);

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar onLogout={handleLogout} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    startDate={startDate}
                    endDate={endDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                />
                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Routes>
                        <Route path="/" element={<DashboardPage metrics={partnerMetrics} activities={activities.slice(0, 5)} />} />
                        <Route path="/partners" element={<PartnersPage partners={partnerMetrics} allPartners={partners} deals={deals} />} />
                        <Route path="/partners/:id" element={<PartnerDetailPage partners={partners} deals={deals} payments={payments} activities={activities} />} />
                        <Route path="/opportunities" element={<OpportunitiesPage opportunities={deals} partners={partners} />} />
                        <Route path="/resources" element={<ResourcesPage resources={resources} />} />
                        <Route path="/nutrition" element={<NutritionPage nutritions={nutritions} />} />
                        <Route path="/commission" element={<CommissionPage payments={payments} partners={partners}/>} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

// --- Componentes de Página ---
const DashboardPage = ({ metrics, activities }) => {
    const totalPartners = metrics.length;
    
    const { 
      totalOpportunities, 
      totalGeneratedRevenue, 
      totalPaymentsReceived 
    } = useMemo(() => {
        const totalOpportunities = metrics.reduce((acc, p) => acc + p.opportunitiesGenerated, 0);
        const totalGeneratedRevenue = metrics.reduce((acc, p) => acc + p.generatedRevenue, 0);
        const totalPaymentsReceived = metrics.reduce((acc, p) => acc + p.paymentsReceived, 0);
        return { totalOpportunities, totalGeneratedRevenue, totalPaymentsReceived };
    }, [metrics]);

    const partnerDistribution = useMemo(() => {
        const distribution = { 'Prata': 0, 'Ouro': 0, 'Diamante': 0, 'N/A': 0 };
        metrics.forEach(p => {
            if (distribution[p.tier] !== undefined) {
                distribution[p.tier]++;
            }
        });
        return distribution;
    }, [metrics]);

    const partnerTypeDistribution = useMemo(() => {
        const distribution = { 'Finder': { count: 0, revenue: 0 }, 'Seller': { count: 0, revenue: 0 }};
        metrics.forEach(p => {
            if (distribution[p.type]) {
                distribution[p.type].count++;
                distribution[p.type].revenue += p.paymentsReceived;
            }
        });
        return distribution;
    }, [metrics]);


    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard de Canais</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <MetricCard title="Total de Parceiros" value={totalPartners} icon={<Users className="w-8 h-8 text-blue-500" />} />
                <MetricCard title="Oportunidades no Período" value={formatCurrency(totalOpportunities)} icon={<Briefcase className="w-8 h-8 text-green-500" />} />
                <MetricCard title="Receita Gerada (Ganhos)" value={formatCurrency(totalGeneratedRevenue)} icon={<TrendingUp className="w-8 h-8 text-purple-500" />} />
                <MetricCard title="Pagamentos Recebidos" value={formatCurrency(totalPaymentsReceived)} icon={<DollarSign className="w-8 h-8 text-yellow-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Performance por Tipo de Parceiro</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                            <h3 className="font-bold text-blue-800">Finder</h3>
                            <p className="text-2xl font-bold text-gray-800">{partnerTypeDistribution.Finder.count} Parceiros</p>
                            <p className="text-lg text-gray-600">{formatCurrency(partnerTypeDistribution.Finder.revenue)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                            <h3 className="font-bold text-green-800">Seller</h3>
                            <p className="text-2xl font-bold text-gray-800">{partnerTypeDistribution.Seller.count} Parceiros</p>
                            <p className="text-lg text-gray-600">{formatCurrency(partnerTypeDistribution.Seller.revenue)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Distribuição por Nível</h2>
                    <div className="space-y-3">
                        {Object.entries(partnerDistribution).map(([tier, count]) => {
                            const tierInfo = getTierInfo(tier);
                            const percentage = totalPartners > 0 ? (count / totalPartners * 100).toFixed(1) : 0;
                            return (
                                <div key={tier}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`flex items-center text-sm font-medium ${tierInfo.textColor}`}>
                                            {tierInfo.icon} {tier}
                                        </span>
                                        <span className="text-sm font-medium text-gray-500">{count} / {totalPartners}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className={`${tierInfo.bgColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                 <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm">
                    <ActivityFeed activities={activities} title="Atividades Recentes" />
                </div>
            </div>
        </div>
    );
};

const PartnersPage = ({ partners, allPartners, deals }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(partners.length / itemsPerPage);
    const paginatedPartners = partners.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleEdit = (partner) => {
        setEditingPartner(partner);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingPartner(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPartner(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestão de Parceiros</h1>
                <div className="flex gap-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200">
                        <Upload className="w-4 h-4 mr-2" /> Importar Parceiros
                    </button>
                    <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
                        <Plus className="w-4 h-4 mr-2" /> Novo Parceiro
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Parceiro</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamentos Recebidos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Gerada (Ganhos)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa de Conversão</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comissão a Pagar</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedPartners.map(partner => (
                                <tr key={partner.id} onClick={() => navigate(`/partners/${partner.id}`)} className="hover:bg-gray-50 cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{partner.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${partner.type === 'Finder' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {partner.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><TierBadge tier={partner.tier} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(partner.paymentsReceived)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(partner.generatedRevenue)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partner.conversionRate.toFixed(1)}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatCurrency(partner.commissionToPay)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium relative">
                                        <ActionMenu onEdit={() => handleEdit(partner)} onDelete={() => deleteDoc(doc(db, `${appId}/partners`, partner.id))} itemType="parceiro" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            {isModalOpen && <PartnerModal partner={editingPartner} onClose={handleCloseModal} />}
            {isImportModalOpen && <CSVImportModal 
                type="partner" 
                onClose={() => setIsImportModalOpen(false)} 
                requiredHeaders={['name', 'type', 'contactName', 'contactEmail']}
            />}
        </div>
    );
};

const PartnerDetailPage = ({ partners, deals, payments, activities }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);

    const partner = useMemo(() => partners.find(p => p.id === id), [id, partners]);

    const partnerData = useMemo(() => {
        if (!partner) return null;
        
        const partnerDeals = deals.filter(d => d.partnerId === partner.id);
        const partnerPayments = payments.filter(p => p.partnerId === partner.id);
        const partnerActivities = activities.filter(a => a.partnerId === partner.id);

        const opportunitiesGenerated = partnerDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const wonDeals = partnerDeals.filter(d => d.status === 'Ganho');
        const generatedRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const conversionRate = partnerDeals.length > 0 ? (wonDeals.length / partnerDeals.length) * 100 : 0;
        
        const paymentsReceived = partnerPayments.reduce((sum, p) => sum + (p.paymentValue || 0), 0);
        
        let tier = 'N/A';
        let commissionRate = 0;
        const mrr = paymentsReceived;

        if (partner.type === 'Finder') {
            if (mrr >= 499 && mrr <= 5000) { tier = 'Prata'; commissionRate = 0.05; }
            else if (mrr > 5000 && mrr <= 30000) { tier = 'Ouro'; commissionRate = 0.10; }
            else if (mrr > 30000) { tier = 'Diamante'; commissionRate = 0.15; }
        } else if (partner.type === 'Seller') {
            if (mrr >= 499 && mrr <= 5000) { tier = 'Prata'; commissionRate = 0.15; }
            else if (mrr > 5000 && mrr <= 20000) { tier = 'Ouro'; commissionRate = 0.20; }
            else if (mrr > 20000) { tier = 'Diamante'; commissionRate = 0.25; }
        }

        const commissionToPay = paymentsReceived * commissionRate;

        return {
            ...partner,
            opportunitiesGenerated,
            generatedRevenue,
            conversionRate,
            paymentsReceived,
            commissionToPay,
            tier,
            commissionRate,
            activities: partnerActivities
        };
    }, [partner, deals, payments, activities]);
    
    if (!partnerData) {
        return <div className="text-center text-gray-500">Parceiro não encontrado.</div>;
    }

    const handleEditActivity = (activity) => {
        setEditingActivity(activity);
        setIsActivityModalOpen(true);
    };

    const handleAddNewActivity = () => {
        setEditingActivity(null);
        setIsActivityModalOpen(true);
    };
    
    const handleCloseActivityModal = () => {
        setIsActivityModalOpen(false);
        setEditingActivity(null);
    };


    return (
        <div className="container mx-auto">
             <button onClick={() => navigate('/partners')} className="flex items-center mb-6 text-sm text-blue-600 hover:underline">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar para Parceiros
            </button>
            <div className="bg-white p-8 rounded-lg shadow-sm mb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{partnerData.name}</h1>
                        <p className="text-md text-gray-500 mt-1">{partnerData.type}</p>
                    </div>
                    <TierBadge tier={partnerData.tier} large />
                </div>
                <div className="border-t border-gray-200 mt-4 pt-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Informações de Contato</h3>
                    <div className="flex items-center text-gray-600 mb-1">
                        <User className="w-4 h-4 mr-2" />
                        <span>{partnerData.contactName || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{partnerData.contactEmail || 'Não informado'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" /> Métricas (no período selecionado)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <MetricDisplay label="Pagamentos Recebidos" value={formatCurrency(partnerData.paymentsReceived)} />
                    <MetricDisplay label="Comissão a Pagar" value={formatCurrency(partnerData.commissionToPay)} />
                    <MetricDisplay label="Receita Gerada (Ganhos)" value={formatCurrency(partnerData.generatedRevenue)} />
                    <MetricDisplay label="Oportunidades Geradas" value={formatCurrency(partnerData.opportunitiesGenerated)} />
                    <MetricDisplay label="Taxa de Conversão" value={`${partnerData.conversionRate.toFixed(1)}%`} />
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">Histórico de Atividades</h2>
                    <button onClick={handleAddNewActivity} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm">
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Atividade
                    </button>
                </div>
                <ActivityFeed activities={partnerData.activities} onEdit={handleEditActivity} />
            </div>
            
            {isActivityModalOpen && <ActivityModal 
                activity={editingActivity}
                partnerId={partner.id}
                onClose={handleCloseActivityModal} 
            />}
        </div>
    );
};

const OpportunitiesPage = ({ opportunities, partners }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [selectedDeals, setSelectedDeals] = useState([]);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(opportunities.length / itemsPerPage);
    const paginatedDeals = opportunities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleEdit = (deal) => {
        setEditingDeal(deal);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingDeal(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDeal(null);
    };
    
    const handleSelectDeal = (id) => {
        setSelectedDeals(prev => 
            prev.includes(id) ? prev.filter(dealId => dealId !== id) : [...prev, id]
        );
    };
    
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedDeals(paginatedDeals.map(d => d.id));
        } else {
            setSelectedDeals([]);
        }
    };
    
    const handleDeleteSelected = async () => {
        if (!window.confirm(`Tem certeza que deseja excluir ${selectedDeals.length} oportunidades?`)) return;
        
        const batch = writeBatch(db);
        selectedDeals.forEach(id => {
            const docRef = doc(db, `${appId}/deals`, id);
            batch.delete(docRef);
        });
        
        try {
            await batch.commit();
            setSelectedDeals([]);
            alert('Oportunidades excluídas com sucesso!');
        } catch (error) {
            console.error("Erro ao excluir oportunidades:", error);
            alert('Falha ao excluir oportunidades.');
        }
    };

    const getPartnerName = (partnerId) => {
        const partner = partners.find(p => p.id === partnerId);
        return partner ? partner.name : 'Desconhecido';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Oportunidades</h1>
                <div className="flex gap-2">
                    {selectedDeals.length > 0 && (
                        <button onClick={handleDeleteSelected} className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200">
                           <Trash2 className="w-4 h-4 mr-2" /> Excluir Selecionadas ({selectedDeals.length})
                        </button>
                    )}
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200">
                        <Upload className="w-4 h-4 mr-2" /> Importar Oportunidades
                    </button>
                    <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
                        <Plus className="w-4 h-4 mr-2" /> Registrar Oportunidade
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={paginatedDeals.length > 0 && selectedDeals.length === paginatedDeals.length} /></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente Final</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parceiro</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data da Indicação</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {paginatedDeals.map(deal => (
                                <tr key={deal.id} className={`${selectedDeals.includes(deal.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="p-4"><input type="checkbox" checked={selectedDeals.includes(deal.id)} onChange={() => handleSelectDeal(deal.id)} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{deal.clientName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPartnerName(deal.partnerId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(deal.submissionDate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(deal.value)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><StatusBadge status={deal.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium relative">
                                        <ActionMenu onEdit={() => handleEdit(deal)} onDelete={() => deleteDoc(doc(db, `${appId}/deals`, deal.id))} itemType="oportunidade" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            {isModalOpen && <DealModal deal={editingDeal} partners={partners} onClose={handleCloseModal} />}
            {isImportModalOpen && <CSVImportModal 
                type="opportunity" 
                partners={partners}
                onClose={() => setIsImportModalOpen(false)}
                requiredHeaders={['partnerName', 'clientName', 'value', 'status', 'submissionDate']}
            />}
        </div>
    );
};

const ResourcesPage = ({ resources }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState(null);

    const handleEdit = (resource) => {
        setEditingResource(resource);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingResource(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingResource(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Recursos</h1>
                <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
                    <Plus className="w-4 h-4 mr-2" /> Novo Recurso
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map(resource => (
                    <div key={resource.id} className="bg-white p-6 rounded-lg shadow-sm relative group">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ActionMenu onEdit={() => handleEdit(resource)} onDelete={() => deleteDoc(doc(db, `${appId}/resources`, resource.id))} itemType="recurso" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">{resource.title}</h2>
                        <p className="text-gray-600 mb-4">{resource.description}</p>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                            {resource.category}
                        </span>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block mt-4 text-blue-600 hover:underline">
                            Acessar Recurso
                        </a>
                    </div>
                ))}
            </div>
            {isModalOpen && <ResourceModal resource={editingResource} onClose={handleCloseModal} />}
        </div>
    );
};

const NutritionPage = ({ nutritions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNutrition, setEditingNutrition] = useState(null);

    const handleEdit = (nutrition) => {
        setEditingNutrition(nutrition);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingNutrition(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNutrition(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Nutrição de Parceiros</h1>
                <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200">
                    <Plus className="w-4 h-4 mr-2" /> Novo Conteúdo
                </button>
            </div>
            <div className="space-y-4">
                {nutritions.map(nutrition => (
                     <div key={nutrition.id} className="bg-white p-6 rounded-lg shadow-sm relative group">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ActionMenu onEdit={() => handleEdit(nutrition)} onDelete={() => deleteDoc(doc(db, `${appId}/nutritions`, nutrition.id))} itemType="conteúdo de nutrição"/>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">{nutrition.title}</h2>
                        <p className="text-gray-600 mb-4">{nutrition.content}</p>
                         <p className="text-sm text-gray-400">Criado em: {formatDate(nutrition.createdAt)}</p>
                    </div>
                ))}
            </div>
            {isModalOpen && <NutritionModal nutrition={editingNutrition} onClose={handleCloseModal} />}
        </div>
    );
};

const CommissionPage = ({ payments, partners }) => {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedPayments, setSelectedPayments] = useState([]);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const getPartnerName = (partnerId) => partners.find(p => p.id === partnerId)?.name || 'Desconhecido';
    
    const totalPages = Math.ceil(payments.length / itemsPerPage);
    const paginatedPayments = payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSelectPayment = (id) => {
        setSelectedPayments(prev => 
            prev.includes(id) ? prev.filter(paymentId => paymentId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedPayments(paginatedPayments.map(p => p.id));
        } else {
            setSelectedPayments([]);
        }
    };

    const handleDeleteSelected = async () => {
        if (!window.confirm(`Tem certeza que deseja excluir ${selectedPayments.length} pagamentos?`)) return;
        
        const batch = writeBatch(db);
        selectedPayments.forEach(id => {
            const docRef = doc(db, `${appId}/payments`, id);
            batch.delete(docRef);
        });
        
        try {
            await batch.commit();
            setSelectedPayments([]);
            alert('Pagamentos excluídos com sucesso!');
        } catch (error) {
            console.error("Erro ao excluir pagamentos:", error);
            alert('Falha ao excluir pagamentos.');
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestão de Comissionamento</h1>
                <div className="flex gap-2">
                    {selectedPayments.length > 0 && (
                         <button onClick={handleDeleteSelected} className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200">
                           <Trash2 className="w-4 h-4 mr-2" /> Excluir Selecionados ({selectedPayments.length})
                        </button>
                    )}
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200">
                        <Upload className="w-4 h-4 mr-2" /> Importar Pagamentos
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={paginatedPayments.length > 0 && selectedPayments.length === paginatedPayments.length} /></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente Final</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parceiro Associado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor do Pagamento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data do Pagamento</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {paginatedPayments.map(payment => (
                                <tr key={payment.id} className={`${selectedPayments.includes(payment.id) ? 'bg-blue-50' : ''}`}>
                                     <td className="p-4"><input type="checkbox" checked={selectedPayments.includes(payment.id)} onChange={() => handleSelectPayment(payment.id)} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.clientName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPartnerName(payment.partnerId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{formatCurrency(payment.paymentValue)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(payment.paymentDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            {isImportModalOpen && <CSVImportModal 
                type="payment"
                partners={partners}
                onClose={() => setIsImportModalOpen(false)}
                requiredHeaders={['clientName', 'partnerName', 'paymentValue', 'paymentDate']}
            />}
        </div>
    );
};

// --- Componentes Reutilizáveis ---

const Sidebar = ({ onLogout }) => {
    const location = useLocation();
    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/partners', label: 'Parceiros', icon: Handshake },
        { path: '/opportunities', label: 'Oportunidades', icon: Briefcase },
        { path: '/commission', label: 'Comissionamento', icon: DollarSign },
        { path: '/resources', label: 'Recursos', icon: Book },
        { path: '/nutrition', label: 'Nutrição', icon: Lightbulb },
    ];

    return (
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
            <div className="h-20 flex items-center justify-center bg-gray-900">
                <img src="/logo-driva-negativa.png" alt="Logo Driva" className="h-10" />
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map(item => (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-red-600 hover:text-white"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair
                </button>
            </div>
        </aside>
    );
};

const Header = ({ startDate, endDate, setStartDate, setEndDate }) => {
    const handleClearFilters = () => {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
    };

    return (
        <header className="bg-white shadow-sm p-4 flex justify-end items-center">
            <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-500" />
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">De:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-gray-300 rounded-md p-1 text-sm"/>
                </div>
                 <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Até:</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-gray-300 rounded-md p-1 text-sm"/>
                </div>
                <button onClick={handleClearFilters} className="p-1.5 rounded-md hover:bg-gray-200 transition">
                    <XCircle className="w-5 h-5 text-gray-500" />
                </button>
            </div>
        </header>
    );
};

const MetricCard = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
        <div className="p-3 bg-gray-100 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const MetricDisplay = ({ label, value }) => (
    <div className="flex flex-col p-2">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
);

const getTierInfo = (tier) => {
    switch (tier) {
        case 'Diamante': return { bgColor: 'bg-blue-500', textColor: 'text-blue-800', icon: <Gem className="w-4 h-4 mr-1.5" /> };
        case 'Ouro': return { bgColor: 'bg-yellow-400', textColor: 'text-yellow-800', icon: <Trophy className="w-4 h-4 mr-1.5" /> };
        case 'Prata': return { bgColor: 'bg-gray-400', textColor: 'text-gray-800', icon: <Star className="w-4 h-4 mr-1.5" /> };
        default: return { bgColor: 'bg-gray-200', textColor: 'text-gray-800', icon: <User className="w-4 h-4 mr-1.5" /> };
    }
};

const TierBadge = ({ tier, large = false }) => {
    const tierInfo = getTierInfo(tier);
    const sizeClasses = large ? 'px-4 py-2 text-lg' : 'px-2 py-1 text-xs';
    return (
        <span className={`inline-flex items-center font-semibold rounded-full ${sizeClasses} ${tierInfo.bgColor} ${tierInfo.textColor}`}>
            {tierInfo.icon} {tier}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        'Pendente': 'bg-yellow-100 text-yellow-800',
        'Aprovado': 'bg-blue-100 text-blue-800',
        'Ganho': 'bg-green-100 text-green-800',
        'Perdido': 'bg-red-100 text-red-800',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

const ActionMenu = ({ onEdit, onDelete, itemType }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);
    
    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja excluir este ${itemType}?`)) {
            onDelete();
        }
        setIsOpen(false);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit();
        setIsOpen(false);
    }

    return (
        <div className="relative inline-block text-left" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex justify-center w-full rounded-full p-2 bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none">
                <MoreVertical className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <a href="#" onClick={handleEdit} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <Edit className="w-4 h-4 mr-2" /> Editar
                        </a>
                        <a href="#" onClick={handleDelete} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

const Modal = ({ title, children, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
};

const PartnerModal = ({ partner, onClose }) => {
    const [formData, setFormData] = useState({
        name: partner?.name || '',
        type: partner?.type || 'Finder',
        contactName: partner?.contactName || '',
        contactEmail: partner?.contactEmail || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (partner) {
                await updateDoc(doc(db, `${appId}/partners`, partner.id), formData);
            } else {
                await addDoc(collection(db, `${appId}/partners`), { ...formData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (error) {
            console.error("Erro ao salvar parceiro: ", error);
        }
    };

    return (
        <Modal title={partner ? 'Editar Parceiro' : 'Novo Parceiro'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome do Parceiro</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Parceiro</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="Finder">Finder</option>
                        <option value="Seller">Seller</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Nome do Contato</label>
                    <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Email do Contato</label>
                    <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{partner ? 'Salvar Alterações' : 'Adicionar Parceiro'}</button>
                </div>
            </form>
        </Modal>
    );
};

const DealModal = ({ deal, partners, onClose }) => {
    const [formData, setFormData] = useState({
        clientName: deal?.clientName || '',
        partnerId: deal?.partnerId || '',
        value: deal?.value || '',
        status: deal?.status || 'Pendente',
        submissionDate: deal?.submissionDate ? deal.submissionDate.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            value: parseFloat(formData.value),
            submissionDate: Timestamp.fromDate(new Date(formData.submissionDate + 'T00:00:00'))
        };

        try {
            if (deal) {
                await updateDoc(doc(db, `${appId}/deals`, deal.id), dataToSave);
            } else {
                await addDoc(collection(db, `${appId}/deals`), { ...dataToSave, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (error) {
            console.error("Erro ao salvar oportunidade: ", error);
        }
    };

    return (
        <Modal title={deal ? 'Editar Oportunidade' : 'Registrar Oportunidade'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cliente Final</label>
                    <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Parceiro</label>
                    <select name="partnerId" value={formData.partnerId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Selecione um parceiro</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Data da Indicação</label>
                    <input type="date" name="submissionDate" value={formData.submissionDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                    <input type="number" name="value" value={formData.value} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option>Pendente</option>
                        <option>Aprovado</option>
                        <option>Ganho</option>
                        <option>Perdido</option>
                    </select>
                </div>
                 <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{deal ? 'Salvar Alterações' : 'Adicionar Oportunidade'}</button>
                </div>
            </form>
        </Modal>
    );
};

const ResourceModal = ({ resource, onClose }) => {
    const [formData, setFormData] = useState({
        title: resource?.title || '',
        description: resource?.description || '',
        category: resource?.category || '',
        url: resource?.url || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (resource) {
                 await updateDoc(doc(db, `${appId}/resources`, resource.id), formData);
            } else {
                await addDoc(collection(db, `${appId}/resources`), { ...formData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (error) {
            console.error("Erro ao salvar recurso: ", error);
        }
    };
    return (
         <Modal title={resource ? 'Editar Recurso' : 'Novo Recurso'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Título</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">URL do Link</label>
                    <input type="url" name="url" value={formData.url} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{resource ? 'Salvar Alterações' : 'Adicionar Recurso'}</button>
                </div>
            </form>
        </Modal>
    )
};

const NutritionModal = ({ nutrition, onClose }) => {
    const [formData, setFormData] = useState({
        title: nutrition?.title || '',
        content: nutrition?.content || '',
    });

     const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (nutrition) {
                await updateDoc(doc(db, `${appId}/nutritions`, nutrition.id), formData);
            } else {
                await addDoc(collection(db, `${appId}/nutritions`), { ...formData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (error) {
            console.error("Erro ao salvar conteúdo: ", error);
        }
    };

    return (
        <Modal title={nutrition ? 'Editar Conteúdo' : 'Novo Conteúdo de Nutrição'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Título</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Conteúdo / Direcionamento</label>
                    <textarea name="content" value={formData.content} onChange={handleChange} rows="5" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{nutrition ? 'Salvar Alterações' : 'Adicionar Conteúdo'}</button>
                </div>
            </form>
        </Modal>
    );
};

const ActivityModal = ({ activity, partnerId, onClose }) => {
    const [formData, setFormData] = useState({
        type: activity?.type || 'Reunião',
        description: activity?.description || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            partnerId: partnerId,
            timestamp: serverTimestamp()
        };
        try {
            if (activity) {
                // We update with new timestamp to reflect edit time
                const { timestamp, ...updateData } = dataToSave;
                await updateDoc(doc(db, `${appId}/activities`, activity.id), { ...updateData, editedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, `${appId}/activities`), dataToSave);
            }
            onClose();
        } catch (error) {
            console.error("Erro ao salvar atividade:", error);
        }
    };
    
    return (
        <Modal title={activity ? 'Editar Atividade' : 'Registrar Atividade'} onClose={onClose}>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Atividade</label>
                    <select name="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                        <option>Reunião</option>
                        <option>Ligação</option>
                        <option>Email</option>
                        <option>Marco</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required rows="4" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{activity ? 'Salvar Alterações' : 'Registrar Atividade'}</button>
                </div>
            </form>
        </Modal>
    )
};

const CSVImportModal = ({ type, onClose, partners, requiredHeaders }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [importing, setImporting] = useState(false);
    const [selectedPartnerId, setSelectedPartnerId] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleImport = async () => {
        if (!file) {
            setError('Por favor, selecione um arquivo CSV.');
            return;
        }

        if (type === 'opportunity' && !selectedPartnerId) {
            setError('Por favor, selecione um parceiro para associar as oportunidades.');
            return;
        }
        
        setImporting(true);

        const text = await file.text();
        const rows = text.split('\n').map(row => row.trim()).filter(row => row);
        const header = rows[0].split(',').map(h => h.trim());

        // Validação simples do cabeçalho
        const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
        if(missingHeaders.length > 0) {
            setError(`Arquivo inválido. Faltando colunas: ${missingHeaders.join(', ')}`);
            setImporting(false);
            return;
        }
        
        const data = rows.slice(1).map(row => {
            const values = row.split(',');
            return header.reduce((obj, h, i) => {
                obj[h] = values[i] ? values[i].trim() : '';
                return obj;
            }, {});
        });

        let successCount = 0;
        let errorCount = 0;

        try {
            const batch = writeBatch(db);
            let partnerMap;
            
            if(type === 'opportunity' || type === 'payment') {
              const partnersSnapshot = await getDocs(query(collection(db, `${appId}/partners`)));
              partnerMap = new Map(partnersSnapshot.docs.map(doc => [doc.data().name.toLowerCase(), doc.id]));
            }

            data.forEach(item => {
                if (type === 'partner') {
                    if (item.name && item.type && item.contactName && item.contactEmail) {
                        const newPartnerRef = doc(collection(db, `${appId}/partners`));
                        batch.set(newPartnerRef, {
                            name: item.name,
                            type: item.type,
                            contactName: item.contactName,
                            contactEmail: item.contactEmail,
                            createdAt: serverTimestamp(),
                        });
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } else if (type === 'opportunity') {
                     if (selectedPartnerId && item.clientName && item.value && item.status && item.submissionDate) {
                        const newDealRef = doc(collection(db, `${appId}/deals`));
                        batch.set(newDealRef, {
                            partnerId: selectedPartnerId,
                            clientName: item.clientName,
                            value: parseBrazilianNumber(item.value),
                            status: item.status,
                            submissionDate: parseDateString(item.submissionDate),
                            createdAt: serverTimestamp(),
                        });
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } else if (type === 'payment') {
                    const partnerId = partnerMap.get(item.partnerName?.toLowerCase());
                    if (partnerId && item.clientName && item.paymentValue && item.paymentDate) {
                       const newPaymentRef = doc(collection(db, `${appId}/payments`));
                       batch.set(newPaymentRef, {
                           partnerId: partnerId,
                           clientName: item.clientName,
                           paymentValue: parseBrazilianNumber(item.paymentValue),
                           paymentDate: parseDateString(item.paymentDate),
                           createdAt: serverTimestamp(),
                       });
                       successCount++;
                    } else {
                        errorCount++;
                    }
                }
            });
            await batch.commit();
            alert(`${successCount} registros importados com sucesso! ${errorCount > 0 ? `${errorCount} linhas ignoradas por dados incompletos.` : ''}`);
            onClose();
        } catch (e) {
            console.error("Erro na importação:", e);
            setError('Ocorreu um erro durante a importação. Verifique o console.');
        } finally {
            setImporting(false);
        }
    };
    
    const getTitle = () => {
        if (type === 'partner') return 'Importar Parceiros';
        if (type === 'opportunity') return 'Importar Oportunidades';
        if (type === 'payment') return 'Importar Pagamentos';
        return 'Importar CSV';
    }

    const getInstructions = () => {
        const headerString = requiredHeaders.join(', ');
        return `O arquivo CSV deve conter as colunas: ${headerString}. Linhas com dados em branco serão ignoradas.`;
    }

    return (
        <Modal title={getTitle()} onClose={onClose}>
            <div className="space-y-4">
                <p className="text-sm text-gray-600">{getInstructions()}</p>
                {type === 'opportunity' && (
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
                <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" disabled={importing}>Cancelar</button>
                    <button type="button" onClick={handleImport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300" disabled={importing}>
                        {importing ? 'Importando...' : 'Importar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const ActivityFeed = ({ activities, title = "Histórico de Atividades", onEdit, onDelete }) => {
    const getActivityIcon = (type) => {
        switch(type) {
            case 'Reunião': return <Calendar className="w-5 h-5 text-blue-500" />;
            case 'Ligação': return <Phone className="w-5 h-5 text-green-500" />;
            case 'Email': return <Mail className="w-5 h-5 text-purple-500" />;
            case 'Marco': return <Award className="w-5 h-5 text-yellow-500" />;
            default: return <FileText className="w-5 h-5 text-gray-500" />;
        }
    }

    const timeSince = (date) => {
        if (!date) return "";
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " anos atrás";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses atrás";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " dias atrás";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas atrás";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutos atrás";
        return "agora mesmo";
    }

    if (!activities || activities.length === 0) {
        return <div className="text-center py-8 text-gray-500">Nenhuma atividade registrada.</div>
    }

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">{title}</h2>
            <ul className="space-y-4">
                {activities.map(activity => (
                    <li key={activity.id} className="flex items-start group">
                        <div className="flex-shrink-0 mr-4">
                            <span className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                                {getActivityIcon(activity.type)}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-800">
                                <span className="font-bold">{activity.type}:</span> {activity.description}
                            </p>
                            <p className="text-xs text-gray-400">
                                {timeSince(activity.timestamp?.toDate())}
                            </p>
                        </div>
                        {(onEdit || onDelete) && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ActionMenu 
                                    onEdit={() => onEdit(activity)} 
                                    onDelete={() => deleteDoc(doc(db, `${appId}/activities`, activity.id))}
                                    itemType="atividade" 
                                />
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }
    
    return (
        <div className="flex justify-center items-center mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 mx-1 rounded-md bg-white border border-gray-300 text-sm disabled:opacity-50"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            {pages.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 mx-1 rounded-md text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}
                >
                    {page}
                </button>
            ))}
             <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 mx-1 rounded-md bg-white border border-gray-300 text-sm disabled:opacity-50"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default App;

