
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const plan = searchParams.get('plan');

  useEffect(() => {
    if (!plan) {
      toast({
        variant: "default",
        title: "No Plan Selected",
        description: "Please choose a plan to get started.",
      });
      router.push('/#pricing');
    }
  }, [plan, router, toast]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    if (!plan) {
        toast({
            variant: "destructive",
            title: "No Plan Selected",
            description: "Please select a subscription plan to continue.",
        });
        router.push('/#pricing');
        return;
    }

    setIsSigningUp(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        const businessName = `${firstName}'s Store`;
        const businessId = user.uid; // Use user's UID for business ID
        
        const businessData = {
          id: businessId,
          name: businessName,
          ownerId: user.uid,
          description: 'A new ShopFront store.',
          contactInfo: user.email,
          subscriptionId: plan,
          tagline: "High-quality products, just for you!",
          logoUrl: null,
        };
        const businessRef = doc(firestore, 'businesses', businessId);
        
        await setDoc(businessRef, businessData);
        
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Coming soon!",
      description: "Google Sign-Up is not yet available.",
    });
  };

  if (!plan) {
    // This will show a loading/redirecting state briefly before the useEffect hook redirects.
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
             <Card className="mx-auto max-w-sm w-full">
                <CardHeader>
                    <CardTitle>Redirecting...</CardTitle>
                    <CardDescription>No plan selected. Redirecting to pricing page.</CardDescription>
                </CardHeader>
             </Card>
        </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Icons.logo className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl">ShopFront</span>
          </Link>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            You&apos;re signing up for the <span className="font-bold capitalize">{plan}</span> plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input 
                    id="first-name" 
                    placeholder="Max" 
                    required 
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    disabled={isSigningUp}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input 
                    id="last-name" 
                    placeholder="Robinson" 
                    required 
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    disabled={isSigningUp}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isSigningUp}
                />
              </div>
              <div className="grid gap-2 relative">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSigningUp}
                />
                 <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-1 right-1 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSigningUp}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>
              <Button type="submit" className="w-full" disabled={isSigningUp}>
                {isSigningUp ? 'Creating Account...' : 'Create an account'}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isSigningUp}>
                Sign up with Google
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
