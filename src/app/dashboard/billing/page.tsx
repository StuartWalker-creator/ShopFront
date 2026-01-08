
'use client';

import React, { useState } from 'react';
import { useBusiness } from '@/context/business-context';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BillingPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { business, plan: currentPlan, subscriptions, isBusinessLoading } = useBusiness();
    const [isSwitching, setIsSwitching] = useState(false);
    const [targetPlanId, setTargetPlanId] = useState<string | null>(null);

    const handleSwitchPlan = async (newPlanId: string) => {
        if (!business || !firestore || newPlanId === currentPlan?.id) return;
        
        setTargetPlanId(newPlanId);
        setIsSwitching(true);

        const businessRef = doc(firestore, 'businesses', business.id);

        try {
            await updateDoc(businessRef, { subscriptionId: newPlanId });
            toast({
                title: "Plan Changed Successfully!",
                description: `Your subscription has been updated.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to Change Plan",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsSwitching(false);
            setTargetPlanId(null);
        }
    };

    const isLoading = isBusinessLoading;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-5 w-1/2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}><CardHeader><Skeleton className="h-6 w-24" /><Skeleton className="h-10 w-32 mt-2" /></CardHeader><CardContent className="flex-1 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-3/4" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
                    ))}
                </div>
            </div>
        );
    }
    
    if (!currentPlan || !subscriptions) {
        return <p>Could not load subscription information.</p>
    }

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-2xl font-bold tracking-tight">Billing & Subscriptions</h1>
                <p className="text-muted-foreground">Manage your subscription plan and billing information.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {subscriptions.map(plan => {
                    const isCurrent = plan.id === currentPlan.id;
                    const isProcessing = isSwitching && targetPlanId === plan.id;
                    return (
                        <Card key={plan.id} className={`flex flex-col ${isCurrent ? "border-primary ring-2 ring-primary" : ""}`}>
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
                            <CardFooter>
                                <Button 
                                    className="w-full"
                                    variant={isCurrent ? "outline" : "default"}
                                    onClick={() => handleSwitchPlan(plan.id)}
                                    disabled={isSwitching}
                                >
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    {isCurrent ? "Current Plan" : isProcessing ? "Switching..." : "Switch to " + plan.name}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
