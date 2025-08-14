import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged,
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
    Timestamp
} from 'firebase/firestore';
import { 
    Users, 
    Briefcase, 
    DollarSign, 
    Book, 
    Plus, 
    X,
    LayoutDashboard,
    FileText,
    Gem,
    Trophy,
    Star,
    Search,
    Handshake,
    Lightbulb,
    Upload,
    Filter,
    XCircle
} from 'lucide-react';

// --- Configuração do Firebase ---
// As chaves são carregadas a partir de Variáveis de Ambiente configuradas na Vercel
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const appId = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'prm-driva-default';


// --- Configurações do Programa de Parceria Driva ---
const TIER_THRESHOLDS = {
    FINDER: { DIAMANTE: 30001, OURO: 5001 },
    SELLER: { DIAMANTE: 20001, OURO: 5001 },
    PRATA_MIN: 499,
};

const TIER_CONFIG = {
    DIAMANTE: { name: 'Diamante', icon: Gem, color: 'text-cyan-500', bgColor: 'bg-cyan-100', commission: { FINDER: 15, SELLER: 25 } },
    OURO: { name: 'Ouro', icon: Trophy, color: 'text-amber-500', bgColor: 'bg-amber-100', commission: { FINDER: 10, SELLER: 20 } },
    PRATA: { name: 'Prata', icon: Star, color: 'text-gray-500', bgColor: 'bg-gray-100', commission: { FINDER: 5, SELLER: 15 } },
};

const getPartnerDetails = (revenue, type) => {
    const thresholds = TIER_THRESHOLDS[type];
    if (revenue >= thresholds.DIAMANTE) return { ...TIER_CONFIG.DIAMANTE, commissionRate: TIER_CONFIG.DIAMANTE.commission[type] };
    if (revenue >= thresholds.OURO) return { ...TIER_CONFIG.OURO, commissionRate: TIER_CONFIG.OURO.commission[type] };
    if (revenue >= TIER_THRESHOLDS.PRATA_MIN) return { ...TIER_CONFIG.PRATA, commissionRate: TIER_CONFIG.PRATA.commission[type] };
    
    return { name: 'N/A', icon: Users, color: 'text-slate-400', bgColor: 'bg-slate-100', commissionRate: 0 };
};


// --- Componente Principal do App ---
export default function App() {
    // --- Estados ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [partners, setPartners] = useState([]);
    const [deals, setDeals] = useState([]);
    const [resources, setResources] = useState([]);
    const [nurturingContent, setNurturingContent] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // --- Efeito de Inicialização do Firebase ---
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
        script.async = true;
        document.head.appendChild(script);
        
        try {
            if(firebaseConfig.apiKey) {
                const app = initializeApp(firebaseConfig);
                const authInstance = getAuth(app);
                const dbInstance = getFirestore(app);
                setAuth(authInstance);
                setDb(dbInstance);

                const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                    if (user) {
                        setUserId(user.uid);
                    } else {
                        await signInAnonymously(authInstance);
                    }
                    setIsAuthReady(true);
                });
                 return () => {
                    unsubscribe();
                    if (document.head.contains(script)) {
                        document.head.removeChild(script);
                    }
                };
            } else {
                 console.error("Configuração do Firebase não encontrada. Verifique as variáveis de ambiente.");
                 setIsLoading(false);
            }
        } catch (error) {
            console.error("Erro na inicialização do Firebase:", error);
            setIsAuthReady(true);
        }
    }, []);

    // --- Efeito para Carregar Dados do Firestore ---
    useEffect(() => {
        if (!isAuthReady || !db) {
            return;
        }
        
        setIsLoading(false);
        const collections = { partners: setPartners, deals: setDeals, resources: setResources, nurturing: setNurturingContent };

        const unsubscribers = Object.entries(collections).map(([col, setter]) => {
            const collectionPath = `artifacts/${appId}/public/data/${col}`;
            const q = query(collection(db, collectionPath));
            
            return onSnapshot(q, (querySnapshot) => {
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (items.length > 0 && items[0].createdAt) {
                    items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                }
                setter(items);
            }, (error) => console.error(`Erro ao carregar ${col}:`, error));
        });

        return () => unsubscribers.forEach(unsub => unsub());
    }, [isAuthReady, db]);

    // --- Lógica de Filtragem por Data ---
    const filteredDeals = useMemo(() => {
        if (!startDate && !endDate) {
            return deals;
        }
        const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

        return deals.filter(deal => {
            if (!deal.submissionDate || !deal.submissionDate.toDate) return false;
            const dealDate = deal.submissionDate.toDate();
            
            const isAfterStart = start ? dealDate >= start : true;
            const isBeforeEnd = end ? dealDate <= end : true;

            return isAfterStart && isBeforeEnd;
        });
    }, [deals, startDate, endDate]);

    // --- Cálculo de Dados Derivados (Níveis, Receita, etc.) ---
    const partnersWithDetails = useMemo(() => {
        const dealsByPartner = filteredDeals.reduce((acc, deal) => {
            if (!acc[deal.partnerId]) {
                acc[deal.partnerId] = [];
            }
            acc[deal.partnerId].push(deal);
            return acc;
        }, {});

        return partners.map(partner => {
            const partnerDeals = dealsByPartner[partner.id] || [];
            
            const revenue = partnerDeals
                .filter(d => d.status === 'Ganho')
                .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
            
            const totalOpportunitiesValue = partnerDeals
                .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
                
            const wonDealsCount = partnerDeals.filter(d => d.status === 'Ganho').length;
            const totalDealsCount = partnerDeals.length;
            const conversionRate = totalDealsCount > 0 ? (wonDealsCount / totalDealsCount) * 100 : 0;

            const type = partner.type || 'FINDER';
            const tierDetails = getPartnerDetails(revenue, type);
            
            return { 
                ...partner, 
                revenue, 
                tier: tierDetails,
                totalOpportunitiesValue,
                conversionRate
            };
        });
    }, [partners, filteredDeals]);

    // --- Funções Auxiliares ---
    const openModal = (type) => { setModalType(type); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setModalType(''); };
    
    const handleAdd = async (collectionName, data) => {
        if (!db) return;
        try {
            const collectionPath = `artifacts/${appId}/public/data/${collectionName}`;
            const dataWithTimestamp = {
                ...data,
                createdAt: serverTimestamp(),
                authorId: userId,
            };
            if (collectionName === 'deals' && data.submissionDate) {
                const dateObj = new Date(data.submissionDate);
                if (!isNaN(dateObj.getTime())) {
                    dataWithTimestamp.submissionDate = Timestamp.fromDate(dateObj);
                } else {
                     dataWithTimestamp.submissionDate = Timestamp.now();
                }
            } else if (collectionName === 'deals') {
                dataWithTimestamp.submissionDate = Timestamp.now();
            }

            await addDoc(collection(db, collectionPath), dataWithTimestamp);
            closeModal();
        } catch (error) {
            console.error("Erro ao adicionar documento: ", error);
        }
    };
    
    const handleImportDeals = async (file, selectedPartnerId) => {
        if (!file || !db || !selectedPartnerId) return;

        const selectedPartner = partners.find(p => p.id === selectedPartnerId);
        if (!selectedPartner) {
            console.error("Parceiro selecionado não encontrado.");
            return;
        }

        return new Promise((resolve, reject) => {
            window.Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const dealsToImport = results.data;
                    const batch = writeBatch(db);
                    const dealsCollectionRef = collection(db, `artifacts/${appId}/public/data/deals`);
                    let successfulImports = 0;
                    let failedImports = 0;

                    dealsToImport.forEach(deal => {
                        const submissionDateStr = deal.submissionDate ? deal.submissionDate.trim() : null;
                        if (deal.clientName && deal.value && deal.status && submissionDateStr) {
                            const datePart = submissionDateStr.split(' ')[0];
                            const dateObj = new Date(datePart);
                            
                            if(!isNaN(dateObj.getTime())){
                                const newDealRef = doc(dealsCollectionRef);
                                batch.set(newDealRef, {
                                    clientName: deal.clientName,
                                    partnerId: selectedPartnerId,
                                    partnerName: selectedPartner.name,
                                    value: parseFloat(deal.value) || 0,
                                    status: deal.status,
                                    submissionDate: Timestamp.fromDate(dateObj),
                                    createdAt: serverTimestamp(),
                                    authorId: userId,
                                });
                                successfulImports++;
                            } else {
                                console.warn("Oportunidade ignorada (data inválida):", deal);
                                failedImports++;
                            }
                        } else {
                            console.warn("Oportunidade ignorada (dados em falta):", deal);
                            failedImports++;
                        }
                    });

                    try {
                        await batch.commit();
                        resolve({ successfulImports, failedImports });
                    } catch (error) {
                        console.error("Erro ao fazer batch-write das oportunidades:", error);
                        reject(error);
                    }
                },
                error: (error) => {
                    console.error("Erro ao analisar o CSV:", error);
                    reject(error);
                }
            });
        });
    };


    // --- Renderização Principal ---
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-700">A carregar PRM Driva...</div></div>;
    }

     if (!firebaseConfig.apiKey) {
        return (
            <div className="flex items-center justify-center h-screen bg-red-50 text-red-800 p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Erro de Configuração</h2>
                    <p>As chaves de configuração do Firebase não foram encontradas.</p>
                     <p className="mt-2">Por favor, configure as variáveis de ambiente no seu serviço de hospedagem (Vercel) para continuar.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <Header 
                    openModal={openModal} 
                    startDate={startDate}
                    endDate={endDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                />
                <div className="mt-6">
                    <Routes>
                        <Route path="/" element={<Dashboard partners={partnersWithDetails} deals={filteredDeals} />} />
                        <Route path="/partners" element={<PartnerList partners={partnersWithDetails} />} />
                        <Route path="/deals" element={<DealList deals={filteredDeals} />} />
                        <Route path="/resources" element={<ResourceHub resources={resources} />} />
                        <Route path="/nurturing" element={<NurturingHub nurturingContent={nurturingContent} />} />
                    </Routes>
                </div>
            </main>
            {isModalOpen && <Modal closeModal={closeModal} modalType={modalType} handleAdd={handleAdd} handleImport={handleImportDeals} partners={partners} />}
        </div>
    );
}

// --- Componentes de UI ---

const Sidebar = () => {
    const location = useLocation();
    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/partners', label: 'Parceiros', icon: Users },
        { path: '/deals', label: 'Oportunidades', icon: Briefcase },
        { path: '/resources', label: 'Recursos', icon: Book },
        { path: '/nurturing', label: 'Nutrição', icon: Lightbulb },
    ];
    return (
        <aside className="w-16 sm:w-64 bg-slate-800 text-white flex flex-col">
            <div className="h-16 flex items-center justify-center sm:justify-start sm:px-6 border-b border-slate-700">
                 <FileText className="h-8 w-8 text-sky-400" />
                 <h1 className="hidden sm:block ml-3 text-xl font-bold">PRM Driva</h1>
            </div>
            <nav className="flex-1 mt-6">
                <ul>
                    {navItems.map(item => (
                        <li key={item.path} className="px-3 sm:px-6 py-1">
                            <Link to={item.path} className={`w-full flex items-center p-2 rounded-md transition-colors duration-200 ${location.pathname === item.path ? 'bg-sky-500 text-white' : 'hover:bg-slate-700'}`}>
                                <item.icon className="h-5 w-5" />
                                <span className="hidden sm:inline ml-4 font-medium">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

const Header = ({ openModal, startDate, endDate, setStartDate, setEndDate }) => {
    const location = useLocation();
    const view = location.pathname;

    const viewTitles = {
        '/': 'Dashboard de Canais',
        '/partners': 'Gestão de Parceiros',
        '/deals': 'Registro de Oportunidades',
        '/resources': 'Central de Recursos',
        '/nurturing': 'Nutrição de Parceiros',
    };
    const buttonInfo = {
        '/partners': { label: 'Novo Parceiro', action: () => openModal('partner') },
        '/deals': { label: 'Registrar Oportunidade', action: () => openModal('deal') },
        '/resources': { label: 'Novo Recurso', action: () => openModal('resource') },
        '/nurturing': { label: 'Novo Conteúdo', action: () => openModal('nurturing') },
    };
    
    const showFilters = ['/', '/partners', '/deals'].includes(view);

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
    }

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{viewTitles[view]}</h1>
                <div className="flex items-center gap-2">
                    {view === '/deals' && (
                         <button 
                            onClick={() => openModal('importDeals')}
                            className="flex items-center bg-white text-sky-500 border border-sky-500 px-4 py-2 rounded-lg shadow-sm hover:bg-sky-50 transition-colors duration-200"
                        >
                            <Upload className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Importar Planilha</span>
                        </button>
                    )}
                    {buttonInfo[view] && (
                        <button onClick={buttonInfo[view].action} className="flex items-center bg-sky-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-sky-600 transition-colors duration-200">
                            <Plus className="h-5 w-5 mr-2" />
                            <span className="font-semibold">{buttonInfo[view].label}</span>
                        </button>
                    )}
                </div>
            </div>
            {showFilters && (
                <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center gap-4">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <div className="flex items-center gap-2">
                        <label htmlFor="start-date" className="text-sm font-medium text-gray-700">De:</label>
                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="end-date" className="text-sm font-medium text-gray-700">Até:</label>
                        <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm" />
                    </div>
                    {(startDate || endDate) && (
                         <button onClick={clearFilters} className="flex items-center text-sm text-gray-600 hover:text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Limpar Filtro
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const Dashboard = ({ partners, deals }) => {
    const generalStats = useMemo(() => {
        const totalRevenue = deals.filter(d => d.status === 'Ganho').reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
        return [
            { title: 'Total de Parceiros', value: partners.length, icon: Users, color: 'text-blue-500' },
            { title: 'Oportunidades no Período', value: deals.length, icon: Briefcase, color: 'text-orange-500' },
            { title: 'Receita no Período', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-green-500' },
        ];
    }, [partners, deals]);

    const typeStats = useMemo(() => {
        const finderRevenue = partners.filter(p => p.type === 'FINDER').reduce((sum, p) => sum + p.revenue, 0);
        const sellerRevenue = partners.filter(p => p.type === 'SELLER').reduce((sum, p) => sum + p.revenue, 0);
        return {
            finder: { count: partners.filter(p => p.type === 'FINDER').length, revenue: finderRevenue },
            seller: { count: partners.filter(p => p.type === 'SELLER').length, revenue: sellerRevenue },
        };
    }, [partners]);

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {generalStats.map(stat => (
                    <div key={stat.title} className="bg-white p-6 rounded-xl shadow-md flex items-center">
                        <div className={`p-3 rounded-full bg-opacity-20 ${stat.color.replace('text-', 'bg-')}`}><stat.icon className={`h-8 w-8 ${stat.color}`} /></div>
                        <div className="ml-4"><p className="text-gray-500">{stat.title}</p><p className="text-2xl font-bold text-slate-800">{stat.value}</p></div>
                    </div>
                ))}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center"><Search className="mr-2 text-blue-500"/>Análise: Finders</h2>
                    <p className="text-lg">Total de Parceiros: <span className="font-bold">{typeStats.finder.count}</span></p>
                    <p className="text-lg">Receita no Período: <span className="font-bold">R$ {typeStats.finder.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center"><Handshake className="mr-2 text-green-500"/>Análise: Sellers</h2>
                     <p className="text-lg">Total de Parceiros: <span className="font-bold">{typeStats.seller.count}</span></p>
                    <p className="text-lg">Receita no Período: <span className="font-bold">R$ {typeStats.seller.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold text-slate-700 mb-4">Oportunidades Recentes no Período</h2>
                <div className="bg-white p-4 rounded-xl shadow-md"><DealList deals={deals.slice(0, 5)} isMini={true} /></div>
            </div>
        </div>
    );
};

const PartnerList = ({ partners }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-4 font-semibold text-slate-600">Nome do Parceiro</th>
                    <th className="p-4 font-semibold text-slate-600">Tipo</th>
                    <th className="p-4 font-semibold text-slate-600">Nível (no período)</th>
                    <th className="p-4 font-semibold text-slate-600">Receita Gerada (no período)</th>
                    <th className="p-4 font-semibold text-slate-600">Oportunidades Geradas (no período)</th>
                    <th className="p-4 font-semibold text-slate-600">Taxa de Conversão (no período)</th>
                    <th className="p-4 font-semibold text-slate-600">Comissão</th>
                </tr>
            </thead>
            <tbody>
                {partners.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 text-slate-800 font-medium">{p.name}</td>
                        <td className="p-4 text-slate-600">{p.type}</td>
                        <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center w-fit ${p.tier.bgColor} ${p.tier.color}`}>
                                <p.tier.icon className="h-4 w-4 mr-2" />{p.tier.name}
                            </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">R$ {p.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-slate-600 font-medium">R$ {p.totalOpportunitiesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-slate-600 font-bold">{p.conversionRate.toFixed(1)}%</td>
                        <td className="p-4 text-slate-600 font-bold">{p.tier.commissionRate}%</td>
                    </tr>
                ))}
            </tbody>
        </table>
         {partners.length === 0 && <p className="p-4 text-center text-gray-500">Nenhum parceiro registrado.</p>}
    </div>
);

const DealList = ({ deals, isMini = false }) => {
    const statusColors = { 'Pendente': 'bg-yellow-100 text-yellow-800', 'Aprovado': 'bg-blue-100 text-blue-800', 'Ganho': 'bg-green-100 text-green-800', 'Perdido': 'bg-red-100 text-red-800' };
    return (
        <div className={!isMini ? "bg-white rounded-xl shadow-md overflow-hidden" : ""}>
            <table className="w-full text-left">
                <thead className={!isMini ? "bg-slate-50 border-b border-slate-200" : ""}>
                    <tr>
                        <th className="p-4 font-semibold text-slate-600">Data</th>
                        <th className="p-4 font-semibold text-slate-600">Cliente Final</th>
                        <th className="p-4 font-semibold text-slate-600">Parceiro</th>
                        <th className="p-4 font-semibold text-slate-600">Valor</th>
                        <th className="p-4 font-semibold text-slate-600">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {deals.map(d => (
                        <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4 text-slate-600">{d.submissionDate ? d.submissionDate.toDate().toLocaleDateString('pt-BR') : 'N/A'}</td>
                            <td className="p-4 text-slate-800 font-medium">{d.clientName}</td>
                            <td className="p-4 text-slate-600">{d.partnerName}</td>
                            <td className="p-4 text-slate-600">R$ {parseFloat(d.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded-full text-sm font-semibold ${statusColors[d.status] || 'bg-gray-100 text-gray-800'}`}>{d.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {deals.length === 0 && <p className="p-4 text-center text-gray-500">Nenhuma oportunidade encontrada para o período selecionado.</p>}
        </div>
    );
};

const ResourceHub = ({ resources }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map(r => (
            <div key={r.id} className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                <h3 className="text-lg font-bold text-slate-800">{r.title}</h3>
                <p className="text-slate-600 mt-2 flex-grow">{r.description}</p>
                <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm font-semibold bg-sky-100 text-sky-800 px-2 py-1 rounded-full">{r.category}</span>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sky-500 hover:text-sky-600">Aceder</a>
                </div>
            </div>
        ))}
        {resources.length === 0 && <p className="p-4 text-center text-gray-500 col-span-full">Nenhum recurso disponível.</p>}
    </div>
);

const NurturingHub = ({ nurturingContent }) => (
    <div className="space-y-6">
        {nurturingContent.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString('pt-BR') : ''}</p>
                <p className="text-slate-600 mt-4 whitespace-pre-wrap">{item.content}</p>
            </div>
        ))}
        {nurturingContent.length === 0 && <p className="p-4 text-center text-gray-500">Nenhum conteúdo de nutrição publicado.</p>}
    </div>
);

// --- Componente Modal e Formulários ---

const Modal = ({ closeModal, modalType, handleAdd, handleImport, partners }) => {
    const renderForm = () => {
        switch (modalType) {
            case 'partner': return <PartnerForm onSubmit={handleAdd} />;
            case 'deal': return <DealForm onSubmit={handleAdd} partners={partners} />;
            case 'resource': return <ResourceForm onSubmit={handleAdd} />;
            case 'nurturing': return <NurturingForm onSubmit={handleAdd} />;
            case 'importDeals': return <ImportDealsForm onSubmit={handleImport} closeModal={closeModal} partners={partners} />;
            default: return null;
        }
    };
    const titles = { 
        partner: 'Adicionar Novo Parceiro', 
        deal: 'Registrar Nova Oportunidade', 
        resource: 'Adicionar Novo Recurso', 
        nurturing: 'Adicionar Conteúdo de Nutrição',
        importDeals: 'Importar Oportunidades de Planilha'
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">{titles[modalType]}</h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6">{renderForm()}</div>
            </div>
        </div>
    );
};

// --- Formulários ---
const FormInput = ({ id, label, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" /></div>);
const FormSelect = ({ id, label, children, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><select id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500">{children}</select></div>);
const FormTextarea = ({ id, label, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><textarea id={id} {...props} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" /></div>);
const FormButton = ({ children, ...props }) => (<button type="submit" {...props} className="w-full bg-sky-500 text-white py-2 px-4 rounded-md hover:bg-sky-600 font-semibold transition-colors duration-200 disabled:bg-sky-300">{children}</button>);

const PartnerForm = ({ onSubmit }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        onSubmit('partners', data);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="name" name="name" label="Nome do Parceiro" required />
            <FormSelect id="type" name="type" label="Tipo de Parceiro" defaultValue="FINDER" required>
                <option value="FINDER">Finder</option>
                <option value="SELLER">Seller</option>
            </FormSelect>
            <FormInput id="contactName" name="contactName" label="Nome do Contato" required />
            <FormInput id="contactEmail" name="contactEmail" label="Email do Contato" type="email" required />
            <FormButton>Salvar Parceiro</FormButton>
        </form>
    );
};

const DealForm = ({ onSubmit, partners }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const selectedPartner = partners.find(p => p.id === data.partnerId);
        data.partnerName = selectedPartner ? selectedPartner.name : 'N/A';
        onSubmit('deals', data);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="clientName" name="clientName" label="Nome do Cliente Final" required />
            <FormSelect id="partnerId" name="partnerId" label="Parceiro Responsável" required>
                <option value="">Selecione um parceiro</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </FormSelect>
             <FormInput id="submissionDate" name="submissionDate" label="Data da Indicação" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            <FormInput id="value" name="value" label="Valor Estimado (R$)" type="number" step="0.01" required />
            <FormSelect id="status" name="status" label="Status" defaultValue="Pendente" required>
                <option>Pendente</option>
                <option>Aprovado</option>
                <option>Ganho</option>
                <option>Perdido</option>
            </FormSelect>
            <FormButton>Registrar Oportunidade</FormButton>
        </form>
    );
};

const ResourceForm = ({ onSubmit }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        onSubmit('resources', data);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="title" name="title" label="Título do Recurso" required />
            <FormTextarea id="description" name="description" label="Descrição" required />
            <FormInput id="url" name="url" label="URL do Recurso" type="url" required />
            <FormSelect id="category" name="category" label="Categoria" defaultValue="Marketing" required>
                <option>Marketing</option><option>Vendas</option><option>Técnico</option><option>Legal</option>
            </FormSelect>
            <FormButton>Salvar Recurso</FormButton>
        </form>
    );
};

const NurturingForm = ({ onSubmit }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        onSubmit('nurturing', data);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="title" name="title" label="Título do Conteúdo" required />
            <FormTextarea id="content" name="content" label="Conteúdo/Direcionamento" required />
            <FormButton>Publicar Conteúdo</FormButton>
        </form>
    );
};

const ImportDealsForm = ({ onSubmit, closeModal, partners }) => {
    const [file, setFile] = useState(null);
    const [selectedPartnerId, setSelectedPartnerId] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState('');

    const handleFileChange = (e) => {
        setImportStatus('');
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !selectedPartnerId) {
            setImportStatus('Por favor, selecione um parceiro e um arquivo .csv');
            return;
        }
        setIsImporting(true);
        setImportStatus('Importando...');
        try {
            const { successfulImports, failedImports } = await onSubmit(file, selectedPartnerId);
            setImportStatus(`${successfulImports} oportunidades importadas com sucesso. ${failedImports} falharam.`);
            setTimeout(() => {
                closeModal();
            }, 3000);
        } catch (error) {
            setImportStatus('Ocorreu um erro durante a importação.');
            console.error(error);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormSelect 
                id="partner-select" 
                label="Atribuir oportunidades para o parceiro:"
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                required
            >
                <option value="">Selecione um parceiro</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </FormSelect>
            
            <div>
                <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione um arquivo .csv
                </label>
                <p className="text-xs text-gray-500 mb-2">
                    A planilha deve conter as colunas: <code className="bg-gray-100 p-1 rounded">clientName</code>, <code className="bg-gray-100 p-1 rounded">value</code>, <code className="bg-gray-100 p-1 rounded">status</code>, e <code className="bg-gray-100 p-1 rounded">submissionDate</code> (formato AAAA-MM-DD HH:mm). A hora será desconsiderada.
                </p>
                <input 
                    id="csv-upload" 
                    name="csv-upload" 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
            </div>
            {importStatus && <p className="text-sm text-center font-medium text-gray-600">{importStatus}</p>}
            <FormButton disabled={isImporting || !file || !selectedPartnerId}>
                {isImporting ? 'Importando...' : 'Iniciar Importação'}
            </FormButton>
        </form>
    );
};
