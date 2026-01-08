
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCustomer } from '@/context/customer-context';

export default function StoreProfilePage() {
    const { user, customer, isCustomerLoading } = useCustomer();
    const params = useParams();
    const router = useRouter();
    const businessId = params.businessId as string;
    
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>My Profile</CardTitle>
                    <CardDescription>View your account information for this store.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isCustomerLoading ? (
                        <>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                             <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </>
                    ) : customer && user ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" value={customer.username} readOnly disabled />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={user.email || ''} readOnly disabled />
                            </div>
                        </>
                    ) : (
                       <div className="text-center py-4">
                         <p className="text-muted-foreground">You must be logged in to view your profile.</p>
                         <Button className="mt-4" onClick={() => router.push(`/store/${businessId}/login?redirect=/store/${businessId}/profile`)}>
                            Login
                         </Button>
                       </div> 
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
