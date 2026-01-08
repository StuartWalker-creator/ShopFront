
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Truck, Package, Copy, Loader2, CheckCircle, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { confirmOrderReception } from './actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCustomer } from '@/context/customer-context';


interface OrderItem {
    productId: string;
    title: string;
    quantity: number;
    price: number;
    imageUrls?: string[];
}

interface Order {
    id: string;
    customerName: string;
    customerId: string;
    orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    orderDate: string;
    totalAmount: number;
    transactionId: string;
    items: OrderItem[];
    shippingAddress: string;
    fulfillmentMethod: 'delivery' | 'pickup';
    statusUpdateAudioUrl?: string;
}

const getStatusVariant = (status: Order['orderStatus']) => {
    switch (status) {
        case 'delivered': return 'default';
        case 'pending': return 'destructive';
        case 'processing': return 'secondary';
        case 'shipped': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'secondary';
    }
};

export default function StoreSingleOrderPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useCustomer();
    const businessId = params.businessId as string;
    const orderId = params.orderId as string;
    const [isConfirming, setIsConfirming] = useState(false);
    const placeholderImage = PlaceHolderImages.find(img => img.id === 'product-placeholder');


    const orderRef = useMemoFirebase(() => {
        if (!firestore || !businessId || !orderId) return null;
        return doc(firestore, 'businesses', businessId, 'orders', orderId);
    }, [firestore, businessId, orderId]);

    const { data: order, isLoading: isOrderLoading, error } = useDoc<Order>(orderRef);

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: `${label} Copied!`, description: text });
    };

    const handleConfirmReception = async () => {
        if (!user || !order) return;
        setIsConfirming(true);
        const result = await confirmOrderReception(businessId, orderId, user.uid);
        if (result.success) {
            toast({
                title: "Order Confirmed!",
                description: "Thank you for confirming the reception of your order."
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Confirmation Failed",
                description: result.error || "Could not confirm order reception."
            });
        }
        setIsConfirming(false);
    };

    const canConfirmReception = order && ['shipped', 'processing'].includes(order.orderStatus);

    if (isOrderLoading) {
        return (
            <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card>
                            <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-destructive text-center p-8">Error loading order: {error.message}</div>
    }

    if (!order) {
        return <div className="text-center p-8">Order not found.</div>;
    }
    
    if (user?.uid !== order.customerId) {
        return <div className="text-center p-8 text-destructive">You are not authorized to view this order.</div>;
    }

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Orders</span>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Order #{order.id.substring(0, 7)}</h1>
                    <p className="text-muted-foreground">
                        Placed on {new Date(order.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {order.statusUpdateAudioUrl && (
                <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Volume2 className="h-6 w-6 text-primary" />
                        <div className="flex-1">
                            <p className="font-semibold text-primary">A New Update on Your Order!</p>
                            <audio controls src={order.statusUpdateAudioUrl} className="w-full h-10 mt-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Products Ordered</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map(item => {
                                         const imageUrl = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : placeholderImage?.imageUrl;
                                         return (
                                        <TableRow key={item.productId}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-12 w-12 rounded-md border overflow-hidden">
                                                        {imageUrl ? (
                                                            <Image src={imageUrl} alt={item.title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">?</div>
                                                        )}
                                                    </div>
                                                    <span>{item.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell className="text-right">UGX {item.price.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">UGX {(item.price * item.quantity).toLocaleString()}</TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="justify-end border-t pt-4">
                            <div className="flex items-center gap-4 text-lg font-semibold">
                                <span>Total</span>
                                <span>UGX {order.totalAmount.toLocaleString()}</span>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="font-medium">{order.customerName}</p>
                            {order.fulfillmentMethod === 'delivery' && (
                                <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Fulfillment</CardTitle>
                             <Badge variant={getStatusVariant(order.orderStatus)} className="capitalize">
                                {order.orderStatus}
                             </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-2">
                                {order.fulfillmentMethod === 'delivery' ? <Truck className="h-5 w-5 text-muted-foreground" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                                <span className="font-medium capitalize">{order.fulfillmentMethod}</span>
                             </div>
                             {order.transactionId && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Transaction ID</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-xs text-muted-foreground truncate">{order.transactionId}</p>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(order.transactionId, "Transaction ID")}>
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                             )}
                        </CardContent>
                        {canConfirmReception && (
                            <CardFooter className="border-t pt-4">
                                <Button className="w-full" onClick={handleConfirmReception} disabled={isConfirming}>
                                    {isConfirming ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                    )}
                                    {isConfirming ? 'Confirming...' : 'Confirm Reception'}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
