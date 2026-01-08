
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import React from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useCustomer } from "@/context/customer-context";

interface OrderItem {
    productId: string;
    title: string;
    quantity: number;
    price: number;
    imageUrls?: string[];
}

interface Order {
    id: string;
    orderDate: string;
    orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    totalAmount: number;
    items: OrderItem[];
}

export default function StoreOrdersPage() {
    const params = useParams();
    const router = useRouter();
    const businessId = params.businessId as string;
    const { user, isCustomerLoading } = useCustomer();
    const firestore = useFirestore();
    const placeholderImage = PlaceHolderImages.find(img => img.id === 'product-placeholder');

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'businesses', businessId, 'orders'),
            where('customerId', '==', user.uid),
            orderBy('orderDate', 'desc')
        );
    }, [firestore, user, businessId]);

    const { data: orders, isLoading: areOrdersLoading, error } = useCollection<Order>(ordersQuery);
    
    // Redirect to login if auth is checked and there's no user.
    React.useEffect(() => {
        if (!isCustomerLoading && !user) {
            router.push(`/store/${businessId}/login?redirect=/store/${businessId}/orders`);
        }
    }, [isCustomerLoading, user, router, businessId]);
    
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

    const isLoading = isCustomerLoading || areOrdersLoading;

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Orders</CardTitle>
                    <CardDescription>View the history of all your orders from this store.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                  <span className="sr-only">Image</span>
                                </TableHead>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-destructive">
                                       There was an error loading your orders. Please try again later.
                                    </TableCell>
                                </TableRow>
                            ) : orders && orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        You haven't placed any orders yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders?.map(order => {
                                    const imageUrl = (order.items && order.items.length > 0 && order.items[0].imageUrls && order.items[0].imageUrls[0]) ? order.items[0].imageUrls[0] : placeholderImage?.imageUrl;

                                    return (
                                    <TableRow 
                                      key={order.id} 
                                      className="cursor-pointer" 
                                      onClick={() => router.push(`/store/${businessId}/orders/${order.id}`)}
                                    >
                                        <TableCell className="hidden sm:table-cell">
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
                                        <TableCell className="font-mono text-sm">#{order.id.substring(0, 7)}</TableCell>
                                        <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(order.orderStatus)}>
                                                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">UGX {order.totalAmount.toLocaleString()}</TableCell>
                                    </TableRow>
                                )})
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                {(!isLoading && orders?.length === 0) && (
                     <CardFooter className="flex justify-center border-t p-4">
                        <Button asChild>
                            <Link href={`/store/${businessId}`}>Start Shopping</Link>
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
