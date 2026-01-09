
'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, query, where, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useBusinessId } from '@/hooks/use-business-id';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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
import { useToast } from '@/hooks/use-toast';
import { deleteOrder } from './[orderId]/actions';
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

export default function OrdersPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const customerId = searchParams.get('customerId');
    const { businessId, isLoading: isBusinessIdLoading } = useBusinessId();
    const { toast } = useToast();
    const placeholderImage = PlaceHolderImages.find(img => img.id === 'product-placeholder');

    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    console.error('businessId: ',businessId)
const ordersQuery = useMemo(() => {
if (!firestore || !businessId) return null;

console.log('Orders query running with businessId:', businessId);

const baseQuery = collection(
firestore,
'businesses',
businessId,
'orders'
);

if (customerId) {
return query(baseQuery, where('customerId', '==', customerId));
}

return baseQuery;
}, [firestore, businessId, customerId]);
console.error('businessId: ',businessId)
  //  })})
    
 const { data: orders, isLoading: areOrdersLoading, error } = useCollection<Order>(ordersQuery);

    const isLoading = isBusinessIdLoading || areOrdersLoading;

    const getStatusVariant = (status: Order['orderStatus']) => {
        switch (status) {
            case 'delivered':
                return 'default';
            case 'pending':
                return 'destructive';
            case 'processing':
                return 'secondary';
            case 'shipped':
                return 'outline';
            case 'cancelled':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation(); // Prevent row click from firing
        setOrderToDelete(order);
    };

    const handleDeleteConfirm = async () => {
        if (!orderToDelete || !businessId) return;
        setIsDeleting(true);
        const result = await deleteOrder(businessId, orderToDelete.id);
        if (result.success) {
            toast({
                title: "Order Deleted",
                description: `Order #${orderToDelete.id.substring(0, 7)} has been deleted.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Delete Failed",
                description: result.error || "Could not delete the order.",
            });
        }
        setIsDeleting(false);
        setOrderToDelete(null);
    };
    
    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>{customerId ? `Orders for Customer` : 'All Orders'}</CardTitle>
                <CardDescription>
                    {customerId ? 'A list of orders placed by this customer.' : 'View and manage all incoming orders.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[64px] sm:table-cell">
                                <span className="sr-only">Image</span>
                            </TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="hidden md:table-cell">Transaction ID</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-32" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : error ? (
                             <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-destructive">
                                    Error loading orders: {error.message}
                                </TableCell>
                            </TableRow>
                        ) : orders && orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                No orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders?.map(order => {
                                const imageUrl = (order.items && order.items.length > 0 && order.items[0].imageUrls && order.items[0].imageUrls[0]) ? order.items[0].imageUrls[0] : placeholderImage?.imageUrl;

                                return (
                                <TableRow 
                                    key={order.id} 
                                    className="group"
                                >
                                    <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                                        {imageUrl ? (
                                            <Image
                                                alt={order.items[0].title}
                                                className="aspect-square rounded-md object-cover"
                                                height="48"
                                                src={imageUrl}
                                                width="48"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                                ?
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                                        {order.customerName}
                                    </TableCell>
                                    <TableCell className="cursor-pointer" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                                        <Badge variant={getStatusVariant(order.orderStatus)}>
                                            {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="cursor-pointer" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                                        {new Date(order.orderDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs hidden md:table-cell cursor-pointer" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                                        {order.transactionId}
                                    </TableCell>
                                    <TableCell className="text-right cursor-pointer" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                                        ${order.totalAmount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => router.push(`/dashboard/orders/${order.id}`)}>View Details</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={(e) => handleDeleteClick(e, order)} className="text-destructive">
                                                        Delete Order
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            {(!isLoading && orders?.length === 0) && (
                <CardFooter className="flex justify-center border-t p-4">
                    <div className="text-center">
                        <h3 className="font-semibold">You have no orders</h3>
                        <p className="text-sm text-muted-foreground">When a customer places an order, it will appear here.</p>
                        <Button className="mt-4" size="sm" asChild variant="secondary">
                            <Link href="/dashboard/products">
                                View Products
                            </Link>
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
        <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the order
                        #{orderToDelete?.id.substring(0,7)} and all of its data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? 'Deleting...' : 'Delete Order'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
