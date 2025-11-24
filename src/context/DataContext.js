import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useFirebase } from './FirebaseContext';

const DataContext = createContext(null);

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { db, user } = useFirebase();
    const [partners, setPartners] = useState([]);
    const [deals, setDeals] = useState([]);
    const [resources, setResources] = useState([]);
    const [nurturingContent, setNurturingContent] = useState([]);
    const [activities, setActivities] = useState([]);

    const appId = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'prm-driva-default';

    useEffect(() => {
        if (!db || !user) return;

        const collectionsConfig = {
            partners: { setter: setPartners },
            deals: { setter: setDeals },
            resources: { setter: setResources },
            nurturing: { setter: setNurturingContent },
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
    }, [db, user, appId]);

    const value = {
        partners,
        deals,
        resources,
        nurturingContent,
        activities
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
