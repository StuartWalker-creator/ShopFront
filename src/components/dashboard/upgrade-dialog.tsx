
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

interface UpgradeDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    featureName: string;
    requiredPlan: string;
}

export function UpgradeDialog({ isOpen, onOpenChange, featureName, requiredPlan }: UpgradeDialogProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        onOpenChange(false);
        router.push('/dashboard/billing'); 
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upgrade Required</DialogTitle>
                    <DialogDescription>
                        To use the <span className="font-semibold">{featureName}</span> feature, you need to upgrade your plan.
                    </DialogDescription>
                </DialogHeader>
                <div className='py-4'>
                    <p>This feature is only available on the <span className="font-bold text-primary">{requiredPlan}</span> plan or higher. Upgrade your account to unlock this and many other powerful tools to grow your business.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleUpgrade}>
                        Upgrade Plan <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
