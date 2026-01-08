
"use client";

import React, { useState } from 'react';
import { MoreHorizontal, PlusCircle } from "lucide-react"
import Link from "next/link"
import Image from 'next/image';
import { collection, query, doc, deleteDoc } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { useBusiness } from '@/context/business-context';
import { PLAN_LIMITS } from '@/lib/plan-limits';
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
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
import { UpgradeDialog } from '@/components/dashboard/upgrade-dialog';


interface Product {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
    price: number;
    createdAt: string;
    imageUrls: string[];
    businessId: string;
}

export default function ProductsPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { business, productCount, plan, isBusinessLoading } = useBusiness();
    const businessId = business?.id;
    
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(
            collection(firestore, 'businesses', businessId, 'products'),
        );
    }, [firestore, businessId]);

    const { data: products, isLoading: areProductsLoading, error } = useCollection<Product>(productsQuery);

    const handleDelete = async () => {
        if (!productToDelete || !businessId || !firestore) return;
        setIsDeleting(true);
        try {
            const productRef = doc(firestore, 'businesses', businessId, 'products', productToDelete.id);
            await deleteDoc(productRef);
            toast({
                title: "Product Deleted",
                description: `"${productToDelete.title}" has been successfully deleted.`,
            });
        } catch (error: any) {
            console.error("Error deleting product:", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: error.message || "Could not delete product. Please try again.",
            });
        } finally {
            setIsDeleting(false);
            setProductToDelete(null);
        }
    };


    const getStatusVariant = (status: Product['status']) => {
        switch (status) {
            case 'published':
                return 'default';
            case 'draft':
                return 'secondary';
            case 'archived':
                return 'outline';
            default:
                return 'default';
        }
    };
    
    const isLoading = isBusinessLoading || areProductsLoading;

    const canAddProduct = plan ? productCount < PLAN_LIMITS[plan.id as keyof typeof PLAN_LIMITS].products : false;

    const handleAddProductClick = () => {
        if (canAddProduct) {
            router.push('/dashboard/products/add');
        } else {
            setIsUpgradeDialogOpen(true);
        }
    };

    return (
        <>
        <UpgradeDialog
            isOpen={isUpgradeDialogOpen}
            onOpenChange={setIsUpgradeDialogOpen}
            featureName="more products"
            requiredPlan="Standard"
        />
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>
                        Manage your products. You have created {productCount} / {plan ? PLAN_LIMITS[plan.id as keyof typeof PLAN_LIMITS].products : '...'} products.
                    </CardDescription>
                </div>
                <Button size="sm" className="gap-1" onClick={handleAddProductClick}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Product
                    </span>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">
                                <span className="sr-only">Image</span>
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="hidden md:table-cell">Created at</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="hidden sm:table-cell">
                                        <Skeleton className="h-16 w-16 rounded-md" />
                                    </TableCell>
                                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-destructive">
                                    Error loading products: {error.message}
                                </TableCell>
                            </TableRow>
                        ) : products && products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products && products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        {(product.imageUrls && product.imageUrls.length > 0) ? (
                                            <Image
                                                alt={product.title}
                                                className="aspect-square rounded-md object-cover"
                                                height="64"
                                                src={product.imageUrls[0]}
                                                width="64"
                                            />
                                        ): (
                                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                                No Image
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{product.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(product.status)}>
                                            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>${product.price.toFixed(2)}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {new Date(product.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/products/edit/${product.id}`}>Edit</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setProductToDelete(product)} className="text-destructive">
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            {(!isLoading && products?.length === 0) && (
                 <CardFooter className="flex justify-center border-t p-4">
                    <div className="text-center">
                        <h3 className="font-semibold">No Products Yet</h3>
                        <p className="text-sm text-muted-foreground">Get started by adding your first product.</p>
                        <Button className="mt-4" size="sm" onClick={handleAddProductClick}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Add Product
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
        <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the product &quot;{productToDelete?.title}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProductToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    