
'use server';

import { getBusinessById, getProductById } from '@/firebase/server';
import ProductPageClient from './page-client';
import { notFound } from 'next/navigation';
import type { Business } from '../../page';


export default async function ProductPage({ params }: { params: { businessId: string, productId: string } }) {
    const business = await getBusinessById(params.businessId) as Business;
    const product = await getProductById(params.businessId, params.productId);

    if (!business || !product) {
        notFound();
    }
    
    return <ProductPageClient business={business} product={product} />;
}

    
