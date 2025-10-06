import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
    getDocs
} from 'firebase/firestore';
import {
    Users, Briefcase, DollarSign, Book, Plus, X, LayoutDashboard, Gem, Trophy, Star,
    Upload, MoreVertical, Edit, Trash2, AlertTriangle,
    BadgePercent, LogOut, Handshake, Lightbulb,
    ChevronLeft, ChevronRight, Activity as ActivityIcon, Calendar, Tag
} from 'lucide-react';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/pages/Dashboard';
import DealList from './components/deals/DealList';
import PartnerList from './components/partners/PartnerList';
import PartnerDetail from './components/partners/PartnerDetail';
import { formatCurrency, parseBrazilianCurrency } from './utils/formatter';
import usePagination from './hooks/usePagination';
import ActionsMenu from './components/common/ActionsMenu';


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
const parseDateString = (dateString) => {
    if (!dateString) return null;
    try {
        const datePart = dateString.trim().split(' ')[0];
        const parts = datePart.split(/[-/]/);
        if (parts.length !== 3) return null;
        // Assume AAAA-MM-DD ou DD/MM/AAAA
        const year = parts[0].length === 4 ? parts[0] : parts[2];
        const month = parts[1];
        const day = parts[0].length === 4 ? parts[2] : parts[0];

        const date = new Date(`${year}-${month}-${day}T12:00:00Z`); // Use T12:00:00Z to avoid timezone issues
        if (isNaN(date.getTime())) return null;
        return Timestamp.fromDate(date);
    } catch (e) {
        console.error("Erro ao converter data:", dateString, e);
        return null;
    }
};

// --- Configurações do Programa de Parceria Driva ---
const TIER_THRESHOLDS = {
    FINDER: { DIAMANTE: 30000, OURO: 5000 },
    SELLER: { DIAMANTE: 20000, OURO: 5000 },
    PRATA_MIN: 499,
};

const TIER_CONFIG = {
    DIAMANTE: { name: 'Diamante', icon: Gem, color: 'text-cyan-500', bgColor: 'bg-cyan-100', commission: { FINDER: 15, SELLER: 25 } },
    OURO: { name: 'Ouro', icon: Trophy, color: 'text-amber-500', bgColor: 'bg-amber-100', commission: { FINDER: 10, SELLER: 20 } },
    PRATA: { name: 'Prata', icon: Star, color: 'text-gray-500', bgColor: 'bg-gray-100', commission: { FINDER: 5, SELLER: 15 } },
};

const getPartnerTierDetails = (paymentsReceived, type) => {
    const partnerType = type?.toUpperCase() || 'FINDER';
    const thresholds = TIER_THRESHOLDS[partnerType];

    if (paymentsReceived > thresholds.DIAMANTE) return { ...TIER_CONFIG.DIAMANTE, commissionRate: TIER_CONFIG.DIAMANTE.commission[partnerType] };
    if (paymentsReceived > thresholds.OURO) return { ...TIER_CONFIG.OURO, commissionRate: TIER_CONFIG.OURO.commission[partnerType] };
    if (paymentsReceived >= TIER_THRESHOLDS.PRATA_MIN) return { ...TIER_CONFIG.PRATA, commissionRate: TIER_CONFIG.PRATA.commission[partnerType] };

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
        const collectionsConfig = {
            partners: { setter: setPartners },
            deals: { setter: setDeals },
            resources: { setter: setResources },
            nurturing: { setter: setNurturingContent },
            payments: { setter: setPayments },
            activities: { setter: setActivities },
        };
        const unsubscribers = Object.entries(collectionsConfig).map(([col, config]) => {
            const collectionPath = `artifacts/${appId}/public/data/${col}`;
            const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));

            return onSnapshot(q, (snapshot) => {
                const dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                config.setter(dataList);
            }, (error) => console.error(`Erro ao carregar ${col}:`, error));
        });
        return () => unsubscribers.forEach(unsub => unsub());
    }, [db]);

    // --- Lógica de Filtragem por Data ---
    const filteredDeals = useMemo(() => {
        if (!startDate && !endDate) return deals;
        const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
        return deals.filter(deal => {
            if (!deal.submissionDate?.toDate) return false;
            const dealDate = deal.submissionDate.toDate();
            return dealDate && (!start || dealDate >= start) && (!end || dealDate <= end);
        });
    }, [deals, startDate, endDate]);

    const filteredPayments = useMemo(() => {
        if (!startDate && !endDate) return payments;
        const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
        return payments.filter(payment => {
             if (!payment.paymentDate?.toDate) return false;
            const paymentDate = payment.paymentDate.toDate();
            return paymentDate && (!start || paymentDate >= start) && (!end || paymentDate <= end);
        });
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
            const type = partner.type || 'Finder';
            const tierDetails = getPartnerTierDetails(paymentsReceived, type);
            // Injetar o ícone diretamente para que o PartnerList possa usá-lo
            tierDetails.icon = TIER_CONFIG[tierDetails.name.toUpperCase()]?.icon || Users;

            const commissionToPay = paymentsReceived * (tierDetails.commissionRate / 100);

            return { ...partner, paymentsReceived, tier: tierDetails, totalOpportunitiesValue, conversionRate, commissionToPay, generatedRevenue };
        });
    }, [partners, filteredDeals, filteredPayments]);

    // --- Funções de CRUD ---
    const openModal = (type, data = null) => { setModalType(type); setItemToEdit(data); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setModalType(''); setItemToEdit(null); };

    const handleAdd = async (collectionName, data) => {
        if (!db) return;
        try {
            const path = `artifacts/${appId}/public/data/${collectionName}`;
            let dataWithTs = { ...data, createdAt: serverTimestamp() };

            if (data.submissionDate) {
                dataWithTs.submissionDate = parseDateString(data.submissionDate);
            }

            await addDoc(collection(db, path), dataWithTs);
            closeModal();
        } catch (e) { console.error("Erro ao adicionar:", e); }
    };

    const handleUpdate = async (collectionName, id, data) => {
        if (!db) return;
        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/${collectionName}`, id);
            const dataToUpdate = {...data};
            if (data.submissionDate) {
                dataToUpdate.submissionDate = parseDateString(data.submissionDate);
            }
            await updateDoc(docRef, dataToUpdate);
            closeModal();
        } catch (e) { console.error("Erro ao atualizar:", e); }
    };

    const handleDelete = (collectionName, id) => setItemToDelete({ collectionName, id });

    const confirmDelete = async () => {
        if (!db || !itemToDelete) return;
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/${itemToDelete.collectionName}`, itemToDelete.id));
            setItemToDelete(null);
        } catch (e) {
            console.error("Erro ao excluir:", e);
        }
    };

    const handleBulkDelete = (collectionName, ids) => {
        if(ids.length > 0) setBulkDeleteConfig({ collectionName, ids, title: `Excluir ${ids.length} itens?`, message: `Tem a certeza de que deseja excluir os ${ids.length} itens selecionados?` });
    };

    const confirmBulkDelete = async () => {
        if (!db || !bulkDeleteConfig) return;
        try {
            const { collectionName, ids } = bulkDeleteConfig;
            const batch = writeBatch(db);
            ids.forEach(id => batch.delete(doc(db, `artifacts/${appId}/public/data/${collectionName}`, id)));
            await batch.commit();
            if (collectionName === 'deals') setSelectedDeals([]);
            if (collectionName === 'payments') setSelectedPayments([]);
            setBulkDeleteConfig(null);
        } catch (e) { console.error("Erro ao excluir em massa:", e); }
    };

     const handleImport = async (file, collectionName, selectedPartnerIdForDeals) => {
        if (!file || !db) return;
        const partnersSnapshot = await getDocs(query(collection(db, `artifacts/${appId}/public/data/partners`)));
        const partnersMap = new Map(partnersSnapshot.docs.map(doc => [doc.data().name.toLowerCase(), doc.id]));

        return new Promise((resolve, reject) => {
            if (!window.Papa) {
                reject(new Error("Biblioteca de parsing de CSV (PapaParse) não carregada."));
                return;
            }
            window.Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const itemsToImport = results.data;
                    if (itemsToImport.length === 0) {
                        resolve({ successfulImports: 0, failedImports: 0 });
                        return;
                    }

                    const batch = writeBatch(db);
                    const colRef = collection(db, `artifacts/${appId}/public/data/${collectionName}`);
                    let successfulImports = 0;
                    let failedImports = 0;

                    itemsToImport.forEach((item, index) => {
                        const newDocRef = doc(colRef);
                        let dataToSet = { createdAt: serverTimestamp() };
                        let isValid = false;

                        if (collectionName === 'partners') {
                            if (item.name && item.type && item.contactName && item.contactEmail) {
                                dataToSet = { ...dataToSet, name: item.name.trim(), type: item.type.trim(), contactName: item.contactName.trim(), contactEmail: item.contactEmail.trim() };
                                isValid = true;
                            }
                        } else if (collectionName === 'deals') {
                            const partnerIdToUse = selectedPartnerIdForDeals;
                            if (partnerIdToUse && item.clientName && item.value && item.status && item.submissionDate) {
                                const partnerName = partners.find(p => p.id === partnerIdToUse)?.name || 'Desconhecido';
                                dataToSet = { ...dataToSet, partnerId: partnerIdToUse, partnerName: partnerName, clientName: item.clientName.trim(), value: parseBrazilianCurrency(item.value), status: item.status.trim(), submissionDate: parseDateString(item.submissionDate) };
                                isValid = !!dataToSet.submissionDate;
                            }
                        } else if (collectionName === 'payments') {
                            const partnerId = partnersMap.get(item.partnerName?.trim().toLowerCase());
                            if (partnerId && item.clientName && item.paymentValue && item.paymentDate) {
                                dataToSet = { ...dataToSet, partnerId, partnerName: item.partnerName.trim(), clientName: item.clientName.trim(), paymentValue: parseBrazilianCurrency(item.paymentValue), paymentDate: parseDateString(item.paymentDate) };
                                isValid = !!dataToSet.paymentDate;
                            }
                        }

                        if (isValid) {
                            batch.set(newDocRef, dataToSet);
                            successfulImports++;
                        } else {
                            console.warn(`Linha ${index + 2} da planilha ignorada por dados inválidos ou parceiro não encontrado:`, item);
                            failedImports++;
                        }
                    });

                    try {
                        await batch.commit();
                        resolve({ successfulImports, failedImports });
                    } catch (e) {
                        console.error("Erro ao commitar o batch:", e);
                        reject(e);
                    }
                },
                error: (e) => reject(e)
            });
        });
    };


    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar auth={auth} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <Header
                    openModal={openModal}
                    startDate={startDate}
                    endDate={endDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    selectedDealsCount={selectedDeals.length}
                    onBulkDeleteDeals={() => handleBulkDelete('deals', selectedDeals)}
                    selectedPaymentsCount={selectedPayments.length}
                    onBulkDeletePayments={() => handleBulkDelete('payments', selectedPayments)}
                />
                <div className="mt-6">
                    <Routes>
                        <Route path="/" element={
                            <Dashboard
                                partners={partnersWithDetails}
                                deals={filteredDeals}
                                activities={activities}
                            />}
                        />
                        <Route path="/partners" element={
                            <PartnerList
                                partners={partnersWithDetails}
                                onEdit={openModal}
                                onDelete={handleDelete}
                            />}
                        />
                        <Route path="/partners/:partnerId" element={
                            <PartnerDetail
                                allPartners={partnersWithDetails}
                                allActivities={activities}
                                onAddActivity={openModal}
                                onDeleteActivity={handleDelete}
                                onEditActivity={openModal}
                            />}
                        />
                        <Route path="/opportunities" element={
                            <DealList
                                deals={filteredDeals}
                                partners={partners}
                                onEdit={(d) => openModal('deal', d)}
                                onDelete={handleDelete}
                                selectedDeals={selectedDeals}
                                setSelectedDeals={setSelectedDeals}
                            />}
                        />
                        <Route path="/commissioning" element={
                            <CommissioningList
                                payments={filteredPayments}
                                partners={partners}
                                openModal={openModal}
                                selectedPayments={selectedPayments}
                                setSelectedPayments={setSelectedPayments}
                            />}
                        />
                        <Route path="/resources" element={
                            <ResourceHub
                                resources={resources}
                                onEdit={(r) => openModal('resource', r)}
                                onDelete={handleDelete}
                            />}
                        />
                        <Route path="/nurturing" element={
                            <NurturingHub
                                nurturingContent={nurturingContent}
                                onEdit={(i) => openModal('nurturing', i)}
                                onDelete={handleDelete}
                            />}
                        />
                    </Routes>
                </div>
            </main>
            {isModalOpen && <Modal
                closeModal={closeModal}
                modalType={modalType}
                handleAdd={handleAdd}
                handleUpdate={handleUpdate}
                handleImport={handleImport}
                partners={partners}
                initialData={itemToEdit}
            />}
            {itemToDelete && <ConfirmationModal onConfirm={confirmDelete} onCancel={() => setItemToDelete(null)} />}
            {bulkDeleteConfig && <ConfirmationModal onConfirm={confirmBulkDelete} onCancel={() => setBulkDeleteConfig(null)} title={bulkDeleteConfig.title} message={bulkDeleteConfig.message} />}
        </div>
    );
}

export default function AppWrapper() {
    const [authInstance, setAuthInstance] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
        script.async = true;
        document.head.appendChild(script);
        try {
            if (Object.values(firebaseConfig).every(v => v)) {
                const app = initializeApp(firebaseConfig);
                const auth = getAuth(app);
                setAuthInstance(auth);
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    setUser(user);
                    setLoading(false);
                });
                return () => { unsubscribe(); if (document.head.contains(script)) document.head.removeChild(script); };
            } else {
                console.error("Firebase config is missing!");
                setLoading(false);
            }
        } catch (error) { console.error("Erro na inicialização do Firebase:", error); setLoading(false); }
    }, []);

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-700">A carregar...</div></div>;
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return <div className="flex items-center justify-center h-screen bg-red-50 text-red-800 p-8"><div className="text-center"><h2 className="text-2xl font-bold mb-4">Erro de Configuração</h2><p>As chaves do Firebase não foram encontradas. Verifique as variáveis de ambiente.</p></div></div>;

    return user ? <PrmApp auth={authInstance} /> : <LoginPage auth={authInstance} />;
}

// --- Componentes de UI ---
const CommissioningList = ({ payments, partners, openModal, selectedPayments, setSelectedPayments }) => {
    const [paginatedPayments, PaginatorComponent] = usePagination(payments);

    useEffect(() => {
        if (setSelectedPayments) {
            setSelectedPayments([]);
        }
    }, [payments.length, setSelectedPayments]);

    const handleSelectAll = (e) => setSelectedPayments(e.target.checked ? paginatedPayments.map(p => p.id) : []);
    const handleSelectOne = (e, id) => setSelectedPayments(e.target.checked ? [...selectedPayments, id] : selectedPayments.filter(pId => pId !== id));

    const partnerNameMap = useMemo(() => {
        if (!partners) return {};
        const map = {};
        partners.forEach(p => { map[p.id] = p.name; });
        return map;
    }, [partners]);

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={paginatedPayments.length > 0 && selectedPayments.length === paginatedPayments.length} className="rounded" /></th><th className="p-4 font-semibold text-slate-600">Data do Pagamento</th><th className="p-4 font-semibold text-slate-600">Cliente Final</th><th className="p-4 font-semibold text-slate-600">Parceiro</th><th className="p-4 font-semibold text-slate-600">Valor Pago</th></tr></thead>
                    <tbody>{paginatedPayments.map(p => (<tr key={p.id} className={`border-b border-slate-100 ${selectedPayments.includes(p.id) ? 'bg-sky-50' : 'hover:bg-slate-50'}`}><td className="p-4"><input type="checkbox" checked={selectedPayments.includes(p.id)} onChange={(e) => handleSelectOne(e, p.id)} className="rounded" /></td><td className="p-4 text-slate-600">{p.paymentDate?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</td><td className="p-4 text-slate-800 font-medium">{p.clientName}</td><td className="p-4 text-slate-600">{partnerNameMap[p.partnerId] || p.partnerName || 'Desconhecido'}</td><td className="p-4 text-slate-600 font-medium">{formatCurrency(parseBrazilianCurrency(p.paymentValue))}</td></tr>))}{payments.length === 0 && <tr><td colSpan="5"><p className="p-4 text-center text-gray-500">Nenhum pagamento encontrado.</p></td></tr>}</tbody>
                </table>
            </div>
            <PaginatorComponent />
        </div>
    );
};

const ResourceHub = ({ resources, onEdit, onDelete }) => ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{resources.map(r => (<div key={r.id} className="bg-white p-6 rounded-xl shadow-md flex flex-col relative"><div className="absolute top-2 right-2"><ActionsMenu onEdit={() => onEdit('resource', r)} onDelete={() => onDelete('resources', r.id)} /></div><h3 className="text-lg font-bold text-slate-800 pr-8">{r.title}</h3><p className="text-slate-600 mt-2 flex-grow">{r.description}</p><div className="mt-4 flex justify-between items-center"><span className="text-sm font-semibold bg-sky-100 text-sky-800 px-2 py-1 rounded-full">{r.category}</span><a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sky-500 hover:text-sky-600">Aceder</a></div></div>))}{resources.length === 0 && <p className="p-4 text-center text-gray-500 col-span-full">Nenhum recurso disponível.</p>}</div>);
const NurturingHub = ({ nurturingContent, onEdit, onDelete }) => ( <div className="space-y-6">{nurturingContent.map(item => (<div key={item.id} className="bg-white p-6 rounded-xl shadow-md relative"><div className="absolute top-2 right-2"><ActionsMenu onEdit={() => onEdit('nurturing', item)} onDelete={() => onDelete('nurturing', item.id)} /></div><h3 className="text-lg font-bold text-slate-800 pr-8">{item.title}</h3><p className="text-sm text-gray-500 mt-1">{item.createdAt?.toDate().toLocaleDateString('pt-BR') || ''}</p><p className="text-slate-600 mt-4 whitespace-pre-wrap">{item.content}</p></div>))}{nurturingContent.length === 0 && <p className="p-4 text-center text-gray-500">Nenhum conteúdo de nutrição publicado.</p>}</div>);

// --- Componentes Genéricos ---
const ConfirmationModal = ({ onConfirm, onCancel, title = "Confirmar Exclusão", message = "Tem a certeza de que deseja excluir este item? Esta ação não pode ser desfeita." }) => (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center"><div className="mx-auto bg-red-100 rounded-full h-12 w-12 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-medium text-gray-900 mt-4">{title}</h3><p className="text-sm text-gray-500 mt-2">{message}</p><div className="mt-6 flex justify-center gap-4"><button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-semibold">Cancelar</button><button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">Confirmar Exclusão</button></div></div></div>);

const Modal = ({ closeModal, modalType, handleAdd, handleUpdate, handleImport, partners, initialData }) => {
    const isEditMode = !!(initialData && initialData.id);
    const renderForm = () => {
        switch (modalType) {
            case 'partner': return <PartnerForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={initialData} />;
            case 'deal': return <DealForm onSubmit={isEditMode ? handleUpdate : handleAdd} partners={partners} initialData={initialData} />;
            case 'resource': return <ResourceForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={initialData} />;
            case 'nurturing': return <NurturingForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={initialData} />;
            case 'activity': return <ActivityForm onSubmit={isEditMode ? handleUpdate : handleAdd} initialData={initialData} />;
            case 'importPayments': return <ImportForm collectionName="payments" onSubmit={handleImport} closeModal={closeModal} partners={partners}/>;
            case 'importPartners': return <ImportForm collectionName="partners" onSubmit={handleImport} closeModal={closeModal} partners={partners}/>;
            case 'importDeals': return <ImportForm collectionName="deals" partners={partners} onSubmit={handleImport} closeModal={closeModal} />;
            default: return null;
        }
    };
    const titles = {
        partner: isEditMode ? 'Editar Parceiro' : 'Adicionar Parceiro',
        deal: isEditMode ? 'Editar Oportunidade' : 'Registrar Oportunidade',
        resource: isEditMode ? 'Editar Recurso' : 'Adicionar Recurso',
        nurturing: isEditMode ? 'Editar Conteúdo' : 'Adicionar Conteúdo',
        activity: isEditMode ? 'Editar Atividade' : 'Adicionar Atividade',
        importPayments: 'Importar Planilha de Pagamentos',
        importPartners: 'Importar Planilha de Parceiros',
        importDeals: 'Importar Planilha de Oportunidades'
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-lg"><div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold text-slate-800">{titles[modalType]}</h2><button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button></div><div className="p-6">{renderForm()}</div></div></div>);
};

// --- Formulários ---
const FormInput = ({ id, label, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>);
const FormSelect = ({ id, label, children, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><select id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500">{children}</select></div>);
const FormTextarea = ({ id, label, ...props }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><textarea id={id} {...props} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>);
const FormButton = ({ children, ...props }) => (<button type="submit" {...props} className="w-full bg-sky-500 text-white py-2 px-4 rounded-md hover:bg-sky-600 font-semibold transition-colors duration-200 disabled:bg-sky-300">{children}</button>);

const PartnerForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ name: initialData?.name || '', type: initialData?.type || 'Finder', contactName: initialData?.contactName || '', contactEmail: initialData?.contactEmail || '' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); if (initialData?.id) onSubmit('partners', initialData.id, formData); else onSubmit('partners', formData); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="name" name="name" label="Nome do Parceiro" value={formData.name} onChange={handleChange} required /><FormSelect id="type" name="type" label="Tipo de Parceiro" value={formData.type} onChange={handleChange} required><option value="Finder">Finder</option><option value="Seller">Seller</option></FormSelect><FormInput id="contactName" name="contactName" label="Nome do Contato" value={formData.contactName} onChange={handleChange} required /><FormInput id="contactEmail" name="contactEmail" label="Email do Contato" type="email" value={formData.contactEmail} onChange={handleChange} required /><FormButton>{initialData?.id ? 'Salvar Alterações' : 'Salvar Parceiro'}</FormButton></form>);
};

const DealForm = ({ onSubmit, partners, initialData }) => {
    const [formData, setFormData] = useState({ clientName: initialData?.clientName || '', partnerId: initialData?.partnerId || '', submissionDate: initialData?.submissionDate?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0], value: initialData?.value || '', status: initialData?.status || 'Pendente' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); const selectedPartner = partners.find(p => p.id === formData.partnerId); const dataToSubmit = { ...formData, value: formData.value, partnerName: selectedPartner ? selectedPartner.name : 'N/A' }; if (initialData?.id) onSubmit('deals', initialData.id, dataToSubmit); else onSubmit('deals', dataToSubmit); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="clientName" name="clientName" label="Nome do Cliente Final" value={formData.clientName} onChange={handleChange} required /><FormSelect id="partnerId" name="partnerId" label="Parceiro Responsável" value={formData.partnerId} onChange={handleChange} required><option value="">Selecione um parceiro</option>{partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</FormSelect><FormInput id="submissionDate" name="submissionDate" label="Data da Indicação" type="date" value={formData.submissionDate} onChange={handleChange} required /><FormInput id="value" name="value" label="Valor Estimado (R$)" type="text" value={formData.value} onChange={handleChange} required placeholder="Ex: 1.250,50" /><FormSelect id="status" name="status" label="Status" value={formData.status} onChange={handleChange} required><option>Pendente</option><option>Aprovado</option><option>Ganho</option><option>Perdido</option></FormSelect><FormButton>{initialData?.id ? 'Salvar Alterações' : 'Registrar Oportunidade'}</FormButton></form>);
};

const ResourceForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ title: initialData?.title || '', description: initialData?.description || '', url: initialData?.url || '', category: initialData?.category || 'Marketing' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); if (initialData?.id) onSubmit('resources', initialData.id, formData); else onSubmit('resources', formData); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="title" name="title" label="Título do Recurso" value={formData.title} onChange={handleChange} required /><FormTextarea id="description" name="description" label="Descrição" value={formData.description} onChange={handleChange} required /><FormInput id="url" name="url" label="URL do Recurso" type="url" value={formData.url} onChange={handleChange} required /><FormSelect id="category" name="category" label="Categoria" value={formData.category} onChange={handleChange} required><option>Marketing</option><option>Vendas</option><option>Técnico</option><option>Legal</option></FormSelect><FormButton>{initialData?.id ? 'Salvar Alterações' : 'Salvar Recurso'}</FormButton></form>);
};

const NurturingForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({ title: initialData?.title || '', content: initialData?.content || '' });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); if (initialData?.id) onSubmit('nurturing', initialData.id, formData); else onSubmit('nurturing', formData); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><FormInput id="title" name="title" label="Título do Conteúdo" value={formData.title} onChange={handleChange} required /><FormTextarea id="content" name="content" label="Conteúdo/Direcionamento" value={formData.content} onChange={handleChange} required /><FormButton>{initialData?.id ? 'Salvar Alterações' : 'Publicar Conteúdo'}</FormButton></form>);
};

const ActivityForm = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        category: initialData?.category || 'Reunião',
        partnerId: initialData?.partnerId,
        partnerName: initialData?.partnerName
    });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {
        e.preventDefault();
        if (initialData?.id) {
            onSubmit('activities', initialData.id, formData);
        } else {
            onSubmit('activities', formData);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="title" name="title" label="Título da Atividade" value={formData.title} onChange={handleChange} required />
            <FormSelect id="category" name="category" label="Categoria" value={formData.category} onChange={handleChange} required>
                <option>Reunião</option>
                <option>Ligação</option>
                <option>Email</option>
                <option>Outro</option>
            </FormSelect>
            <FormTextarea id="description" name="description" label="Descrição" value={formData.description} onChange={handleChange} required />
            <FormButton>{initialData?.id ? 'Salvar Alterações' : 'Salvar Atividade'}</FormButton>
        </form>
    );
};


const ImportForm = ({ collectionName, onSubmit, closeModal, partners }) => {
    const [file, setFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState('');
    const [selectedPartnerId, setSelectedPartnerId] = useState('');

    const instructions = {
        partners: 'A planilha CSV deve conter as colunas: name, type, contactName, contactEmail.',
        deals: 'A planilha CSV deve conter as colunas: clientName, value, status, submissionDate (formato AAAA-MM-DD). Todas as oportunidades serão associadas ao parceiro selecionado abaixo.',
        payments: 'A planilha CSV deve conter as colunas: clientName, partnerName, paymentValue, paymentDate (formato AAAA-MM-DD).'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { setImportStatus('Por favor, selecione um arquivo .csv'); return; }
        if (collectionName === 'deals' && !selectedPartnerId) {
             setImportStatus('Por favor, selecione um parceiro para associar as oportunidades.');
             return;
        }
        setIsImporting(true); setImportStatus('Importando...');
        try {
            const { successfulImports, failedImports } = await onSubmit(file, collectionName, selectedPartnerId);
            setImportStatus(`${successfulImports} itens importados com sucesso. ${failedImports > 0 ? `${failedImports} linhas ignoradas.` : ''}`);
            setTimeout(() => closeModal(), 3000);
        } catch (error) { setImportStatus('Ocorreu um erro durante a importação.'); console.error(error); }
        finally { setIsImporting(false); }
    };

    const requiresPartnerSelection = collectionName === 'deals';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{instructions[collectionName]}</p>

            {requiresPartnerSelection && partners?.length > 0 && (
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

            <div>
                <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-2">Selecione um arquivo .csv</label>
                <input id="csv-upload" type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
            </div>
            {importStatus && <p className="text-sm text-center font-medium text-gray-600">{importStatus}</p>}
            <FormButton disabled={isImporting || !file}>{isImporting ? 'Importando...' : 'Iniciar Importação'}</FormButton>
        </form>
    );
};
