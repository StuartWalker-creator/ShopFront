
'use client';

import React from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    features: string[];
}

export function PricingSection() {
    const firestore = useFirestore();
    const subscriptionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'subscriptions'), orderBy('price'));
    }, [firestore]);

    const { data: pricingPlans, isLoading, error } = useCollection<SubscriptionPlan>(subscriptionsQuery);

  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
            Simple Pricing for Every Business Size
          </h2>
          <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Choose the plan that&apos;s right for you and start selling today.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="flex flex-col">
                    <CardHeader><Skeleton className="h-6 w-24" /><Skeleton className="h-10 w-32 mt-2" /></CardHeader>
                    <CardContent className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))
          ) : error ? (
            <p className="col-span-full text-destructive">Could not load pricing plans. Please try again later.</p>
          ) : pricingPlans?.length === 0 ? (
             <p className="col-span-full text-muted-foreground">No pricing plans available at the moment.</p>
          ) : (
            pricingPlans?.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col text-left ${
                plan.id === 'standard' ? "border-primary ring-2 ring-primary" : ""
              }`}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold text-foreground">
                    ${plan.price}
                  </span>
                  /month
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full"
                  variant={plan.id === 'standard' ? "default" : "secondary"}
                >
                  <Link href={`/signup?plan=${plan.id}`}>Choose Plan</Link>
                </Button>
              </CardFooter>
            </Card>
          )))}
        </div>
      </div>
    </section>
  );
}
