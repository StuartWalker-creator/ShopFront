
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Icons } from '@/components/icons';

// Types from settings page - could be centralized
export interface FontPair {
    headlineFont: string;
    bodyFont: string;
}
export interface BusinessTheme {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    card: string;
    dark?: BusinessTheme;
}
export interface FulfillmentSettings {
    delivery: { enabled: boolean; feePerMile: number; };
    pickup: { enabled: boolean; address: string; };
    payment: { 
        payOnDelivery: { enabled: boolean };
        payOnline: { enabled: boolean };
    };
}
export interface Business {
    id: string;
    name: string;
    tagline: string;
    description: string;
    logoUrl: string | null;
    ownerId: string;
    subscriptionId: string;
    businessAddress?: string;
    theme?: BusinessTheme;
    customDomain?: string;
    layout?: string;
    fontPair?: FontPair;
    fontDescription?: string;
    heroImageUrl?: string | null;
    showHeroSection?: boolean;
    fulfillment?: FulfillmentSettings;
    flutterwavePublicKey?: string;
}
interface Subscription {
    id: string;
    name: string;
    price: number;
    features: string[];
}
interface Product {
    id: string;
}

interface BusinessContextType {
    business: Business | null;
    subscriptions: Subscription[] | null;
    plan: Subscription | null;
    productCount: number;
    isBusinessLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [business, setBusiness] = useState<Business | null>(null);
    const [isBusinessDocLoading, setIsBusinessDocLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
    const [areSubscriptionsLoading, setAreSubscriptionsLoading] = useState(true);

    useEffect(() => {
        const fetchBusiness = async () => {
            if (!user || !firestore) {
                setIsBusinessDocLoading(false);
                return;
            }
            
            setIsBusinessDocLoading(true);
            const businessesRef = collection(firestore, 'businesses');
            const q = query(businessesRef, where("ownerId", "==", user.uid), limit(1));
            
            try {
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const businessDoc = querySnapshot.docs[0];
                    setBusiness({ id: businessDoc.id, ...businessDoc.data() } as Business);
                } else {
                    setBusiness(null);
                }
            } catch (e) {
                console.error("Error fetching business document:", e);
                setBusiness(null);
            } finally {
                setIsBusinessDocLoading(false);
            }
        };

        if (!isUserLoading) {
            fetchBusiness();
        }

    }, [user, firestore, isUserLoading]);

    // Fetch subscriptions once, as they don't change often.
    useEffect(() => {
        if (!firestore) return;
        
        const fetchSubscriptions = async () => {
            setAreSubscriptionsLoading(true);
            try {
                const subscriptionsQuery = query(collection(firestore, 'subscriptions'), orderBy('price'));
                const querySnapshot = await getDocs(subscriptionsQuery);
                const subs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
                setSubscriptions(subs);
            } catch (e) {
                console.error("Error fetching subscriptions:", e);
                setSubscriptions(null);
            } finally {
                setAreSubscriptionsLoading(false);
            }
        };

        fetchSubscriptions();
    }, [firestore]);


    const productsRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        const id = business?.id;
        if (!id) return null;
        return collection(firestore, 'businesses', id, 'products');
    }, [user, firestore, business]);

    const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsRef);
    
    const isBusinessLoading = isUserLoading || isBusinessDocLoading || areProductsLoading || areSubscriptionsLoading;

    const plan = subscriptions?.find(p => p.id === business?.subscriptionId) || null;
    const productCount = products?.length ?? 0;

    if (isUserLoading || (user && isBusinessLoading)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Icons.logo className="h-16 w-16 text-primary animate-pulse" />
            </div>
        );
    }
    
    if (user && !isBusinessLoading && !business) {
         return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Business Not Found</h2>
                    <p className="text-muted-foreground">We couldn't find a business associated with your account.</p>
                </div>
            </div>
        );
    }

    return (
        <BusinessContext.Provider value={{ business, subscriptions, plan, productCount, isBusinessLoading }}>
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusiness() {
    const context = useContext(BusinessContext);
    if (context === undefined) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return context;
}
