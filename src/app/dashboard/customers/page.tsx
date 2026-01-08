
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from "lucide-react";
import { collection, query } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useBusinessId } from '@/hooks/use-business-id';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';


interface Customer {
    id: string;
    username: string;
    email: string;
    createdAt: string;
}

export default function CustomersPage() {
    const firestore = useFirestore();
    const { businessId, isLoading: isBusinessIdLoading } = useBusinessId();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    
    const customersQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(
            collection(firestore, 'businesses', businessId, 'customers'),
        );
    }, [firestore, businessId]);

    const { data: customers, isLoading: areCustomersLoading, error } = useCollection<Customer>(customersQuery);

    const getInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const isLoading = isBusinessIdLoading || areCustomersLoading;

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Customers</CardTitle>
                    <CardDescription>View and manage your customer base.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="hidden md:table-cell">Date Joined</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-40" /></TableCell>
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
                                    <TableCell colSpan={4} className="h-24 text-center text-destructive">
                                        Error loading customers: {error.message}
                                    </TableCell>
                                </TableRow>
                            ) : customers && customers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No customers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customers && customers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">
                                          <div className="flex items-center gap-3">
                                              <Avatar className="hidden h-9 w-9 sm:flex">
                                                  {/* Using a consistent seed for avatar placeholders */}
                                                  <AvatarImage src={`https://picsum.photos/seed/${customer.id}/36/36`} alt={customer.username} />
                                                  <AvatarFallback>{getInitials(customer.username)}</AvatarFallback>
                                              </Avatar>
                                              {customer.username}
                                          </div>
                                        </TableCell>
                                        <TableCell>{customer.email}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {new Date(customer.createdAt).toLocaleDateString()}
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
                                                        <DropdownMenuItem onSelect={() => setSelectedCustomer(customer)}>View Details</DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/orders?customerId=${customer.id}`}>View Orders</Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                 {(!isLoading && customers?.length === 0) && (
                     <CardFooter className="flex justify-center border-t p-4">
                        <div className="text-center">
                            <h3 className="font-semibold">No Customers Yet</h3>
                            <p className="text-sm text-muted-foreground">When customers sign up for your store, they will appear here.</p>
                        </div>
                    </CardFooter>
                )}
            </Card>
            <Dialog open={!!selectedCustomer} onOpenChange={(isOpen) => !isOpen && setSelectedCustomer(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Customer Details</DialogTitle>
                        <DialogDescription>
                            Information for customer: {selectedCustomer?.username}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCustomer && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="username" className="text-right">Username</Label>
                                <Input id="username" value={selectedCustomer.username} readOnly className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" value={selectedCustomer.email} readOnly className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="joined" className="text-right">Joined</Label>
                                <Input id="joined" value={new Date(selectedCustomer.createdAt).toLocaleString()} readOnly className="col-span-3" />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setSelectedCustomer(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
