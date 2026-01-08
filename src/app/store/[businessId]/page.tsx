
'use server';

import { getBusinessById } from '@/firebase/server';
import StorePageClient from './page-client';
import { notFound } from 'next/navigation';
import type { Product } from '@/types/product';

export type { Product };

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
    logoUrl: string | null;
    contactInfo: string;
    businessAddress?: string;
    theme?: BusinessTheme;
    layout?: 'Grid' | 'Carousel' | 'Minimalist';
    fontPair?: FontPair;
    heroImageUrl?: string | null;
    showHeroSection?: boolean;
    fulfillment?: FulfillmentSettings;
    flutterwavePublicKey?: string;
}


export default async function StorePage({ params }: { params: { businessId: string } }) {
    const business = await getBusinessById(params.businessId) as Business;

    if (!business) {
        notFound();
    }
    
    return <StorePageClient business={business} />;
}

    
