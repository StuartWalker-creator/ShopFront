
'use server';

import React from 'react';
import { getBusinessById } from '@/firebase/server';
import { notFound } from 'next/navigation';
import type { Business } from '../page';
import CheckoutForm from './checkout-form';

export default async function CheckoutPage({ params }: { params: { businessId: string } }) {
    const business = await getBusinessById(params.businessId) as Business | null;

    if (!business) {
        notFound();
    }

    return <CheckoutForm business={business} />;
}
