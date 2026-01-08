
'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/firebase/admin/admin';
import type { Business } from '@/app/store/[businessId]/page';
import type { Product } from '@/types/product';
import { cache } from 'react';


const db = getFirestore(getAdminApp());


export const getBusinessById = cache(async (id: string): Promise<Business | null> => {
    // Add validation check to ensure the ID is a non-empty string.
    if (!id || typeof id !== 'string') {
        console.warn(`[SERVER] getBusinessById called with invalid ID: ${id}`);
        return null;
    }

    try {
        const businessDoc = await db.collection('businesses').doc(id).get();

        if (!businessDoc.exists) {
            return null;
        }

        const businessData = { id: businessDoc.id, ...businessDoc.data() } as Business;
        
        return businessData;
    } catch (error) {
        console.error(`[SERVER] CRITICAL: An unexpected error occurred during Firestore query for ID: "${id}"`, error);
        return null;
    }
});

export const getProductById = cache(async (businessId: string, productId: string): Promise<Product | null> => {
    if (!businessId || !productId) return null;
    
    try {
        const productDoc = await db.collection('businesses').doc(businessId).collection('products').doc(productId).get();

        if (!productDoc.exists) {
            return null;
        }
        
        const productData = { id: productDoc.id, ...productDoc.data() } as Product;

        // Ensure imageUrls is always an array for client-side consistency
        if (typeof productData.imageUrls === 'string') {
            // @ts-ignore
            productData.imageUrls = [productData.imageUrls];
        } else if (!Array.isArray(productData.imageUrls)) {
            // @ts-ignore
            productData.imageUrls = [];
        }

        return productData;

    } catch (error) {
        console.error(`[SERVER] CRITICAL: Error fetching product ${productId} for business ${businessId}`, error);
        return null;
    }
});


export const getBusinessByDomain = cache(async (domain: string): Promise<Business | null> => {
    try {
        const businessQuery = db.collection('businesses').where('customDomain', '==', domain).limit(1);
        const querySnapshot = await businessQuery.get();

        if (querySnapshot.empty) {
            return null;
        }

        const businessDoc = querySnapshot.docs[0];
        return { id: businessDoc.id, ...businessDoc.data() } as Business;
    } catch (error) {
        console.error("[SERVER] Error during Firestore query in getBusinessByDomain:", error);
        return null;
    }
});

export const getPublishedProducts = cache(async (businessId: string): Promise<Product[]> => {
    if (!businessId) return [];

    try {
        const productsQuery = db.collection('businesses').doc(businessId).collection('products').where('status', '==', 'published');
        const querySnapshot = await productsQuery.get();
        
        return querySnapshot.docs.map(doc => {
            const productData = { id: doc.id, ...doc.data() } as Product;
            
             // Ensure imageUrls is always an array
            if (typeof productData.imageUrls === 'string') {
                // @ts-ignore
                productData.imageUrls = [productData.imageUrls];
            } else if (!Array.isArray(productData.imageUrls)) {
                // @ts-ignore
                productData.imageUrls = [];
            }
            
            return productData;
        });

    } catch (error) {
        console.error(`[SERVER] CRITICAL: Error fetching published products for business ${businessId}`, error);
        return [];
    }
});
