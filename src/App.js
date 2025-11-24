import React, { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
    collection,
    addDoc,
    doc,
    serverTimestamp,
    writeBatch,
    Timestamp,
    updateDoc,
    deleteDoc,
    getDocs,
    query
} from 'firebase/firestore';
import {
    Users, Gem, Trophy, Star
} from 'lucide-react';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/pages/Dashboard';
import DealList from './components/deals/DealList';
import PartnerList from './components/partners/PartnerList';
import PartnerDetail from './components/partners/PartnerDetail';
import { parseBrazilianCurrency } from './utils/formatter';
import ResourceHub from './components/resources/ResourceHub';
import NurturingHub from './components/nurturing/NurturingHub';
import Modal from './components/common/Modal';
import ConfirmationModal from './components/common/ConfirmationModal';
import LoginPage from './pages/LoginPage';

import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { DataProvider, useData } from './context/DataContext';

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

// --- Configuração de Tiers ---
const TIER_CONFIG = {
    DIAMANTE: { name: 'Diamante', icon: Gem, color: 'text-cyan-500', bgColor: 'bg-cyan-100' },
    OURO: { name: 'Ouro', icon: Trophy, color: 'text-amber-500', bgColor: 'bg-amber-100' },
    PRATA: { name: 'Prata', icon: Star, color: 'text-gray-500', bgColor: 'bg-gray-100' },
};


// --- Componente Principal do App ---
function PrmApp() {
    const { auth, db } = useFirebase();
    const { partners, deals, resources, nurturingContent, activities } = useData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [bulkDeleteConfig, setBulkDeleteConfig] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedDeals, setSelectedDeals] = useState([]);

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



    // --- Cálculo de Dados Derivados ---
    const partnersWithDetails = useMemo(() => {
        const dealsByPartner = filteredDeals.reduce((acc, d) => { if (!acc[d.partnerId]) acc[d.partnerId] = []; acc[d.partnerId].push(d); return acc; }, {});

        return partners.map(partner => {
            const partnerDeals = dealsByPartner[partner.id] || [];
            const generatedRevenue = partnerDeals.filter(d => d.status === 'Ganho').reduce((sum, d) => sum + (parseBrazilianCurrency(d.value) || 0), 0);
            const totalOpportunitiesValue = partnerDeals.reduce((sum, d) => sum + (parseBrazilianCurrency(d.value) || 0), 0);
            const wonDealsCount = partnerDeals.filter(d => d.status === 'Ganho').length;
            const conversionRate = partnerDeals.length > 0 ? (wonDealsCount / partnerDeals.length) * 100 : 0;

            // Get tier from partner data or default to Prata
            const tierName = partner.tier || 'Prata';
            const tierDetails = TIER_CONFIG[tierName.toUpperCase()] || { name: tierName, icon: Star, color: 'text-gray-500', bgColor: 'bg-gray-100' };

            return { ...partner, tier: tierDetails, totalOpportunitiesValue, conversionRate, generatedRevenue };
        });
    }, [partners, filteredDeals]);

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
            const dataToUpdate = { ...data };
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
        if (ids.length > 0) setBulkDeleteConfig({ collectionName, ids, title: `Excluir ${ids.length} itens?`, message: `Tem a certeza de que deseja excluir os ${ids.length} itens selecionados?` });
    };

    const confirmBulkDelete = async () => {
        if (!db || !bulkDeleteConfig) return;
        try {
            const { collectionName, ids } = bulkDeleteConfig;
            const batch = writeBatch(db);
            ids.forEach(id => batch.delete(doc(db, `artifacts/${appId}/public/data/${collectionName}`, id)));
            await batch.commit();
            if (collectionName === 'deals') setSelectedDeals([]);
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
                                onEdit={(item) => openModal('deal', item)}
                                onDelete={handleDelete}
                                selectedDeals={selectedDeals}
                                setSelectedDeals={setSelectedDeals}
                            />}
                        />

                        <Route path="/resources" element={
                            <ResourceHub
                                resources={resources}
                                onEdit={(item) => openModal('resource', item)}
                                onDelete={handleDelete}
                            />}
                        />
                        <Route path="/nurturing" element={
                            <NurturingHub
                                nurturingContent={nurturingContent}
                                onEdit={(item) => openModal('nurturing', item)}
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

const AppContent = () => {
    const { user, loading, error, auth } = useFirebase();

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold text-gray-700">A carregar...</div></div>;
    if (error) return <div className="flex items-center justify-center h-screen bg-red-50 text-red-800 p-8"><div className="text-center"><h2 className="text-2xl font-bold mb-4">Erro</h2><p>{error}</p></div></div>;

    return user ? <PrmApp /> : <LoginPage auth={auth} />;
};

export default function AppWrapper() {
    React.useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
        script.async = true;
        document.head.appendChild(script);
        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    return (
        <FirebaseProvider>
            <DataProvider>
                <AppContent />
            </DataProvider>
        </FirebaseProvider>
    );
}
