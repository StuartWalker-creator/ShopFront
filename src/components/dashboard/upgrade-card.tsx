
"use client";

import React, { useState } from 'react';
import { useFirestore } from "@/firebase";
import { useBusiness } from '@/context/business-context';
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function UpgradeCard() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { business, subscriptions, isBusinessLoading } = useBusiness();
    const [isUpgrading, setIsUpgrading] = useState(false);
    
    if (isBusinessLoading || !business || !subscriptions || subscriptions.length === 0) {
        return null; // Don't render if loading or no data
    }

    const currentPlanIndex = subscriptions.findIndex(p => p.id === business.subscriptionId);
    
    if (currentPlanIndex === -1 || currentPlanIndex === subscriptions.length - 1) {
        return null; // User is on an unknown plan or the highest plan
    }

    const nextPlan = subscriptions[currentPlanIndex + 1];
    if (!nextPlan) return null;

    const handleUpgrade = async () => {
        if (!business || !firestore) return;
        const businessRef = doc(firestore, 'businesses', business.id);

        setIsUpgrading(true);
        try {
            await updateDoc(businessRef, {
                subscriptionId: nextPlan.id
            });
            toast({
                title: "Upgrade Successful!",
                description: `Your plan has been upgraded to ${nextPlan.name}.`,
            });
        } catch (error: any) {
            console.error("Failed to upgrade plan:", error);
            toast({
                variant: "destructive",
                title: "Upgrade Failed",
                description: error.message || "Could not upgrade your plan. Please try again.",
            });
        } finally {
            setIsUpgrading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Upgrade to {nextPlan.name}</CardTitle>
                <CardDescription>
                    Unlock more features and take your business to the next level.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full" onClick={handleUpgrade} disabled={isUpgrading}>
                    {isUpgrading ? 'Upgrading...' : 'Upgrade'}
                </Button>
            </CardContent>
        </Card>
    );
}
