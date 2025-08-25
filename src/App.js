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
    orderBy
} from 'firebase/firestore';
import { 
    Users, Briefcase, DollarSign, Book, Plus, X, LayoutDashboard, Gem, Trophy, Star,
    Search, Handshake, Lightbulb, Upload, Filter, XCircle, MoreVertical, Edit, Trash2, AlertTriangle,
    BadgePercent, ArrowLeft, User, TrendingUp, Target, Calendar, Phone, Mail, Award, LogOut
} from 'lucide-react';

// --- Logos da Driva (SVG) ---
const DrivaLogoPositiva = () => (
    <svg width="150" height="40" viewBox="0 0 119 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.29 2.142A2.143 2.143 0 0 0 20.428 0H2.143A2.143 2.143 0 0 0 .58 3.57l10.714 17.858a2.143 2.143 0 0 0 3.714 0L25.428 3.57a2.143 2.143 0 0 0-3.138-1.428Z" fill="#002E45"></path>
        <path d="M12.857 21.428.58 3.57A2.143 2.143 0 0 1 2.143 0h18.285c.786 0 1.5.429 1.857 1.143l-9.428 15.714v11.572a1.59 1.59 0 0 1-2.715 1.143l-2-2a1.428 1.428 0 0 1-.429-1V21.43Z" fill="#002E45"></path>
        <path d="m14.571 25.5-2.571-2.571a2.143 2.143 0 0 0-3.001 0l-2.571 2.571a2.143 2.143 0 0 0 0 3.001l2.571 2.571a2.143 2.143 0 0 0 3.001 0l2.571-2.571a2.143 2.143 0 0 0 0-3.001Z" fill="#F18835"></path>
        <path d="M41.88 11.05V31h-5.4V11.05h-6.7V6.5h18.8v4.55h-6.7ZM58.765 31h-5.53l-3.34-8.13h-7.9v8.13h-5.4V6.5h11.95c4.97 0 8.05 2.59 8.05 6.86 0 3.08-1.68 5.25-4.2 6.3l4.41 11.34Zm-11.25-12.6h-2.1V11h2.1c2.1 0 3.22.84 3.22 2.73s-1.12 2.67-3.22 2.67ZM74.79 31h-5.4V6.5h5.4V31ZM91.43 31l-6.3-13.48L78.83 31h-5.81l8.82-17.64V6.5h5.4v6.86L97.24 31h-5.81ZM108.06 6.5v24.5h-5.4V6.5h5.4ZM118.15 18.92c0-7.7-4.48-12.42-11.48-12.42-7 0-11.48 4.72-11.48 12.42s4.48 12.43 11.48 12.43c7 0 11.48-4.73 11.48-12.43Zm-5.4 0c0 4.9-2.52 7.88-6.08 7.88s-6.09-2.98-6.09-7.88 2.52-7.87 6.09-7.87 6.08 2.97 6.08 7.87Z" fill="#002E45"></path>
    </svg>
);
const DrivaLogoNegativa = () => (
    <svg width="150" height="40" viewBox="0 0 119 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.29 2.142A2.143 2.143 0 0 0 20.428 0H2.143A2.143 2.143 0 0 0 .58 3.57l10.714 17.858a2.143 2.143 0 0 0 3.714 0L25.428 3.57a2.143 2.143 0 0 0-3.138-1.428Z" fill="#FFFFFF"></path>
        <path d="M12.857 21.428.58 3.57A2.143 2.143 0 0 1 2.143 0h18.285c.786 0 1.5.429 1.857 1.143l-9.428 15.714v11.572a1.59 1.59 0 0 1-2.715 1.143l-2-2a1.428 1.428 0 0 1-.429-1V21.43Z" fill="#FFFFFF"></path>
        <path d="m14.571 25.5-2.571-2.571a2.143 2.143 0 0 0-3.001 0l-2.571 2.571a2.143 2.143 0 0 0 0 3.001l2.571 2.571a2.143 2.143 0 0 0 3.001 0l2.571-2.571a2.143 2.143 0 0 0 0-3.001Z" fill="#F18835"></path>
        <path d="M41.88 11.05V31h-5.4V11.05h-6.7V6.5h18.8v4.55h-6.7ZM58.765 31h-5.53l-3.34-8.13h-7.9v8.13h-5.4V6.5h11.95c4.97 0 8.05 2.59 8.05 6.86 0 3.08-1.68 5.25-4.2 6.3l4.41 11.34Zm-11.25-12.6h-2.1V11h2.1c2.1 0 3.22.84 3.22 2.73s-1.12 2.67-3.22 2.67ZM74.79 31h-5.4V6.5h5.4V31ZM91.43 31l-6.3-13.48L78.83 31h-5.81l8.82-17.64V6.5h5.4v6.86L97.24 31h-5.81ZM108.06 6.5v24.5h-5.4V6.5h5.4ZM118.15 18.92c0-7.7-4.48-12.42-11.48-12.42-7 0-11.48 4.72-11.48 12.42s4.48 12.43 11.48 12.43c7 0 11.48-4.73 11.48-12.43Zm-5.4 0c0 4.9-2.52 7.88-6.08 7.88s-6.09-2.98-6.09-7.88 2.52-7.87 6.09-7.87 6.08 2.97 6.08 7.87Z" fill="#FFFFFF"></path>
    </svg>
);

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
const parseBrazilianCurrency = (value) => {
    if (typeof value !== 'string') return parseFloat(value) || 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
};

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
const getPartnerDetails = (paymentsReceived, type) => {
    const thresholds = TIER_THRESHOLDS[type];
    if (paymentsReceived >= thresholds.DIAMANTE) return { ...TIER_CONFIG.DIAMANTE, commissionRate: TIER_CONFIG.DIAMANTE.commission[type] };
    if (paymentsReceived >= thresholds.OURO) return { ...TIER_CONFIG.OURO, commissionRate: TIER_CONFIG.OURO.commission[type] };
    if (paymentsReceived >= TIER_THRESHOLDS.PRATA_MIN) return { ...TIER_CONFIG.PRATA, commissionRate: TIER_CONFIG.PRATA.commission[type] };
    return { name: 'N/A', icon: Users, color: 'text-slate-400', bgColor: 'bg-slate-100', commissionRate: 0 };
};

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
                    <DrivaLogoPositiva />
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


// --- Componente Principal do App ---
function PrmApp({ auth }) {
    const [db, setDb] = useState(null);
    const [partners, setPartners] = useState([]);
    const [deals, setDeals] = useState([]);
    const [payments, setPayments] = useState([]);
    const [resources, setResources] = useState([]);
    const [nurturingContent, setNurturingContent] = useState([]);
    const [activities, setActivities] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [bulkDeleteConfig, setBulkDeleteConfig] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedDeals, setSelectedDeals] = useState([]);
    const [selectedPayments, setSelectedPayments] = useState([]);

    useEffect(() => {
        if (auth) {
            setDb(getFirestore(auth.app));
        }
    }, [auth]);

    // --- Efeito para Carregar Dados do Firestore ---
    useEffect(() => {
        if (!db) return;
        const collections = { partners: setPartners, deals: setDeals, resources: setResources, nurturing: setNurturingContent, payments: setPayments, activities: setActivities };
        const unsubscribers = Object.entries(collections).map(([col, setter]) => {
            const q = query(collection(db, `artifacts/${appId}/public/data/${col}`), orderBy('createdAt', 'desc'));
            return onSnapshot(q, (snapshot) => setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), (error) => console.error(`Erro ao carregar ${col}:`, error));
        });
        return () => unsubscribers.forEach(unsub => unsub());
    }, [db]);

    // --- Lógica de Filtragem por Data ---
    const filteredDeals = useMemo(() => {
        if (!startDate && !endDate) return deals;
        const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
        return deals.filter(deal => { const dealDate = deal.submissionDate?.toDate(); return dealDate && (!start || dealDate >= start) && (!end || dealDate <= end); });
    }, [deals, startDate, endDate]);
    
    const filteredPayments = useMemo(() => {
        if (!startDate && !endDate) return payments;
        const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
        return payments.filter(payment => { const paymentDate = payment.paymentDate?.toDate(); return paymentDate && (!start || paymentDate >= start) && (!end || paymentDate <= end); });
    }, [payments, startDate, endDate]);

    // --- Cálculo de Dados Derivados ---
    const partnersWithDetails = useMemo(() => {
        const paymentsByPartner = filteredPayments.reduce((acc, p) => { acc[p.partnerId] = (acc[p.partnerId] || 0) + (parseBrazilianCurrency(p.paymentValue) || 0); return acc; }, {});
        const dealsByPartner = filteredDeals.reduce((acc, d) => { if (!acc[d.partnerId]) acc[d.partnerId] = []; acc[d.partnerId].push(d); return acc; }, {});
        return partners.map(partner => {
            const paymentsReceived = paymentsByPartner[partner.id] || 0;
            const partnerDeals = dealsByPartner[partner.id] || [];
            const generatedRevenue = partnerDeals.filter(d => d.status === 'Ganho').reduce((sum, d) => sum + (parseBrazilianCurrency(d.value) || 0), 0);
            const totalOpportunitiesValue = partnerDeals.reduce((sum, d) => sum + (parseBrazilianCurrency(d.value) || 0), 0);
            const wonDealsCount = partnerDeals.filter(d => d.status === 'Ganho').length;
            const conversionRate = partnerDeals.length > 0 ? (wonDealsCount / partnerDeals.length) * 100 : 0;
            const type = partner.type || 'FINDER';
            const tierDetails = getPartnerDetails(paymentsReceived, type);
            const commissionToPay = paymentsReceived * (tierDetails.commissionRate / 100);
            return { ...partner, paymentsReceived, tier: tierDetails, totalOpportunitiesValue, conversionRate, commissionToPay, generatedRevenue };
        });
    }, [partners, filteredDeals, filteredPayments]);

    // --- Funções de CRUD ---
    const openModal = (type, data = null) => { setModalType(type); setItemToEdit(data); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setModalType(''); setItemToEdit(null); };
    const handleAdd = async (collectionName, data) => { if (!db) return; try { const path = `artifacts/${appId}/public/data/${collectionName}`; const dataWithTs = { ...data, createdAt: serverTimestamp() }; if (collectionName === 'deals' && data.submissionDate) dataWithTs.submissionDate = Timestamp.fromDate(new Date(data.submissionDate)); await addDoc(collection(db, path), dataWithTs); closeModal(); } catch (e) { console.error("Erro ao adicionar:", e); } };
    const handleUpdate = async (collectionName, id, data) => { if (!db) return; try { const docRef = doc(db, `artifacts/${appId}/public/data/${collectionName}`, id); const dataToUpdate = {...data}; if (collectionName === 'deals' && data.submissionDate) dataToUpdate.submissionDate = Timestamp.fromDate(new Date(data.submissionDate)); await updateDoc(docRef, dataToUpdate); closeModal(); } catch (e) { console.error("Erro ao atualizar:", e); } };
    const handleDelete = (collectionName, id) => setItemToDelete({ collectionName, id });
    const confirmDelete = async () => { if (!db || !itemToDelete) return; try { await deleteDoc(doc(db, `artifacts/${appId}/public/data/${itemToDelete.collectionName}`, itemToDelete.id)); setItemToDelete(null); } catch (e) { console.error("Erro ao excluir:", e); } };
    const handleBulkDelete = (collectionName, ids) => { if(ids.length > 0) setBulkDeleteConfig({ collectionName, ids, title: `Excluir ${ids.length} itens?`, message: `Tem a certeza de que deseja excluir os ${ids.length} itens selecionados?` }); };
    const confirmBulkDelete = async () => { if (!db || !bulkDeleteConfig) return; try { const { collectionName, ids } = bulkDeleteConfig; const batch = writeBatch(db); ids.forEach(id => batch.delete(doc(db, `artifacts/${appId}/public/data/${collectionName}`, id))); await batch.commit(); if (collectionName === 'deals') setSelectedDeals([]); if (collectionName === 'payments') setSelectedPayments([]); setBulkDeleteConfig(null); } catch (e) { console.error("Erro ao excluir em massa:", e); } };
    const handleImport = async (file, collectionName) => { if (!file || !db) return; const partnersMap = new Map(partners.map(p => [p.name.toLowerCase(), p.id])); return new Promise((resolve, reject) => { window.Papa.parse(file, { header: true, skipEmptyLines: true, complete: async (res) => { const batch = writeBatch(db); const colRef = collection(db, `artifacts/${appId}/public/data/${collectionName}`); let s = 0, f = 0; res.data.forEach(item => { const pId = partnersMap.get(item.partnerName?.toLowerCase()); if (pId) { const newDoc = doc(colRef); let data = { partnerId: pId, partnerName: item.partnerName, createdAt: serverTimestamp() }; if (collectionName === 'payments') { data.clientName = item.clientName; data.paymentValue = parseBrazilianCurrency(item.paymentValue); data.paymentDate = Timestamp.fromDate(new Date(item.paymentDate.split(' ')[0])); } batch.set(newDoc, data); s++; } else { f++; } }); try { await batch.commit(); resolve({ successfulImports: s, failedImports: f }); } catch (e) { reject(e); } }, error: (e) => reject(e) }); }); };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar auth={auth} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <Header openModal={openModal} startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} selectedDealsCount={selectedDeals.length} onBulkDeleteDeals={() => handleBulkDelete('deals', selectedDeals)} selectedPaymentsCount={selectedPayments.length} onBulkDeletePayments={() => handleBulkDelete('payments', selectedPayments)}/>
                <div className="mt-6">
                    <Routes>
                        <Route path="/" element={<Dashboard partners={partnersWithDetails} deals={filteredDeals} recentActivities={activities.slice(0, 5)} onEdit={(activity) => openModal('activity', activity)} onDelete={(id) => handleDelete('activities', id)} />} />
                        <Route path="/partners" element={<PartnerList partners={partnersWithDetails} onEdit={(p) => openModal('partner', p)} onDelete={(id) => handleDelete('partners', id)} />} />
                        <Route path="/partners/:partnerId" element={<PartnerDetail allPartners={partnersWithDetails} allActivities={activities} openModal={openModal} onDelete={(id) => handleDelete('activities', id)} />} />
                        <Route path="/deals" element={<DealList deals={filteredDeals} onEdit={(d) => openModal('deal', d)} onDelete={(id) => handleDelete('deals', id)} selectedDeals={selectedDeals} setSelectedDeals={setSelectedDeals} />} />
                        <Route path="/commissioning" element={<CommissioningList payments={filteredPayments} onImport={(file) => handleImport(file, 'payments')} selectedPayments={selectedPayments} setSelectedPayments={setSelectedPayments} />} />
                        <Route path="/resources" element={<ResourceHub resources={resources} onEdit={(r) => openModal('resource', r)} onDelete={(id) => handleDelete('resources', id)} />} />
                        <Route path="/nurturing" element={<NurturingHub nurturingContent={nurturingContent} onEdit={(i) => openModal('nurturing', i)} onDelete={(id) => handleDelete('nurturing', id)} />} />
                    </Routes>
                </div>
            </main>
            {isModalOpen && <Modal closeModal={closeModal} modalType={modalType} handleAdd={handleAdd} handleUpdate={handleUpdate} handleImport={(file) => handleImport(file, 'payments')} partners={partners} initialData={itemToEdit} />}
            {itemToDelete && <ConfirmationModal onConfirm={confirmDelete} onCancel={() => setItemToDelete(null)} />}
            {bulkDeleteConfig && <ConfirmationModal onConfirm={confirmBulkDelete} onCancel={() => setBulkDeleteConfig(null)} title={bulkDeleteConfig.title} message={bulkDeleteConfig.message} />}
        </div>
    );
}

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
            if(firebaseConfig.apiKey) {
                const app = initializeApp(firebaseConfig);
                const authInstance = getAuth(app);
                setAuth(authInstance);
                const unsubscribe = onAuthStateChanged(authInstance, (user) => {
                    setUser(user);
                    setLoading(false);
                });
                return () => { unsubscribe(); if (document.head.contains(script)) document.head.removeChild(script); };
            } else { setLoading(false); }
        } catch (error) { console.error("Erro na inicialização:", error); setLoading(false); }
    }, []);

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-700">A carregar...</div></div>;
    if (!firebaseConfig.apiKey) return <div className="flex items-center justify-center h-screen bg-red-50 text-red-800 p-8"><div className="text-center"><h2 className="text-2xl font-bold mb-4">Erro de Configuração</h2><p>As chaves do Firebase não foram encontradas.</p></div></div>;

    return user ? <PrmApp auth={auth} /> : <LoginPage auth={auth} />;
}

// --- Componentes de UI ---
const Sidebar = ({ auth }) => {
    const location = useLocation();
    const handleLogout = () => signOut(auth);
    const navItems = [ { path: '/', label: 'Dashboard', icon: LayoutDashboard }, { path: '/partners', label: 'Parceiros', icon: Users }, { path: '/deals', label: 'Oportunidades', icon: Briefcase }, { path: '/commissioning', label: 'Comissionamento', icon: BadgePercent }, { path: '/resources', label: 'Recursos', icon: Book }, { path: '/nurturing', label: 'Nutrição', icon: Lightbulb }, ];
    return ( <aside className="w-16 sm:w-64 bg-slate-800 text-white flex flex-col"><div className="h-16 flex items-center justify-center sm:justify-start sm:px-4 border-b border-slate-700"><DrivaLogoNegativa /></div><nav className="flex-1 mt-6"><ul>{navItems.map(item => (<li key={item.path} className="px-3 sm:px-6 py-1"><Link to={item.path} className={`w-full flex items-center p-2 rounded-md transition-colors duration-200 ${location.pathname.startsWith(item.path) && item.path !== '/' || location.pathname === item.path ? 'bg-sky-500 text-white' : 'hover:bg-slate-700'}`}><item.icon className="h-5 w-5" /><span className="hidden sm:inline ml-4 font-medium">{item.label}</span></Link></li>))}</ul></nav><div className="p-4 border-t border-slate-700"><button onClick={handleLogout} className="w-full flex items-center p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"><LogOut className="h-5 w-5" /><span className="hidden sm:inline ml-4 font-medium">Sair</span></button></div></aside> );
};

const Header = ({ openModal, startDate, endDate, setStartDate, setEndDate, selectedDealsCount, onBulkDeleteDeals, selectedPaymentsCount, onBulkDeletePayments }) => {
    const location = useLocation();
    const isDetailView = location.pathname.includes('/partners/');
    const viewTitles = { '/': 'Dashboard de Canais', '/partners': 'Gestão de Parceiros', '/deals': 'Registro de Oportunidades', '/commissioning': 'Cálculo de Comissionamento', '/resources': 'Central de Recursos', '/nurturing': 'Nutrição de Parceiros', detail: 'Detalhes do Parceiro' };
    const currentTitle = isDetailView ? viewTitles.detail : viewTitles[location.pathname];
    const buttonInfo = { '/partners': { label: 'Novo Parceiro', action: () => openModal('partner') }, '/deals': { label: 'Registrar Oportunidade', action: () => openModal('deal') }, '/resources': { label: 'Novo Recurso', action: () => openModal('resource') }, '/nurturing': { label: 'Novo Conteúdo', action: () => openModal('nurturing') }, };
    const showFilters = ['/', '/partners', '/deals', '/commissioning'].includes(location.pathname) || isDetailView;
    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{currentTitle}</h1>
                <div className="flex items-center gap-2">
                    {location.pathname === '/deals' && selectedDealsCount > 0 && (<button onClick={onBulkDeleteDeals} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-red-700"><Trash2 className="h-5 w-5 mr-2" /><span className="font-semibold">Excluir ({selectedDealsCount})</span></button>)}
                    {location.pathname === '/commissioning' && selectedPaymentsCount > 0 && (<button onClick={onBulkDeletePayments} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-red-700"><Trash2 className="h-5 w-5 mr-2" /><span className="font-semibold">Excluir ({selectedPaymentsCount})</span></button>)}
                    {location.pathname === '/commissioning' && (<button onClick={() => openModal('importPayments')} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-600"><Upload className="h-5 w-5 mr-2" /><span className="font-semibold">Importar Pagamentos</span></button>)}
                    {buttonInfo[location.pathname] && (<button onClick={() => buttonInfo[location.pathname].action()} className="flex items-center bg-sky-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-sky-600"><Plus className="h-5 w-5 mr-2" /><span className="font-semibold">{buttonInfo[location.pathname].label}</span></button>)}
                </div>
            </div>
            {showFilters && (
                <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-center gap-4">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <div className="flex items-center gap-2"><label htmlFor="start-date" className="text-sm font-medium text-gray-700">De:</label><input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md shadow-sm" /></div>
                    <div className="flex items-center gap-2"><label htmlFor="end-date" className="text-sm font-medium text-gray-700">Até:</label><input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md shadow-sm" /></div>
                    {(startDate || endDate) && (<button onClick={() => {setStartDate(''); setEndDate('');}} className="flex items-center text-sm text-gray-600 hover:text-red-600"><XCircle className="h-4 w-4 mr-1" />Limpar Filtro</button>)}
                </div>
            )}
        </div>
    );
};

const Dashboard = ({ partners, deals, recentActivities, onEdit, onDelete }) => {
    const { totalPayments, totalGeneratedRevenue } = useMemo(() => {
        const totalPayments = partners.reduce((sum, p) => sum + p.paymentsReceived, 0);
        const totalGeneratedRevenue = partners.reduce((sum, p) => sum + p.generatedRevenue, 0);
        return { totalPayments, totalGeneratedRevenue };
    }, [partners]);
    const stats = [ { title: 'Total de Parceiros', value: partners.length, icon: Users, color: 'text-blue-500' }, { title: 'Oportunidades no Período', value: deals.length, icon: Briefcase, color: 'text-orange-500' }, { title: 'Receita Gerada (Ganhos)', value: `R$ ${totalGeneratedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Target, color: 'text-indigo-500' }, { title: 'Pagamentos Recebidos', value: `R$ ${totalPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-green-500' }, ];
    return ( 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{stats.map(stat => (<div key={stat.title} className="bg-white p-6 rounded-xl shadow-md flex items-center"><div className={`p-3 rounded-full bg-opacity-20 ${stat.color.replace('text-', 'bg-')}`}><stat.icon className={`h-8 w-8 ${stat.color}`} /></div><div className="ml-4"><p className="text-gray-500">{stat.title}</p><p className="text-2xl font-bold text-slate-800">{stat.value}</p></div></div>))}</div>
                <div className="mt-6"><h2 className="text-xl font-bold text-slate-700 mb-4">Oportunidades Recentes no Período</h2><div className="bg-white p-4 rounded-xl shadow-md"><DealList deals={deals.slice(0, 5)} isMini={true} selectedDeals={[]} setSelectedDeals={() => {}}/></div></div>
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center"><TrendingUp className="mr-2"/>Atividades Recentes</h2>
                <ActivityFeed activities={recentActivities} onEdit={onEdit} onDelete={onDelete} />
            </div>
        </div> 
    );
};

const PartnerList = ({ partners, onEdit, onDelete }) => {
    const navigate = useNavigate();
    return (
    <div className="bg-white rounded-xl shadow-md">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4 font-semibold text-slate-600">Nome do Parceiro</th><th className="p-4 font-semibold text-slate-600">Tipo</th><th className="p-4 font-semibold text-slate-600">Nível</th><th className="p-4 font-semibold text-slate-600">Pagamentos Recebidos</th><th className="p-4 font-semibold text-slate-600">Receita Gerada (Ganhos)</th><th className="p-4 font-semibold text-slate-600">Comissão a Pagar</th><th className="p-4 font-semibold text-slate-600">Ações</th></tr></thead>
            <tbody>
                {partners.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/partners/${p.id}`)}>
                        <td className="p-4 text-slate-800 font-medium">{p.name}</td>
                        <td className="p-4 text-slate-600">{p.type}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center w-fit ${p.tier.bgColor} ${p.tier.color}`}><p.tier.icon className="h-4 w-4 mr-2" />{p.tier.name}</span></td>
                        <td className="p-4 text-slate-600 font-medium">R$ {p.paymentsReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-slate-600 font-medium">R$ {p.generatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-green-600 font-bold">R$ {p.commissionToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 relative" onClick={(e) => e.stopPropagation()}><ActionsMenu onEdit={() => onEdit(p)} onDelete={() => onDelete(p.id)} /></td>
                    </tr>
                ))}
            </tbody>
        </table>
         {partners.length === 0 && <p className="p-4 text-center text-gray-500">Nenhum parceiro registrado.</p>}
    </div>
)};

const PartnerDetail = ({ allPartners, allActivities, openModal, onDelete }) => {
    const { partnerId } = useParams();
    const partner = allPartners.find(p => p.id === partnerId);
    const partnerActivities = useMemo(() => allActivities.filter(a => a.partnerId === partnerId), [allActivities, partnerId]);
    if (!partner) return <div className="text-center text-gray-500">Parceiro não encontrado.</div>;
    return (
        <div>
            <Link to="/partners" className="flex items-center text-sky-600 hover:underline mb-6 font-semibold"><ArrowLeft size={18} className="mr-2" />Voltar para a lista de parceiros</Link>
            <div className="bg-white p-6 rounded-xl shadow-md mb-6"><div className="flex items-center"><div className={`p-3 rounded-full ${partner.tier.bgColor}`}><partner.tier.icon className={`h-10 w-10 ${partner.tier.color}`} /></div><div className="ml-4"><h2 className="text-3xl font-bold text-slate-800">{partner.name}</h2><p className="text-gray-500">{partner.type}</p></div></div></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md"><h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center"><User size={20} className="mr-2 text-sky-500" />Informações de Contato</h3><div className="space-y-2"><p className="text-gray-700"><strong>Nome:</strong> {partner.contactName}</p><p className="text-gray-700"><strong>Email:</strong> {partner.contactEmail}</p></div></div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md"><h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center"><TrendingUp size={20} className="mr-2 text-sky-500" />Métricas (no período)</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <div><p className="text-sm text-gray-500">Pagamentos Recebidos</p><p className="text-2xl font-bold text-green-600">R$ {partner.paymentsReceived.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                        <div><p className="text-sm text-gray-500">Comissão a Pagar</p><p className="text-2xl font-bold text-green-600">R$ {partner.commissionToPay.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                        <div><p className="text-sm text-gray-500">Receita Gerada (Ganhos)</p><p className="text-2xl font-bold text-slate-800">R$ {partner.generatedRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                        <div><p className="text-sm text-gray-500">Oportunidades Geradas</p><p className="text-2xl font-bold text-slate-800">R$ {partner.totalOpportunitiesValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                        <div><p className="text-sm text-gray-500">Taxa de Conversão</p><p className="text-2xl font-bold text-slate-800">{partner.conversionRate.toFixed(1)}%</p></div>
                    </div>
                </div>
            </div>
            <div className="mt-6 bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-700">Histórico de Atividades</h3>
                    <button onClick={() => openModal('activity', partner)} className="flex items-center bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-sky-200"><Plus size={16} className="mr-2"/>Adicionar Atividade</button>
                </div>
                <ActivityFeed activities={partnerActivities} onEdit={(activity) => openModal('activity', activity)} onDelete={(id) => onDelete('activities', id)} />
            </div>
        </div>
    );
};

const DealList = ({ deals, onEdit, onDelete, selectedDeals, setSelectedDeals, isMini = false }) => {
    const statusColors = { 'Pendente': 'bg-yellow-100 text-yellow-800', 'Aprovado': 'bg-blue-100 text-blue-800', 'Ganho': 'bg-green-100 text-green-800', 'Perdido': 'bg-red-100 text-red-800' };
    const handleSelectAll = (e) => setSelectedDeals(e.target.checked ? deals.map(d => d.id) : []);
    const handleSelectOne = (e, id) => setSelectedDeals(e.target.checked ? [...selectedDeals, id] : selectedDeals.filter(dealId => dealId !== id));
    return (
        <div className={!isMini ? "bg-white rounded-xl shadow-md" : ""}>
            <table className="w-full text-left">
                <thead className={!isMini ? "bg-slate-50 border-b border-slate-200" : ""}>
                    <tr>
                        {!isMini && <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={deals.length > 0 && selectedDeals.length === deals.length} className="rounded" /></th>}
                        {!isMini && <th className="p-4 font-semibold text-slate-600">Data</th>}
                        <th className="p-4 font-semibold text-slate-600">Cliente Final</th>
                        <th className="p-4 font-semibold text-slate-600">Parceiro</th>
                        <th className="p-4 font-semibold text-slate-600">Valor</th>
                        <th className="p-4 font-semibold text-slate-600">Status</th>
                        {!isMini && <th className="p-4 font-semibold text-slate-600">Ações</th>}
                    </tr>
                </thead>
                <tbody>
                    {deals.map(d => (<tr key={d.id} className={`border-b border-slate-100 ${selectedDeals.includes(d.id) ? 'bg-sky-50' : 'hover:bg-slate-50'}`}>
                        {!isMini && <td className="p-4"><input type="checkbox" checked={selectedDeals.includes(d.id)} onChange={(e) => handleSelectOne(e, d.id)} className="rounded" /></td>}
                        {!isMini && <td className="p-4 text-slate-600">{d.submissionDate?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</td>}
                        <td className="p-4 text-slate-800 font-medium">{d.clientName}</td>
                        <td className="p-4 text-slate-600">{d.partnerName}</td>
                        <td className="p-4 text-slate-600">R$ {parseBrazilianCurrency(d.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-sm font-semibold ${statusColors[d.status] || 'bg-gray-100'}`}>{d.status}</span></td>
                        {!isMini && <td className="p-4 relative"><ActionsMenu onEdit={() => onEdit(d)} onDelete={() => onDelete(d.id)} /></td>}
                    </tr>))}
                </tbody>
            </table>
            {deals.length === 0 && <p className="p-4 text-center text-gray-500">Nenhuma oportunidade encontrada.</p>}
        </div>
    );
};

const CommissioningList = ({ payments, selectedPayments, setSelectedPayments }) => {
    const handleSelectAll = (e) => setSelectedPayments(e.target.checked ? payments.map(p => p.id) : []);
    const handleSelectOne = (e, id) => setSelectedPayments(e.target.checked ? [...selectedPayments, id] : selectedPayments.filter(pId => pId !== id));
    return (
        <div className="bg-white rounded-xl shadow-md">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={payments.length > 0 && selectedPayments.length === payments.length} className="rounded" /></th><th className="p-4 font-semibold text-slate-600">Data do Pagamento</th><th className="p-4 font-semibold text-slate-600">Cliente Final</th><th className="p-4 font-semibold text-slate-600">Parceiro</th><th className="p-4 font-semibold text-slate-600">Valor Pago</th></tr></thead>
                <tbody>{payments.map(p => (<tr key={p.id} className={`border-b border-slate-100 ${selectedPayments.includes(p.id) ? 'bg-sky-50' : 'hover:bg-slate-50'}`}><td className="p-4"><input type="checkbox" checked={selectedPayments.includes(p.id)} onChange={(e) => handleSelectOne(e, p.id)} className="rounded" /></td><td className="p-4 text-slate-600">{p.paymentDate?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</td><td className="p-4 text-slate-800 font-medium">{p.clientName}</td><td className="p-4 text-slate-600">{p.partnerName}</td><td className="p-4 text-slate-600 font-medium">R$ {parseBrazilianCurrency(p.paymentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>))}{payments.length === 0 && <tr><td colSpan="5"><p className="p-4 text-center text-gray-500">Nenhum pagamento encontrado.</p></td></tr>}</tbody>
            </table>
        </div>
    );
};

const ResourceHub = ({ resources, onEdit, onDelete }) => ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{resources.map(r => (<div key={r.id} className="bg-white p-6 rounded-xl shadow-md flex flex-col relative"><div className="absolute top-2 right-2"><ActionsMenu onEdit={() => onEdit(r)} onDelete={() => onDelete(r.id)} /></div><h3 className="text-lg font-bold text-slate-800 pr-8">{r.title}</h3><p className="text-slate-600 mt-2 flex-grow">{r.description}</p><div className="mt-4 flex justify-between items-center"><span className="text-sm font-semibold bg-sky-100 text-sky-800 px-2 py-1 rounded-full">{r.category}</span><a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sky-500 hover:text-sky-600">Aceder</a></div></div>))}{resources.length === 0 && <p className="p-4 text-center text-gray-500 col-span-full">Nenhum recurso disponível.</p>}</div>);
const NurturingHub = ({ nurturingContent, onEdit, onDelete }) => ( <div className="space-y-6">{nurturingContent.map(item => (<div key={item.id} className="bg-white p-6 rounded-xl shadow-md relative"><div className="absolute top-2 right-2"><ActionsMenu onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} /></div><h3 className="text-lg font-bold text-slate-800 pr-8">{item.title}</h3><p className="text-sm text-gray-500 mt-1">{item.createdAt?.toDate().toLocaleDateString('pt-BR') || ''}</p><p className="text-slate-600 mt-4 whitespace-pre-wrap">{item.content}</p></div>))}{nurturingContent.length === 0 && <p className="p-4 text-center text-gray-500">Nenhum conteúdo de nutrição publicado.</p>}</div>);

// --- Componentes Genéricos ---
const ActionsMenu = ({ onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => { const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
    return (<div className="relative" ref={menuRef}><button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-200"><MoreVertical size={18} /></button>{isOpen && (<div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border"><button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"><Edit size={16} className="mr-2" /> Editar</button><button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"><Trash2 size={16} className="mr-2" /> Excluir</button></div>)}</div>);
};
const ConfirmationModal = ({ onConfirm, onCancel, title = "Confirmar Exclusão", message = "Tem a certeza de que deseja excluir este item? Esta ação não pode ser desfeita." }) => (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center"><div className="mx-auto bg-red-100 rounded-full h-12 w-12 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-medium text-gray-900 mt-4">{title}</h3><p className="text-sm text-gray-500 mt-2">{message}</p><div className="mt-6 flex justify-center gap-4"><button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-semibold">Cancelar</button><button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">Confirmar Exclusão</button></div></div></div>);

const Modal = ({ closeModal, modalType, handleAdd, handleUpdate, handleImport, partners, initialData }) => {
    const isEditMode = !!initialData;
    const renderForm = () => {
        switch (modalType) {
            case 'partner': return <PartnerForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={initialData} />;
            case 'deal': return <DealForm onSubmit={isEditMode ? handleUpdate : handleAdd} partners={partners} initialData={initialData} />;
            case 'resource': return <ResourceForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={initialData} />;
            case 'nurturing': return <NurturingForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={initialData} />;
            case 'activity': return <ActivityForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={initialData} />;
            case 'importPayments': return <ImportPaymentsForm onSubmit={handleImport} closeModal={closeModal} />;
            default: return null;
        }
    };
    const titles = { partner: isEditMode ? 'Editar Parceiro' : 'Adicionar Parceiro', deal: isEditMode ? 'Editar Oportunidade' : 'Registrar Oportunidade', resource: isEditMode ? 'Editar Recurso' : 'Adicionar Recurso', nurturing: isEditMode ? 'Editar Conteúdo' : 'Adicionar Conteúdo', activity: isEditMode ? 'Editar Atividade' : 'Adicionar Atividade', importPayments: 'Importar Planilha de Pagamentos' };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-lg"><div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-slate-800">{titles[modalType]}</h2><button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button></div><div className="p-6">{renderForm()}</div></div></div>);
};

// --- Formulários ---
const FormInput = ({ id, label, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>);
const FormSelect = ({ id, label, children, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><select id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">{children}</select></div>);
const FormTextarea = ({ id, label, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><textarea id={id} {...props} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>);
const FormButton = ({ children, ...props }) => (<button type="submit" {...props} className="w-full bg-sky-500 text-white py-2 px-4 rounded-md hover:bg-sky-600 font-semibold transition-colors duration-200 disabled:bg-sky-300">{children}</button>);

const PartnerForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ name: initialData?.name || '', type: initialData?.type || 'FINDER', contactName: initialData?.contactName || '', contactEmail: initialData?.contactEmail || '' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); if (initialData) onSubmit('partners', initialData.id, formData); else onSubmit('partners', formData); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="name" name="name" label="Nome do Parceiro" value={formData.name} onChange={handleChange} required /><FormSelect id="type" name="type" label="Tipo de Parceiro" value={formData.type} onChange={handleChange} required><option value="FINDER">Finder</option><option value="SELLER">Seller</option></FormSelect><FormInput id="contactName" name="contactName" label="Nome do Contato" value={formData.contactName} onChange={handleChange} required /><FormInput id="contactEmail" name="contactEmail" label="Email do Contato" type="email" value={formData.contactEmail} onChange={handleChange} required /><FormButton>{initialData ? 'Salvar Alterações' : 'Salvar Parceiro'}</FormButton></form>);
};

const DealForm = ({ onSubmit, partners, initialData }) => {
    const [formData, setFormData] = useState({ clientName: initialData?.clientName || '', partnerId: initialData?.partnerId || '', submissionDate: initialData?.submissionDate?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0], value: initialData?.value || '', status: initialData?.status || 'Pendente' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); const selectedPartner = partners.find(p => p.id === formData.partnerId); const dataToSubmit = { ...formData, partnerName: selectedPartner ? selectedPartner.name : 'N/A' }; if (initialData) onSubmit('deals', initialData.id, dataToSubmit); else onSubmit('deals', dataToSubmit); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="clientName" name="clientName" label="Nome do Cliente Final" value={formData.clientName} onChange={handleChange} required /><FormSelect id="partnerId" name="partnerId" label="Parceiro Responsável" value={formData.partnerId} onChange={handleChange} required><option value="">Selecione um parceiro</option>{partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</FormSelect><FormInput id="submissionDate" name="submissionDate" label="Data da Indicação" type="date" value={formData.submissionDate} onChange={handleChange} required /><FormInput id="value" name="value" label="Valor Estimado (R$)" type="text" value={formData.value} onChange={handleChange} required /><FormSelect id="status" name="status" label="Status" value={formData.status} onChange={handleChange} required><option>Pendente</option><option>Aprovado</option><option>Ganho</option><option>Perdido</option></FormSelect><FormButton>{initialData ? 'Salvar Alterações' : 'Registrar Oportunidade'}</FormButton></form>);
};

const ResourceForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ title: initialData?.title || '', description: initialData?.description || '', url: initialData?.url || '', category: initialData?.category || 'Marketing' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); if (initialData) onSubmit('resources', initialData.id, formData); else onSubmit('resources', formData); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="title" name="title" label="Título do Recurso" value={formData.title} onChange={handleChange} required /><FormTextarea id="description" name="description" label="Descrição" value={formData.description} onChange={handleChange} required /><FormInput id="url" name="url" label="URL do Recurso" type="url" value={formData.url} onChange={handleChange} required /><FormSelect id="category" name="category" label="Categoria" value={formData.category} onChange={handleChange} required><option>Marketing</option><option>Vendas</option><option>Técnico</option><option>Legal</option></FormSelect><FormButton>{initialData ? 'Salvar Alterações' : 'Salvar Recurso'}</FormButton></form>);
};

const NurturingForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ title: initialData?.title || '', content: initialData?.content || '' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); if (initialData) onSubmit('nurturing', initialData.id, formData); else onSubmit('nurturing', formData); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="title" name="title" label="Título do Conteúdo" value={formData.title} onChange={handleChange} required /><FormTextarea id="content" name="content" label="Conteúdo/Direcionamento" value={formData.content} onChange={handleChange} required /><FormButton>{initialData ? 'Salvar Alterações' : 'Publicar Conteúdo'}</FormButton></form>);
};

const ImportPaymentsForm = ({ onSubmit, closeModal }) => {
    const [file, setFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { setImportStatus('Por favor, selecione um arquivo .csv'); return; }
        setIsImporting(true); setImportStatus('Importando...');
        try {
            const { successfulImports, failedImports } = await onSubmit(file);
            setImportStatus(`${successfulImports} pagamentos importados. ${failedImports} falharam.`);
            setTimeout(() => closeModal(), 3000);
        } catch (error) { setImportStatus('Ocorreu um erro durante a importação.'); console.error(error); } 
        finally { setIsImporting(false); }
    };
    return (<form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-2">Selecione um arquivo .csv</label><p className="text-xs text-gray-500 mb-2">A planilha deve conter: <code className="bg-gray-100 p-1 rounded">clientName</code>, <code className="bg-gray-100 p-1 rounded">partnerName</code>, <code className="bg-gray-100 p-1 rounded">paymentValue</code>, e <code className="bg-gray-100 p-1 rounded">paymentDate</code> (AAAA-MM-DD).</p><input id="csv-upload" type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/></div>{importStatus && <p className="text-sm text-center font-medium text-gray-600">{importStatus}</p>}<FormButton disabled={isImporting || !file}>{isImporting ? 'Importando...' : 'Iniciar Importação'}</FormButton></form>);
};

const ActivityForm = ({ onSubmit, initialData }) => {
    const isEditMode = !!initialData?.id;
    const [formData, setFormData] = useState({ type: isEditMode ? initialData.type : 'Reunião', description: isEditMode ? initialData.description : '' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = { ...formData, partnerId: isEditMode ? initialData.partnerId : initialData.id, partnerName: isEditMode ? initialData.partnerName : initialData.name };
        if (isEditMode) onSubmit('activities', initialData.id, dataToSubmit);
        else onSubmit('activities', dataToSubmit);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Parceiro: {isEditMode ? initialData.partnerName : initialData.name}</h3>
            <FormSelect id="type" name="type" label="Tipo de Atividade" value={formData.type} onChange={handleChange} required><option>Reunião</option><option>Ligação</option><option>Email</option><option>Marco</option></FormSelect>
            <FormTextarea id="description" name="description" label="Descrição / Resumo" value={formData.description} onChange={handleChange} required />
            <FormButton>{isEditMode ? 'Salvar Alterações' : 'Adicionar Atividade'}</FormButton>
        </form>
    );
};

const ActivityFeed = ({ activities, onEdit, onDelete }) => {
    const activityIcons = { 'Reunião': Calendar, 'Ligação': Phone, 'Email': Mail, 'Marco': Award };
    const timeSince = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + " anos atrás";
        interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + " meses atrás";
        interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + " dias atrás";
        interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + " horas atrás";
        interval = seconds / 60; if (interval > 1) return Math.floor(interval) + " minutos atrás";
        return "agora mesmo";
    };
    if (activities.length === 0) return <p className="text-center text-gray-500 text-sm mt-4">Nenhuma atividade registrada.</p>;
    return (
        <div className="space-y-4">
            {activities.map(activity => {
                const Icon = activityIcons[activity.type] || FileText;
                return (
                    <div key={activity.id} className="flex gap-4 group">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><Icon className="h-5 w-5 text-gray-500" /></div>
                        <div className="flex-grow">
                            <p className="text-sm text-gray-800">{activity.description}</p>
                            <p className="text-xs text-gray-500"><strong>{activity.partnerName}</strong> - {timeSince(activity.createdAt?.toDate())}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity"><ActionsMenu onEdit={() => onEdit(activity)} onDelete={() => onDelete(activity.id)} /></div>
                    </div>
                );
            })}
        </div>
    );
};
