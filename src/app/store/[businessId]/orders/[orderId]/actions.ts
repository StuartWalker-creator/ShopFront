
'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/firebase/admin/admin';
import { revalidatePath } from 'next/cache';
import { auth } from 'firebase-admin';

const db = getFirestore(getAdminApp());

export async function confirmOrderReception(businessId: string, orderId: string, customerId: string) {
    if (!businessId || !orderId || !customerId) {
        return { success: false, error: "Missing required information." };
    }
    
    // In a real app, you would get the current user's ID from the session, not pass it from the client.
    // For now, we trust the client, but this is a security risk. A proper implementation would use server-side auth checks.
    // Let's assume for now we can check the calling user's identity. 
    // The placeholder logic below simulates this.
    // const callingUserId = await getUserIdFromSession(); 
    // if (callingUserId !== customerId) {
    //   return { success: false, error: "Unauthorized." };
    // }

    try {
        const orderRef = db.collection('businesses').doc(businessId).collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            return { success: false, error: "Order not found." };
        }

        const orderData = orderSnap.data();
        if (orderData?.customerId !== customerId) {
            return { success: false, error: "You are not authorized to update this order." };
        }

        await orderRef.update({
            orderStatus: 'delivered'
        });

        // Revalidate paths for both customer and owner to see the update
        revalidatePath(`/store/${businessId}/orders/${orderId}`);
        revalidatePath(`/dashboard/orders/${orderId}`);

        return { success: true };

    } catch (error: any) {
        console.error("Failed to confirm order reception:", error);
        return { success: false, error: error.message || "An unknown error occurred." };
    }
}
