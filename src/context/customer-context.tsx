
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface Customer {
    id: string;
    username: string;
    email: string;
    cart: { productId: string; quantity: number }[];
}

interface CustomerContextType {
    user: User | null;
    customer: Customer | null;
    isCustomerLoading: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children, businessId }: { children: ReactNode, businessId: string }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const customerRef = useMemoFirebase(() => {
        if (!user || !firestore || !businessId) return null;
        return doc(firestore, 'businesses', businessId, 'customers', user.uid);
    }, [user, firestore, businessId]);

    const { data: customer, isLoading: isCustomerDocLoading } = useDoc<Customer>(customerRef);
    
    // The final loading state depends on the initial auth check and the subsequent customer doc fetch.
    const isCustomerLoading = isUserLoading || (user && isCustomerDocLoading);

    const value = {
        user,
        customer,
        isCustomerLoading
    };

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
}

export function useCustomer() {
    const context = useContext(CustomerContext);
    if (context === undefined) {
        throw new Error('useCustomer must be used within a CustomerProvider');
    }
    return context;
}
