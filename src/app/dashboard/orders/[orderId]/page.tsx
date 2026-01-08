
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useBusinessId } from '@/hooks/use-business-id';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Truck, Package, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrderStatus, deleteOrder } from './actions';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
    orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    orderDate: string;
    totalAmount: number;
    transactionId: string;
    items: OrderItem[];
    shippingAddress: string;
    fulfillmentMethod: 'delivery' | 'pickup';
}

type OrderStatus = Order['orderStatus'];

const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
        case 'delivered': return 'default';
        case 'pending': return 'destructive';
        case 'processing': return 'secondary';
        case 'shipped': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'secondary';
    }
};

export default function SingleOrderPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { businessId, isLoading: isBusinessIdLoading } = useBusinessId();
    const orderId = params.orderId as string;
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const placeholderImage = PlaceHolderImages.find(img => img.id === 'product-placeholder');

    const orderRef = useMemoFirebase(() => {
        if (!firestore || !businessId || !orderId) return null;
        return doc(firestore, 'businesses', businessId, 'orders', orderId);
    }, [firestore, businessId, orderId]);

    const { data: order, isLoading: isOrderLoading, error } = useDoc<Order>(orderRef);

    const isLoading = isBusinessIdLoading || isOrderLoading;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `${label} Copied!`, description: text });
    };

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!businessId || !orderId) return;
        setIsUpdating(true);
        const result = await updateOrderStatus(businessId, orderId, newStatus);
        if (result.success) {
            toast({
                title: "Status Updated",
                description: `Order status changed to "${newStatus}".`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: result.error || "Could not update order status.",
            });
        }
        setIsUpdating(false);
    };

    const handleDeleteConfirm = async () => {
        if (!order || !businessId) return;
        setIsDeleting(true);
        const result = await deleteOrder(businessId, order.id);
        if (result.success) {
            toast({
                title: "Order Deleted",
                description: `Order #${order.id.substring(0, 7)} has been deleted.`,
            });
            router.push('/dashboard/orders');
        } else {
            toast({
                variant: 'destructive',
                title: "Delete Failed",
                description: result.error || "Could not delete the order.",
            });
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-24" />
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
        return <div className="text-destructive">Error loading order: {error.message}</div>
    }

    if (!order) {
        return <div>Order not found.</div>;
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/orders')}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Order #{order.id.substring(0, 7)}</h1>
                        <p className="text-muted-foreground">
                            {new Date(order.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Order
                    </Button>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Products</CardTitle>
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
                                                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                                            </TableRow>
                                        )})}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <CardFooter className="justify-end border-t pt-4">
                                <div className="flex items-center gap-4 text-lg font-semibold">
                                    <span>Total</span>
                                    <span>${order.totalAmount.toFixed(2)}</span>
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
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle>Fulfillment</CardTitle>
                                    <CardDescription className="mt-1">Manage order status.</CardDescription>
                                </div>
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
                            <CardFooter className="border-t pt-4">
                                <div className="w-full space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Select 
                                            defaultValue={order.orderStatus} 
                                            onValueChange={(value: OrderStatus) => handleStatusChange(value)}
                                            disabled={isUpdating}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Update Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="processing">Processing</SelectItem>
                                                <SelectItem value="shipped">Shipped</SelectItem>
                                                <SelectItem value="delivered">Delivered</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {isUpdating && <Loader2 className="h-5 w-5 animate-spin" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground">The customer will be notified and can confirm reception if the order is shipped.</p>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this order.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Deleting...</> : 'Delete Order'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
