import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, onSnapshot, query, serverTimestamp, writeBatch, Timestamp, updateDoc, deleteDoc, orderBy, getDocs } from 'firebase/firestore';
import { Users, Briefcase, DollarSign, Book, Plus, X, LayoutDashboard, Gem, Trophy, Star, Handshake, Lightbulb, Upload, Filter, XCircle, MoreVertical, Edit, Trash2, AlertTriangle, BadgePercent, ArrowLeft, User, TrendingUp, Target, Calendar, Phone, Mail, Award, LogOut, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Configuração do Firebase ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
const appId = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'prm-driva-default';

// --- Funções Utilitárias ---
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const parseBrazilianCurrency = (value) => {
    if (typeof value !== 'string') return parseFloat(value) || 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
};
const parseDateString = (dateString) => {
    if (!dateString) return null;
    try {
        const [year, month, day] = dateString.trim().split(' ')[0].split('-').map(Number);
        return isNaN(year) ? null : Timestamp.fromDate(new Date(year, month - 1, day));
    } catch (e) {
        console.error("Erro ao converter data:", dateString, e);
        return null;
    }
};

// --- Configurações do Programa de Parceria Driva ---
const TIER_THRESHOLDS = { FINDER: { DIAMANTE: 30001, OURO: 5001 }, SELLER: { DIAMANTE: 20001, OURO: 5001 }, PRATA_MIN: 499 };
const TIER_CONFIG = {
    DIAMANTE: { name: 'Diamante', icon: Gem, color: 'text-cyan-500', bgColor: 'bg-cyan-100', commission: { FINDER: 15, SELLER: 25 } },
    OURO: { name: 'Ouro', icon: Trophy, color: 'text-amber-500', bgColor: 'bg-amber-100', commission: { FINDER: 10, SELLER: 20 } },
    PRATA: { name: 'Prata', icon: Star, color: 'text-gray-500', bgColor: 'bg-gray-100', commission: { FINDER: 5, SELLER: 15 } },
};
const getPartnerDetails = (paymentsReceived, type) => {
    const thresholds = TIER_THRESHOLDS[type];
    if (paymentsReceived >= thresholds.DIAMANTE) return { ...TIER_CONFIG.DIAMANTE, commissionRate: TIER_CONFIG.DIAMANTE.commission[type] };
    if (paymentsReceived >= thresholds.OURO) return { ...TIER_CONFIG.OURO, commissionRate: TIER_CONFIG.OURO.commission[type] };
    if (paymentsReceived >= TIER_THRESHOLDS.PRATA_MIN) return { ...TIER_CONFIG.PRATA, commissionRate: TIER_CONFIG.PRATA.commission[type] };
    return { name: 'N/A', icon: Users, color: 'text-slate-400', bgColor: 'bg-slate-100', commissionRate: 0 };
};

// --- Contexto da Aplicação ---
const PrmContext = createContext();
export const usePrm = () => useContext(PrmContext);

const PrmProvider = ({ children, auth }) => {
    const [db, setDb] = useState(null);
    const [data, setData] = useState({ partners: [], deals: [], payments: [], resources: [], nurturing: [], activities: [] });
    const [uiState, setUiState] = useState({ isModalOpen: false, modalType: '', itemToEdit: null, itemToDelete: null, bulkDeleteConfig: null });
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });
    const [selection, setSelection] = useState({ deals: [], payments: [] });

    useEffect(() => { if (auth) setDb(getFirestore(auth.app)); }, [auth]);

    useEffect(() => {
        if (!db) return;
        const collectionsConfig = {
            partners: { orderByField: null },
            deals: { orderByField: 'submissionDate' },
            payments: { orderByField: 'paymentDate' },
            resources: { orderByField: null },
            nurturing: { orderByField: 'createdAt' },
            activities: { orderByField: 'createdAt' }
        };

        const unsubscribers = Object.entries(collectionsConfig).map(([colName, config]) => {
            const collectionPath = `artifacts/${appId}/public/data/${colName}`;
            const q = config.orderByField
                ? query(collection(db, collectionPath), orderBy(config.orderByField, 'desc'))
                : query(collection(db, collectionPath));
            
            return onSnapshot(q, (snapshot) => {
                const dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setData(prevData => ({ ...prevData, [colName]: dataList }));
            }, (error) => console.error(`Erro ao carregar ${colName}:`, error));
        });
        return () => unsubscribers.forEach(unsub => unsub());
    }, [db]);

    const filteredData = useMemo(() => {
        const { startDate, endDate } = filters;
        if (!startDate && !endDate) return { deals: data.deals, payments: data.payments };
        const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

        const filterByDate = (items, dateField) => items.filter(item => {
            const itemDate = item[dateField]?.toDate();
            return itemDate && (!start || itemDate >= start) && (!end || itemDate <= end);
        });

        return {
            deals: filterByDate(data.deals, 'submissionDate'),
            payments: filterByDate(data.payments, 'paymentDate')
        };
    }, [data.deals, data.payments, filters]);

    const partnersWithDetails = useMemo(() => {
        const paymentsByPartner = filteredData.payments.reduce((acc, p) => ({ ...acc, [p.partnerId]: (acc[p.partnerId] || 0) + parseBrazilianCurrency(p.paymentValue) }), {});
        const dealsByPartner = filteredData.deals.reduce((acc, d) => ({ ...acc, [d.partnerId]: [...(acc[d.partnerId] || []), d] }), {});

        return data.partners.map(partner => {
            const paymentsReceived = paymentsByPartner[partner.id] || 0;
            const partnerDeals = dealsByPartner[partner.id] || [];
            const wonDeals = partnerDeals.filter(d => d.status === 'Ganho');
            const generatedRevenue = wonDeals.reduce((sum, d) => sum + parseBrazilianCurrency(d.value), 0);
            const totalOpportunitiesValue = partnerDeals.reduce((sum, d) => sum + parseBrazilianCurrency(d.value), 0);
            const conversionRate = partnerDeals.length > 0 ? (wonDeals.length / partnerDeals.length) * 100 : 0;
            const type = partner.type || 'Finder';
            const tierDetails = getPartnerDetails(paymentsReceived, type);
            const commissionToPay = paymentsReceived * (tierDetails.commissionRate / 100);
            return { ...partner, paymentsReceived, tier: tierDetails, totalOpportunitiesValue, conversionRate, commissionToPay, generatedRevenue };
        });
    }, [data.partners, filteredData.deals, filteredData.payments]);

    const openModal = (type, item = null) => setUiState(prev => ({ ...prev, modalType: type, itemToEdit: item, isModalOpen: true }));
    const closeModal = () => setUiState(prev => ({ ...prev, isModalOpen: false, modalType: '', itemToEdit: null }));
    const handleDelete = (collectionName, id) => setUiState(prev => ({ ...prev, itemToDelete: { collectionName, id } }));
    const handleBulkDelete = (collectionName, ids) => {
        if (ids.length > 0) setUiState(prev => ({ ...prev, bulkDeleteConfig: { collectionName, ids, title: `Excluir ${ids.length} itens?`, message: `Tem a certeza de que deseja excluir os ${ids.length} itens selecionados?` } }));
    };
    
    const crudHandler = async (action, collectionName, id, data) => {
        if (!db) return;
        const path = `artifacts/${appId}/public/data/${collectionName}`;
        try {
            switch (action) {
                case 'add':
                    const dataWithTs = { ...data, createdAt: serverTimestamp(), ...(data.submissionDate && { submissionDate: parseDateString(data.submissionDate) }) };
                    await addDoc(collection(db, path), dataWithTs);
                    break;
                case 'update':
                    const dataToUpdate = { ...data, ...(data.submissionDate && { submissionDate: parseDateString(data.submissionDate) }) };
                    await updateDoc(doc(db, path, id), dataToUpdate);
                    break;
                case 'delete':
                    await deleteDoc(doc(db, path, id));
                    setUiState(prev => ({ ...prev, itemToDelete: null }));
                    return; // Retorna para não fechar modal que não está aberto
                case 'bulkDelete':
                    const batch = writeBatch(db);
                    id.forEach(docId => batch.delete(doc(db, path, docId)));
                    await batch.commit();
                    setSelection(prev => ({ ...prev, [collectionName === 'deals' ? 'deals' : 'payments']: [] }));
                    setUiState(prev => ({ ...prev, bulkDeleteConfig: null }));
                    return;
                default:
                    throw new Error("Ação de CRUD inválida");
            }
            closeModal();
        } catch (error) {
            console.error(`Erro ao ${action} em ${collectionName}:`, error);
        }
    };
    
    const handleActivitySubmit = async (collectionName, idOrData, data) => {
        const isEditMode = typeof idOrData === 'string';
        if (isEditMode) {
            await crudHandler('update', collectionName, idOrData, data);
        } else {
            const dataToSave = { ...data, partnerId: idOrData.id, partnerName: idOrData.name };
            await crudHandler('add', collectionName, null, dataToSave);
        }
    };
    
    const handleImport = async (file, collectionName, selectedPartnerId) => {
        if (!file || !db) return;
        const partnersSnapshot = await getDocs(query(collection(db, `artifacts/${appId}/public/data/partners`)));
        const partnersMap = new Map(partnersSnapshot.docs.map(doc => [doc.data().name.toLowerCase(), doc.id]));
    
        return new Promise((resolve, reject) => {
            if (!window.Papa) return reject(new Error("PapaParse não carregado."));
            window.Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    if (!results.data.length) return resolve({ successfulImports: 0, failedImports: 0 });
                    
                    const batch = writeBatch(db);
                    const colRef = collection(db, `artifacts/${appId}/public/data/${collectionName}`);
                    let successfulImports = 0;
                    
                    results.data.forEach(item => {
                        let dataToSet;
                        if (collectionName === 'partners' && item.name && item.type) {
                            dataToSet = { name: item.name.trim(), type: item.type.trim(), contactName: item.contactName?.trim(), contactEmail: item.contactEmail?.trim() };
                        } else if (collectionName === 'deals' && selectedPartnerId && item.clientName && item.value && item.submissionDate) {
                            dataToSet = { partnerId: selectedPartnerId, partnerName: data.partners.find(p => p.id === selectedPartnerId)?.name, clientName: item.clientName.trim(), value: parseBrazilianCurrency(item.value), status: item.status?.trim() || 'Pendente', submissionDate: parseDateString(item.submissionDate) };
                        } else if (collectionName === 'payments' && item.partnerName && item.paymentValue && item.paymentDate) {
                            const partnerId = partnersMap.get(item.partnerName.trim().toLowerCase());
                            if (partnerId) dataToSet = { partnerId, partnerName: item.partnerName.trim(), clientName: item.clientName?.trim(), paymentValue: parseBrazilianCurrency(item.paymentValue), paymentDate: parseDateString(item.paymentDate) };
                        }
                        
                        if (dataToSet) {
                            batch.set(doc(colRef), { ...dataToSet, createdAt: serverTimestamp() });
                            successfulImports++;
                        }
                    });

                    try {
                        await batch.commit();
                        resolve({ successfulImports, failedImports: results.data.length - successfulImports });
                    } catch (e) { reject(e); }
                },
                error: (e) => reject(e)
            });
        });
    };

    const value = {
        auth,
        ...data,
        ...uiState,
        ...filters,
        ...selection,
        filteredDeals: filteredData.deals,
        filteredPayments: filteredData.payments,
        partnersWithDetails,
        openModal,
        closeModal,
        handleDelete,
        handleBulkDelete,
        setStartDate: (date) => setFilters(prev => ({ ...prev, startDate: date })),
        setEndDate: (date) => setFilters(prev => ({ ...prev, endDate: date })),
        setSelectedDeals: (ids) => setSelection(prev => ({ ...prev, deals: ids })),
        setSelectedPayments: (ids) => setSelection(prev => ({ ...prev, payments: ids })),
        confirmDelete: () => crudHandler('delete', uiState.itemToDelete.collectionName, uiState.itemToDelete.id),
        cancelDelete: () => setUiState(prev => ({ ...prev, itemToDelete: null })),
        confirmBulkDelete: () => crudHandler('bulkDelete', uiState.bulkDeleteConfig.collectionName, uiState.bulkDeleteConfig.ids),
        cancelBulkDelete: () => setUiState(prev => ({ ...prev, bulkDeleteConfig: null })),
        handleAdd: (col, data) => crudHandler('add', col, null, data),
        handleUpdate: (col, id, data) => crudHandler('update', col, id, data),
        handleActivitySubmit,
        handleImport,
    };

    return <PrmContext.Provider value={value}>{children}</PrmContext.Provider>;
};


// --- Componente Principal do App ---
function PrmApp() {
    const { isModalOpen, itemToDelete, bulkDeleteConfig, confirmDelete, cancelDelete, confirmBulkDelete, cancelBulkDelete } = usePrm();
    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <Header />
                <div className="mt-6">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/partners" element={<PartnerList />} />
                        <Route path="/partners/:partnerId" element={<PartnerDetail />} />
                        <Route path="/opportunities" element={<DealList />} />
                        <Route path="/commissioning" element={<CommissioningList />} />
                        <Route path="/resources" element={<ResourceHub />} />
                        <Route path="/nurturing" element={<NurturingHub />} />
                    </Routes>
                </div>
            </main>
            {isModalOpen && <Modal />}
            {itemToDelete && <ConfirmationModal onConfirm={confirmDelete} onCancel={cancelDelete} />}
            {bulkDeleteConfig && <ConfirmationModal onConfirm={confirmBulkDelete} onCancel={cancelBulkDelete} title={bulkDeleteConfig.title} message={bulkDeleteConfig.message} />}
        </div>
    );
}

// --- Componente de Login ---
const LoginPage = ({ auth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError('Email ou senha inválidos. Por favor, tente novamente.');
            console.error("Erro de login:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="flex justify-center">
                     <img src="/logo-driva-positiva.png" alt="Logo Driva" className="h-12"/>
                </div>
                <h2 className="text-2xl font-bold text-center text-slate-800">Acesso ao PRM Driva</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <FormInput id="email" name="email" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <FormInput id="password" name="password" type="password" label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <div className="flex items-center">
                        <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded" />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Continuar logado</label>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <FormButton disabled={loading}>{loading ? 'A entrar...' : 'Entrar'}</FormButton>
                </form>
            </div>
        </div>
    );
};

export default function AppWrapper() {
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
        script.async = true;
        document.head.appendChild(script);
        try {
            if(firebaseConfig.apiKey && firebaseConfig.projectId) {
                const app = initializeApp(firebaseConfig);
                const authInstance = getAuth(app);
                setAuth(authInstance);
                const unsubscribe = onAuthStateChanged(authInstance, (user) => {
                    setUser(user);
                    setLoading(false);
                });
                return () => { unsubscribe(); if (document.head.contains(script)) document.head.removeChild(script); };
            } else { 
                console.error("Firebase config is missing!");
                setLoading(false); 
            }
        } catch (error) { console.error("Erro na inicialização:", error); setLoading(false); }
    }, []);

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-700">A carregar...</div></div>;
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return <div className="flex items-center justify-center h-screen bg-red-50 text-red-800 p-8"><div className="text-center"><h2 className="text-2xl font-bold mb-4">Erro de Configuração</h2><p>As chaves do Firebase não foram encontradas. Verifique as variáveis de ambiente.</p></div></div>;
    
    return user ? <PrmProvider auth={auth}><PrmApp /></PrmProvider> : <LoginPage auth={auth} />;
}


// --- Componentes de UI ---
const Sidebar = () => {
    const { auth } = usePrm();
    const location = useLocation();
    const handleLogout = () => signOut(auth);
    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/partners', label: 'Parceiros', icon: Users },
        { path: '/opportunities', label: 'Oportunidades', icon: Briefcase },
        { path: '/commissioning', label: 'Comissionamento', icon: BadgePercent },
        { path: '/resources', label: 'Recursos', icon: Book },
        { path: '/nurturing', label: 'Nutrição', icon: Lightbulb },
    ];
    return ( <aside className="w-16 sm:w-64 bg-slate-800 text-white flex flex-col"><div className="h-16 flex items-center justify-center sm:justify-start sm:px-6 border-b border-slate-700"><img src="/logo-driva-negativa.png" alt="Logo Driva" className="h-8 hidden sm:block" /><Handshake className="h-8 w-8 text-white sm:hidden" /></div><nav className="flex-1 mt-6"><ul>{navItems.map(item => (<li key={item.path} className="px-3 sm:px-6 py-1"><Link to={item.path} className={`w-full flex items-center p-2 rounded-md transition-colors duration-200 ${(location.pathname.startsWith(item.path) && item.path !== '/') || location.pathname === item.path ? 'bg-sky-500 text-white' : 'hover:bg-slate-700'}`}><item.icon className="h-5 w-5" /><span className="hidden sm:inline ml-4 font-medium">{item.label}</span></Link></li>))}</ul></nav><div className="p-4 border-t border-slate-700"><button onClick={handleLogout} className="w-full flex items-center p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"><LogOut className="h-5 w-5" /><span className="hidden sm:inline ml-4 font-medium">Sair</span></button></div></aside> );
};

const Header = () => {
    const { openModal, startDate, endDate, setStartDate, setEndDate, deals: selectedDeals, payments: selectedPayments, handleBulkDelete } = usePrm();
    const location = useLocation();
    const isDetailView = location.pathname.includes('/partners/');
    const viewTitles = { '/': 'Dashboard de Canais', '/partners': 'Gestão de Parceiros', '/opportunities': 'Registro de Oportunidades', '/commissioning': 'Cálculo de Comissionamento', '/resources': 'Central de Recursos', '/nurturing': 'Nutrição de Parceiros', detail: 'Detalhes do Parceiro' };
    const currentTitle = isDetailView ? viewTitles.detail : viewTitles[location.pathname];
    const buttonInfo = {
        '/partners': { label: 'Novo Parceiro', modal: 'partner' },
        '/opportunities': { label: 'Registrar Oportunidade', modal: 'deal' },
        '/resources': { label: 'Novo Recurso', modal: 'resource' },
        '/nurturing': { label: 'Novo Conteúdo', modal: 'nurturing' },
    };
    const showFilters = ['/', '/partners', '/opportunities', '/commissioning', '/partners/'].some(path => location.pathname.startsWith(path));

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{currentTitle}</h1>
                <div className="flex items-center gap-2">
                    {location.pathname === '/partners' && (<button onClick={() => openModal('importPartners')} className="flex items-center bg-white text-sky-500 border border-sky-500 px-4 py-2 rounded-lg shadow-sm hover:bg-sky-50"><Upload className="h-5 w-5 mr-2" /><span className="font-semibold">Importar Parceiros</span></button>)}
                    {location.pathname === '/opportunities' && selectedDeals.length > 0 && (<button onClick={() => handleBulkDelete('deals', selectedDeals)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-red-700"><Trash2 className="h-5 w-5 mr-2" /><span className="font-semibold">Excluir ({selectedDeals.length})</span></button>)}
                    {location.pathname === '/opportunities' && (<button onClick={() => openModal('importDeals')} className="flex items-center bg-white text-sky-500 border border-sky-500 px-4 py-2 rounded-lg shadow-sm hover:bg-sky-50"><Upload className="h-5 w-5 mr-2" /><span className="font-semibold">Importar Oportunidades</span></button>)}
                    {location.pathname === '/commissioning' && selectedPayments.length > 0 && (<button onClick={() => handleBulkDelete('payments', selectedPayments)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-red-700"><Trash2 className="h-5 w-5 mr-2" /><span className="font-semibold">Excluir ({selectedPayments.length})</span></button>)}
                    {location.pathname === '/commissioning' && (<button onClick={() => openModal('importPayments')} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-600"><Upload className="h-5 w-5 mr-2" /><span className="font-semibold">Importar Pagamentos</span></button>)}
                    {buttonInfo[location.pathname] && (<button onClick={() => openModal(buttonInfo[location.pathname].modal)} className="flex items-center bg-sky-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-sky-600"><Plus className="h-5 w-5 mr-2" /><span className="font-semibold">{buttonInfo[location.pathname].label}</span></button>)}
                </div>
            </div>
            {showFilters && (
                <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center gap-4">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <div className="flex items-center gap-2"><label htmlFor="start-date" className="text-sm font-medium text-gray-700">De:</label><input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md shadow-sm" /></div>
                    <div className="flex items-center gap-2"><label htmlFor="end-date" className="text-sm font-medium text-gray-700">Até:</label><input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md shadow-sm" /></div>
                    {(startDate || endDate) && (<button onClick={() => { setStartDate(''); setEndDate(''); }} className="flex items-center text-sm text-gray-600 hover:text-red-600"><XCircle className="h-4 w-4 mr-1" />Limpar Filtro</button>)}
                </div>
            )}
        </div>
    );
};

const Dashboard = () => {
    const { partnersWithDetails, filteredDeals, activities, openModal, handleDelete } = usePrm();
    const { totalPayments, totalGeneratedRevenue } = useMemo(() => ({
        totalPayments: partnersWithDetails.reduce((sum, p) => sum + p.paymentsReceived, 0),
        totalGeneratedRevenue: partnersWithDetails.reduce((sum, p) => sum + p.generatedRevenue, 0)
    }), [partnersWithDetails]);
    const stats = [ { title: 'Total de Parceiros', value: partnersWithDetails.length, icon: Users, color: 'text-blue-500' }, { title: 'Oportunidades no Período', value: filteredDeals.length, icon: Briefcase, color: 'text-orange-500' }, { title: 'Receita Gerada (Ganhos)', value: formatCurrency(totalGeneratedRevenue), icon: Target, color: 'text-indigo-500' }, { title: 'Pagamentos Recebidos', value: formatCurrency(totalPayments), icon: DollarSign, color: 'text-green-500' }, ];
    return ( 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{stats.map(stat => (<div key={stat.title} className="bg-white p-6 rounded-xl shadow-md flex items-center"><div className={`p-3 rounded-full bg-opacity-20 ${stat.color.replace('text-', 'bg-')}`}><stat.icon className={`h-8 w-8 ${stat.color}`} /></div><div className="ml-4"><p className="text-gray-500">{stat.title}</p><p className="text-2xl font-bold text-slate-800">{stat.value}</p></div></div>))}</div>
                <div className="mt-6"><h2 className="text-xl font-bold text-slate-700 mb-4">Oportunidades Recentes no Período</h2><div className="bg-white p-4 rounded-xl shadow-md"><DealList isMini={true} deals={filteredDeals.slice(0, 5)} /></div></div>
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center"><TrendingUp className="mr-2"/>Atividades Recentes</h2>
                <ActivityFeed activities={activities.slice(0, 5)} onEdit={(activity) => openModal('activity', activity)} onDelete={(id) => handleDelete('activities', id)} />
            </div>
        </div> 
    );
};

const Paginator = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return ( <div className="flex justify-center items-center mt-4 p-4"><button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={20} /></button><span className="px-4 text-sm font-medium">Página {currentPage} de {totalPages}</span><button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={20} /></button></div> );
};

const usePagination = (data, itemsPerPage = 10) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = useMemo(() => data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [data, currentPage, itemsPerPage]);
    useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); else if (currentPage === 0 && totalPages > 0) setCurrentPage(1); }, [data.length, totalPages, currentPage]);
    const PaginatorComponent = () => <Paginator currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />;
    return [paginatedData, PaginatorComponent, currentPage, setCurrentPage];
};

const PartnerList = () => {
    const { partnersWithDetails, openModal, handleDelete } = usePrm();
    const navigate = useNavigate();
    const [paginatedPartners, PaginatorComponent] = usePagination(partnersWithDetails);
    return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4 font-semibold text-slate-600">Nome do Parceiro</th><th className="p-4 font-semibold text-slate-600">Tipo</th><th className="p-4 font-semibold text-slate-600">Nível</th><th className="p-4 font-semibold text-slate-600">Pagamentos Recebidos</th><th className="p-4 font-semibold text-slate-600">Receita Gerada (Ganhos)</th><th className="p-4 font-semibold text-slate-600">Comissão a Pagar</th><th className="p-4 font-semibold text-slate-600">Ações</th></tr></thead>
                <tbody>
                    {paginatedPartners.map(p => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/partners/${p.id}`)}>
                            <td className="p-4 text-slate-800 font-medium">{p.name}</td>
                            <td className="p-4 text-slate-600">{p.type}</td>
                            <td className="p-4"><span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center w-fit ${p.tier.bgColor} ${p.tier.color}`}><p.tier.icon className="h-4 w-4 mr-2" />{p.tier.name}</span></td>
                            <td className="p-4 text-slate-600 font-medium">{formatCurrency(p.paymentsReceived)}</td>
                            <td className="p-4 text-slate-600 font-medium">{formatCurrency(p.generatedRevenue)}</td>
                            <td className="p-4 text-green-600 font-bold">{formatCurrency(p.commissionToPay)}</td>
                            <td className="p-4 relative" onClick={(e) => e.stopPropagation()}><ActionsMenu onEdit={() => openModal('partner', p)} onDelete={() => handleDelete('partners', p.id)} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
         {partnersWithDetails.length === 0 && <p className="p-4 text-center text-gray-500">Nenhum parceiro registrado.</p>}
         <PaginatorComponent />
    </div>
)};

const PartnerDetail = () => {
    const { partnersWithDetails, activities, openModal, handleDelete } = usePrm();
    const { partnerId } = useParams();
    const partner = partnersWithDetails.find(p => p.id === partnerId);
    const partnerActivities = useMemo(() => activities.filter(a => a.partnerId === partnerId), [activities, partnerId]);
    if (!partner) return <div className="text-center text-gray-500">Parceiro não encontrado.</div>;
    return (
        <div>
            <Link to="/partners" className="flex items-center text-sky-600 hover:underline mb-6 font-semibold"><ArrowLeft size={18} className="mr-2" />Voltar para a lista de parceiros</Link>
            <div className="bg-white p-6 rounded-xl shadow-md mb-6"><div className="flex items-center"><div className={`p-3 rounded-full ${partner.tier.bgColor}`}><partner.tier.icon className={`h-10 w-10 ${partner.tier.color}`} /></div><div className="ml-4"><h2 className="text-3xl font-bold text-slate-800">{partner.name}</h2><p className="text-gray-500">{partner.type}</p></div></div></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md"><h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center"><User size={20} className="mr-2 text-sky-500" />Informações de Contato</h3><div className="space-y-2"><p className="text-gray-700"><strong>Nome:</strong> {partner.contactName}</p><p className="text-gray-700"><strong>Email:</strong> {partner.contactEmail}</p></div></div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md"><h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center"><TrendingUp size={20} className="mr-2 text-sky-500" />Métricas (no período)</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <div><p className="text-sm text-gray-500">Pagamentos Recebidos</p><p className="text-2xl font-bold text-green-600">{formatCurrency(partner.paymentsReceived)}</p></div>
                        <div><p className="text-sm text-gray-500">Comissão a Pagar</p><p className="text-2xl font-bold text-green-600">{formatCurrency(partner.commissionToPay)}</p></div>
                        <div><p className="text-sm text-gray-500">Receita Gerada (Ganhos)</p><p className="text-2xl font-bold text-slate-800">{formatCurrency(partner.generatedRevenue)}</p></div>
                        <div><p className="text-sm text-gray-500">Oportunidades Geradas</p><p className="text-2xl font-bold text-slate-800">{formatCurrency(partner.totalOpportunitiesValue)}</p></div>
                        <div><p className="text-sm text-gray-500">Taxa de Conversão</p><p className="text-2xl font-bold text-slate-800">{partner.conversionRate.toFixed(1)}%</p></div>
                    </div>
                </div>
            </div>
            <div className="mt-6 bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-700">Histórico de Atividades</h3>
                    <button onClick={() => openModal('activity', partner)} className="flex items-center bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-sky-200"><Plus size={16} className="mr-2"/>Adicionar Atividade</button>
                </div>
                <ActivityFeed activities={partnerActivities} onEdit={(activity) => openModal('activity', activity)} onDelete={(id) => handleDelete('activities', id)} />
            </div>
        </div>
    );
};

const DealList = ({ isMini = false, deals: initialDeals }) => {
    const { partners, openModal, handleDelete, filteredDeals, deals: selectedDeals, setSelectedDeals } = usePrm();
    const dealsToDisplay = isMini ? initialDeals : filteredDeals;
    const statusColors = { 'Pendente': 'bg-yellow-100 text-yellow-800', 'Aprovado': 'bg-blue-100 text-blue-800', 'Ganho': 'bg-green-100 text-green-800', 'Perdido': 'bg-red-100 text-red-800' };
    const [paginatedDeals, PaginatorComponent, currentPage, setCurrentPage] = usePagination(dealsToDisplay);

    useEffect(() => { if (!isMini) { setCurrentPage(1); } }, [filteredDeals, isMini, setCurrentPage]);
    useEffect(() => { if (!isMini) { setSelectedDeals([]); } }, [currentPage, isMini, setSelectedDeals]);
    
    const handleSelectAll = (e) => setSelectedDeals(e.target.checked ? paginatedDeals.map(d => d.id) : []);
    const handleSelectOne = (e, id) => setSelectedDeals(e.target.checked ? [...selectedDeals, id] : selectedDeals.filter(dealId => dealId !== id));

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
                        {paginatedDeals.map(d => (<tr key={d.id} className={`border-b border-slate-100 ${selectedDeals.includes(d.id) ? 'bg-sky-50' : 'hover:bg-slate-50'}`}>
                            {!isMini && <td className="p-4"><input type="checkbox" checked={selectedDeals.includes(d.id)} onChange={(e) => handleSelectOne(e, d.id)} className="rounded" /></td>}
                            {!isMini && <td className="p-4 text-slate-600">{d.submissionDate?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</td>}
                            <td className="p-4 text-slate-800 font-medium">{d.clientName}</td>
                            <td className="p-4 text-slate-600">{partners.find(p => p.id === d.partnerId)?.name || d.partnerName || 'Desconhecido'}</td>
                            <td className="p-4 text-slate-600">{formatCurrency(parseBrazilianCurrency(d.value))}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded-full text-sm font-semibold ${statusColors[d.status] || 'bg-gray-100'}`}>{d.status}</span></td>
                            {!isMini && <td className="p-4 relative"><ActionsMenu onEdit={() => openModal('deal', d)} onDelete={() => handleDelete('deals', d.id)} /></td>}
                        </tr>))}
                    </tbody>
                </table>
            </div>
            {dealsToDisplay.length === 0 && <p className="p-4 text-center text-gray-500">Nenhuma oportunidade encontrada.</p>}
            {!isMini && <PaginatorComponent />}
        </div>
    );
};

const CommissioningList = () => {
    const { partners, filteredPayments, payments: selectedPayments, setSelectedPayments } = usePrm();
    const [paginatedPayments, PaginatorComponent, currentPage, setCurrentPage] = usePagination(filteredPayments);
    useEffect(() => { setCurrentPage(1); }, [filteredPayments, setCurrentPage]);
    useEffect(() => { setSelectedPayments([]); }, [currentPage, setSelectedPayments]);

    const handleSelectAll = (e) => setSelectedPayments(e.target.checked ? paginatedPayments.map(p => p.id) : []);
    const handleSelectOne = (e, id) => setSelectedPayments(e.target.checked ? [...selectedPayments, id] : selectedPayments.filter(pId => pId !== id));
    
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={paginatedPayments.length > 0 && selectedPayments.length === paginatedPayments.length} className="rounded" /></th><th className="p-4 font-semibold text-slate-600">Data do Pagamento</th><th className="p-4 font-semibold text-slate-600">Cliente Final</th><th className="p-4 font-semibold text-slate-600">Parceiro</th><th className="p-4 font-semibold text-slate-600">Valor Pago</th></tr></thead>
                    <tbody>{paginatedPayments.map(p => (<tr key={p.id} className={`border-b border-slate-100 ${selectedPayments.includes(p.id) ? 'bg-sky-50' : 'hover:bg-slate-50'}`}><td className="p-4"><input type="checkbox" checked={selectedPayments.includes(p.id)} onChange={(e) => handleSelectOne(e, p.id)} className="rounded" /></td><td className="p-4 text-slate-600">{p.paymentDate?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</td><td className="p-4 text-slate-800 font-medium">{p.clientName}</td><td className="p-4 text-slate-600">{partners.find(partner => partner.id === p.partnerId)?.name || p.partnerName || 'Desconhecido'}</td><td className="p-4 text-slate-600 font-medium">{formatCurrency(parseBrazilianCurrency(p.paymentValue))}</td></tr>))}{filteredPayments.length === 0 && <tr><td colSpan="5"><p className="p-4 text-center text-gray-500">Nenhum pagamento encontrado.</p></td></tr>}</tbody>
                </table>
            </div>
            <PaginatorComponent />
        </div>
    );
};

const ResourceHub = () => { const { resources, openModal, handleDelete } = usePrm(); return ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{resources.map(r => (<div key={r.id} className="bg-white p-6 rounded-xl shadow-md flex flex-col relative"><div className="absolute top-2 right-2"><ActionsMenu onEdit={() => openModal('resource', r)} onDelete={() => handleDelete('resources', r.id)} /></div><h3 className="text-lg font-bold text-slate-800 pr-8">{r.title}</h3><p className="text-slate-600 mt-2 flex-grow">{r.description}</p><div className="mt-4 flex justify-between items-center"><span className="text-sm font-semibold bg-sky-100 text-sky-800 px-2 py-1 rounded-full">{r.category}</span><a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sky-500 hover:text-sky-600">Aceder</a></div></div>))}{resources.length === 0 && <p className="p-4 text-center text-gray-500 col-span-full">Nenhum recurso disponível.</p>}</div>)};
const NurturingHub = () => { const { nurturing, openModal, handleDelete } = usePrm(); return ( <div className="space-y-6">{nurturing.map(item => (<div key={item.id} className="bg-white p-6 rounded-xl shadow-md relative"><div className="absolute top-2 right-2"><ActionsMenu onEdit={() => openModal('nurturing', item)} onDelete={() => handleDelete('nurturing', item.id)} /></div><h3 className="text-lg font-bold text-slate-800 pr-8">{item.title}</h3><p className="text-sm text-gray-500 mt-1">{item.createdAt?.toDate().toLocaleDateString('pt-BR') || ''}</p><p className="text-slate-600 mt-4 whitespace-pre-wrap">{item.content}</p></div>))}{nurturing.length === 0 && <p className="p-4 text-center text-gray-500">Nenhum conteúdo de nutrição publicado.</p>}</div>)};

// --- Componentes Genéricos ---
const ActionsMenu = ({ onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-gray-200"
            >
                <MoreVertical size={18} />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-40 bg-white rounded-md shadow-lg border z-[9999]" // <- z-index alto
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                        <Edit size={16} className="mr-2" /> Editar
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                        <Trash2 size={16} className="mr-2" /> Excluir
                    </button>
                </div>
            )}
        </div>
    );
};
const ConfirmationModal = ({ onConfirm, onCancel, title = "Confirmar Exclusão", message = "Tem a certeza de que deseja excluir este item? Esta ação não pode ser desfeita." }) => (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center"><div className="mx-auto bg-red-100 rounded-full h-12 w-12 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-medium text-gray-900 mt-4">{title}</h3><p className="text-sm text-gray-500 mt-2">{message}</p><div className="mt-6 flex justify-center gap-4"><button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-semibold">Cancelar</button><button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">Confirmar Exclusão</button></div></div></div>);

const Modal = () => {
    const { closeModal, modalType, handleAdd, handleUpdate, handleImport, partners, itemToEdit, handleActivitySubmit } = usePrm();
    const isEditMode = !!itemToEdit?.id;
    const forms = {
        partner: <PartnerForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={itemToEdit} />,
        deal: <DealForm onSubmit={isEditMode ? handleUpdate : handleAdd} partners={partners} initialData={itemToEdit} />,
        resource: <ResourceForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={itemToEdit} />,
        nurturing: <NurturingForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={itemToEdit} />,
        activity: <ActivityForm onSubmit={handleActivitySubmit} initialData={itemToEdit} />,
        importPayments: <ImportForm collectionName="payments" onSubmit={handleImport} closeModal={closeModal} />,
        importPartners: <ImportForm collectionName="partners" onSubmit={handleImport} closeModal={closeModal} />,
        importDeals: <ImportForm collectionName="deals" partners={partners} onSubmit={handleImport} closeModal={closeModal} />,
    };
    const titles = { partner: 'Parceiro', deal: 'Oportunidade', resource: 'Recurso', nurturing: 'Conteúdo', activity: 'Atividade', importPayments: 'Importar Pagamentos', importPartners: 'Importar Parceiros', importDeals: 'Importar Oportunidades' };
    const titleAction = modalType.startsWith('import') ? '' : (isEditMode ? 'Editar' : 'Adicionar');
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-lg"><div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-slate-800">{`${titleAction} ${titles[modalType] || ''}`}</h2><button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button></div><div className="p-6">{forms[modalType] || null}</div></div></div>);
};

// --- Formulários ---
const FormInput = ({ id, label, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>);
const FormSelect = ({ id, label, children, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><select id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500">{children}</select></div>);
const FormTextarea = ({ id, label, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><textarea id={id} {...props} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>);
const FormButton = ({ children, ...props }) => (<button type="submit" {...props} className="w-full bg-sky-500 text-white py-2 px-4 rounded-md hover:bg-sky-600 font-semibold transition-colors duration-200 disabled:bg-sky-300">{children}</button>);

const PartnerForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ name: initialData?.name || '', type: initialData?.type || 'Finder', contactName: initialData?.contactName || '', contactEmail: initialData?.contactEmail || '' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); if (initialData) onSubmit('partners', initialData.id, formData); else onSubmit('partners', null, formData); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="name" name="name" label="Nome do Parceiro" value={formData.name} onChange={handleChange} required /><FormSelect id="type" name="type" label="Tipo de Parceiro" value={formData.type} onChange={handleChange} required><option value="Finder">Finder</option><option value="Seller">Seller</option></FormSelect><FormInput id="contactName" name="contactName" label="Nome do Contato" value={formData.contactName} onChange={handleChange} required /><FormInput id="contactEmail" name="contactEmail" label="Email do Contato" type="email" value={formData.contactEmail} onChange={handleChange} required /><FormButton>{initialData ? 'Salvar Alterações' : 'Salvar Parceiro'}</FormButton></form>);
};

const DealForm = ({ onSubmit, partners, initialData }) => {
    const [formData, setFormData] = useState({ clientName: initialData?.clientName || '', partnerId: initialData?.partnerId || '', submissionDate: initialData?.submissionDate?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0], value: initialData?.value || '', status: initialData?.status || 'Pendente' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); const selectedPartner = partners.find(p => p.id === formData.partnerId); const dataToSubmit = { ...formData, value: parseBrazilianCurrency(formData.value), partnerName: selectedPartner ? selectedPartner.name : 'N/A' }; if (initialData) onSubmit('deals', initialData.id, dataToSubmit); else onSubmit('deals', null, dataToSubmit); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="clientName" name="clientName" label="Nome do Cliente Final" value={formData.clientName} onChange={handleChange} required /><FormSelect id="partnerId" name="partnerId" label="Parceiro Responsável" value={formData.partnerId} onChange={handleChange} required><option value="">Selecione um parceiro</option>{partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</FormSelect><FormInput id="submissionDate" name="submissionDate" label="Data da Indicação" type="date" value={formData.submissionDate} onChange={handleChange} required /><FormInput id="value" name="value" label="Valor Estimado (R$)" type="text" value={formData.value} onChange={handleChange} required placeholder="Ex: 1.250,50" /><FormSelect id="status" name="status" label="Status" value={formData.status} onChange={handleChange} required><option>Pendente</option><option>Aprovado</option><option>Ganho</option><option>Perdido</option></FormSelect><FormButton>{initialData ? 'Salvar Alterações' : 'Registrar Oportunidade'}</FormButton></form>);
};

const ResourceForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ title: initialData?.title || '', description: initialData?.description || '', url: initialData?.url || '', category: initialData?.category || 'Marketing' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); if (initialData) onSubmit('resources', initialData.id, formData); else onSubmit('resources', null, formData); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="title" name="title" label="Título do Recurso" value={formData.title} onChange={handleChange} required /><FormTextarea id="description" name="description" label="Descrição" value={formData.description} onChange={handleChange} required /><FormInput id="url" name="url" label="URL do Recurso" type="url" value={formData.url} onChange={handleChange} required /><FormSelect id="category" name="category" label="Categoria" value={formData.category} onChange={handleChange} required><option>Marketing</option><option>Vendas</option><option>Técnico</option><option>Legal</option></FormSelect><FormButton>{initialData ? 'Salvar Alterações' : 'Salvar Recurso'}</FormButton></form>);
};

const NurturingForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ title: initialData?.title || '', content: initialData?.content || '' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); if (initialData) onSubmit('nurturing', initialData.id, formData); else onSubmit('nurturing', null, formData); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="title" name="title" label="Título do Conteúdo" value={formData.title} onChange={handleChange} required /><FormTextarea id="content" name="content" label="Conteúdo/Direcionamento" value={formData.content} onChange={handleChange} required /><FormButton>{initialData ? 'Salvar Alterações' : 'Publicar Conteúdo'}</FormButton></form>);
};

const ImportForm = ({ collectionName, onSubmit, closeModal, partners }) => {
    const [file, setFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState('');
    const [selectedPartnerId, setSelectedPartnerId] = useState('');
    const instructions = { partners: 'A planilha CSV deve conter as colunas: name, type, contactName, contactEmail.', deals: 'A planilha CSV deve conter as colunas: clientName, value, status, submissionDate (formato AAAA-MM-DD). Todas as oportunidades serão associadas ao parceiro selecionado abaixo.', payments: 'A planilha CSV deve conter as colunas: clientName, partnerName, paymentValue, paymentDate (formato AAAA-MM-DD).' };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { setImportStatus('Por favor, selecione um arquivo .csv'); return; }
        if (collectionName === 'deals' && !selectedPartnerId) { setImportStatus('Por favor, selecione um parceiro para associar as oportunidades.'); return; }
        setIsImporting(true); setImportStatus('Importando...');
        try {
            const { successfulImports, failedImports } = await onSubmit(file, collectionName, selectedPartnerId);
            setImportStatus(`${successfulImports} itens importados com sucesso.${failedImports > 0 ? ` ${failedImports} linhas ignoradas.` : ''}`);
            setTimeout(closeModal, 3000);
        } catch (error) { setImportStatus('Ocorreu um erro durante a importação.'); console.error(error); } 
        finally { setIsImporting(false); }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{instructions[collectionName]}</p>
            {collectionName === 'deals' && partners?.length > 0 && (
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">Associar a qual parceiro?</label><select value={selectedPartnerId} onChange={(e) => setSelectedPartnerId(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"><option value="">Selecione um parceiro</option>{partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            )}
            <div><label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-2">Selecione um arquivo .csv</label><input id="csv-upload" type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/></div>
            {importStatus && <p className="text-sm text-center font-medium text-gray-600">{importStatus}</p>}
            <FormButton disabled={isImporting || !file}>{isImporting ? 'Importando...' : 'Iniciar Importação'}</FormButton>
        </form>
    );
};


const ActivityForm = ({ onSubmit, initialData }) => {
    const isEditMode = !!initialData?.id;
    const [formData, setFormData] = useState({ type: initialData?.type || 'Reunião', description: initialData?.description || '' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            onSubmit('activities', initialData.id, { ...formData, partnerId: initialData.partnerId, partnerName: initialData.partnerName });
        } else {
            onSubmit('activities', initialData, formData);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Parceiro: {initialData?.name || initialData?.partnerName}</h3>
            <FormSelect id="type" name="type" label="Tipo de Atividade" value={formData.type} onChange={handleChange} required><option>Reunião</option><option>Ligação</option><option>Email</option><option>Marco</option></FormSelect>
            <FormTextarea id="description" name="description" label="Descrição / Resumo" value={formData.description} onChange={handleChange} required />
            <FormButton>{isEditMode ? 'Salvar Alterações' : 'Adicionar Atividade'}</FormButton>
        </form>
    );
};

const ActivityFeed = ({ activities, onEdit, onDelete }) => {
    const activityIcons = { 'Reunião': Calendar, 'Ligação': Phone, 'Email': Mail, 'Marco': Award };
    const timeSince = (timestamp) => {
        if (!timestamp?.toDate) return 'data inválida';
        const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
        const intervals = { ano: 31536000, mês: 2592000, dia: 86400, hora: 3600, minuto: 60 };
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = seconds / secondsInUnit;
            if (interval > 1) return `há ${Math.floor(interval)} ${unit}${Math.floor(interval) > 1 ? 's' : ''}`;
        }
        return "agora mesmo";
    };
    if (activities.length === 0) return <p className="text-center text-gray-500 text-sm mt-4">Nenhuma atividade registrada.</p>;
    return (
        <div className="space-y-4">
            {activities.map(activity => {
                const Icon = activityIcons[activity.type] || FileText;
                return (
                    <div key={activity.id} className="flex gap-4 group p-2 -mx-2 rounded-md hover:bg-slate-50">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><Icon className="h-5 w-5 text-gray-500" /></div>
                        <div className="flex-grow">
                            <p className="text-sm text-gray-800">{activity.description}</p>
                            <p className="text-xs text-gray-500"><strong>{activity.partnerName}</strong> - {timeSince(activity.createdAt)}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity"><ActionsMenu onEdit={() => onEdit(activity)} onDelete={() => onDelete(activity.id)} /></div>
                    </div>
                );
            })}
        </div>
    );
};

