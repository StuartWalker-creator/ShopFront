
'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/firebase/admin/admin';
import { revalidatePath } from 'next/cache';
import { generateOrderStatusAudio } from '@/ai/flows/order-status-tts';

const db = getFirestore(getAdminApp());

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export async function updateOrderStatus(businessId: string, orderId: string, status: OrderStatus) {
    if (!businessId || !orderId || !status) {
        return { success: false, error: "Missing required fields for updating order status." };
    }

    try {
        const orderRef = db.collection('businesses').doc(businessId).collection('orders').doc(orderId);
        
        let audioUrl: string | null = null;
        const orderSnap = await orderRef.get();
        const orderData = orderSnap.data();

        if (orderData) {
            // Only generate audio if the status is changing to something meaningful for the customer
            if ((status === 'processing' || status === 'shipped') && orderData.orderStatus !== status) {
                const audioResult = await generateOrderStatusAudio({
                    customerName: orderData.customerName,
                    orderStatus: status,
                    businessName: orderData.businessName || 'the store'
                });
                audioUrl = audioResult.audioDataUri;
            }

            await orderRef.update({
                orderStatus: status,
                ...(audioUrl && { statusUpdateAudioUrl: audioUrl }),
            });

        } else {
             return { success: false, error: "Order not found." };
        }


        // Revalidate the path to ensure the owner's dashboard and customer's order page show the latest status
        revalidatePath(`/dashboard/orders/${orderId}`);
        revalidatePath(`/store/${businessId}/orders/${orderId}`);

        return { success: true };

    } catch (error: any) {
        console.error("Failed to update order status:", error);
        return { success: false, error: error.message || "An unknown error occurred while updating the order status." };
    }
}


export async function deleteOrder(businessId: string, orderId: string) {
    if (!businessId || !orderId) {
        return { success: false, error: "Missing required fields for deleting the order." };
    }

    try {
        const orderRef = db.collection('businesses').doc(businessId).collection('orders').doc(orderId);
        await orderRef.delete();

        // Revalidate the main orders list page for the owner
        revalidatePath(`/dashboard/orders`);
        // We might also want to revalidate the customer's order list, but it's less critical
        // revalidatePath(`/store/${businessId}/orders`);

        return { success: true };

    } catch (error: any) {
        console.error("Failed to delete order:", error);
        return { success: false, error: error.message || "An unknown error occurred while deleting the order." };
    }
}
