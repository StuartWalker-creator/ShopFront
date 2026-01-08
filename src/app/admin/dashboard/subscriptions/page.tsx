
'use client';

import React from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle } from 'lucide-react';

interface Subscription {
    id: string;
    name: string;
    price: number;
    features: string[];
}

export default function SubscriptionsPage() {
    const firestore = useFirestore();

    const subscriptionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'subscriptions'), orderBy('price'));
    }, [firestore]);

    const { data: subscriptions, isLoading, error } = useCollection<Subscription>(subscriptionsQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Subscriptions</CardTitle>
                <CardDescription>View and manage all available subscription plans.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Card key={index} className="flex flex-col">
                                <CardHeader>
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-10 w-32 mt-2" />
                                </CardHeader>
                                <CardContent className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <p className="text-destructive">Error loading subscriptions: {error.message}</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {subscriptions?.map(plan => (
                            <Card key={plan.id} className={`flex flex-col ${plan.id === 'standard' ? "border-primary ring-2 ring-primary" : ""}`}>
                                <CardHeader>
                                    <CardTitle>{plan.name}</CardTitle>
                                    <CardDescription>
                                        <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                                        /month
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <ul className="space-y-2 text-sm">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
                 {(!isLoading && subscriptions?.length === 0) && (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No subscription plans found in the database.</p>
                        <p className="text-xs text-muted-foreground mt-2">Go to your Firestore database and add documents to the 'subscriptions' collection.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
