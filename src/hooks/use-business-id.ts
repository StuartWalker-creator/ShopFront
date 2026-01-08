
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

/**
 * A hook to get the businessId for the currently authenticated user in the dashboard.
 * This hook is intended for use only within the /dashboard/* routes.
 * It finds the business by looking for a document where the ownerId matches the user's UID.
 */
export function useBusinessId() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBusinessId = async () => {
            if (isUserLoading) {
                setIsLoading(true);
                return;
            }
            if (!user || !firestore) {
                setIsLoading(false);
                setBusinessId(null);
                return;
            }
    
            setIsLoading(true);
            try {
                // Query the businesses collection to find the document where ownerId matches the user's UID.
                const businessesRef = collection(firestore, 'businesses');
                const q = query(businessesRef, where("ownerId", "==", user.uid), limit(1));
                const querySnapshot = await getDocs(q);
    
                if (!querySnapshot.empty) {
                    // Get the ID from the first document found.
                    const businessDoc = querySnapshot.docs[0];
                    setBusinessId(businessDoc.id);
                } else {
                    console.error("No business document found for the current user in dashboard.");
                    setBusinessId(null);
                }
            } catch (e) {
                console.error("Error fetching business ID for dashboard:", e);
                setBusinessId(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBusinessId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firestore, user, isUserLoading]);


    return { businessId, isLoading };
}
