
'use client';

import Link from 'next/link';
import { ShoppingCart, User as UserIcon, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { CartSheet } from '@/components/store/cart-sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { getAuth, signOut } from 'firebase/auth';
import type { Business } from './page';
import type { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchOverlay } from '@/components/store/search-overlay';
import { ProductSearchProvider, useProductSearch } from '@/context/product-search-context';
import { Icons } from '@/components/icons';
import { useCustomer } from '@/context/customer-context';


function SearchLoadingOverlay({ business }: { business: Business }) {
  const { isSearching } = useProductSearch();

  if (!isSearching) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/50 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {business.logoUrl ? (
          <Avatar className="h-20 w-20 animate-pulse">
            <AvatarImage src={business.logoUrl} alt={business.name} />
            <AvatarFallback>{business.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
        ) : (
          <Icons.logo className="h-20 w-20 text-primary animate-pulse" />
        )}
        <p className="text-muted-foreground">Searching...</p>
      </div>
    </div>
  );
}


function StoreHeader({ business }: { business: Business }) {
    const params = useParams();
    const businessId = params.businessId as string;
    const router = useRouter();
    const { cartItems } = useCart();
    const { customer, isCustomerLoading } = useCustomer();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);


    const getInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleLogout = async () => {
        const auth = getAuth();
        await signOut(auth);
        router.refresh();
    };

    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <>
            <header className="px-4 lg:px-6 h-16 flex items-center bg-card border-b sticky top-0 z-40 gap-4">
                <Link href={`/store/${businessId}`} className="flex items-center gap-2 md:gap-4 shrink-0">
                    <Avatar>
                        <AvatarImage src={business.logoUrl || undefined} />
                        <AvatarFallback>{getInitials(business.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-xl font-headline hidden sm:block">
                        {business.name}
                    </span>
                </Link>
                
                <div className="w-full flex-1 flex justify-center">
                    <Button 
                        variant="outline" 
                        className="w-full md:w-2/3 lg:w-1/2 justify-start text-muted-foreground font-normal"
                        onClick={() => setIsSearchOpen(true)}
                    >
                        <Search className="h-4 w-4 mr-2" />
                        Search products...
                    </Button>
                </div>

                <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <Button variant="ghost" size="icon" className='relative' onClick={() => setIsCartOpen(true)}>
                        <ShoppingCart className="h-5 w-5" />
                        {cartItemCount > 0 && (
                            <span className='absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center'>
                                {cartItemCount}
                            </span>
                        )}
                        <span className="sr-only">Cart</span>
                    </Button>
                    <ThemeToggle />
                    {isCustomerLoading ? (
                         <Skeleton className='h-9 w-20' />
                    ) : customer ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <UserIcon className="h-5 w-5" />
                                <span className="sr-only">Customer Menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href={`/store/${businessId}/orders`}>Orders</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href={`/store/${businessId}/profile`}>Profile</Link></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Logout</span>
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className='hidden sm:flex items-center gap-2'>
                            <Button variant="ghost" asChild size="sm">
                                <Link href={`/store/${businessId}/login`}>Login</Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href={`/store/${businessId}/signup`}>Sign Up</Link>
                            </Button>
                        </div>
                    )}
                </nav>
                 <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
                 <SearchOverlay isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
            </header>
        </>
    );
}

function HeroSection({ business }: { business: Business }) {
  if (!business.showHeroSection) {
    return null;
  }

  return (
    <section className="w-full relative bg-card border-b">
      <div className="absolute inset-0 z-0 opacity-20">
        {business.heroImageUrl && (
          <Image
            src={business.heroImageUrl}
            alt={business.name}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
      </div>
      <div className="container relative z-10 px-4 md:px-6 text-center py-12 md:py-20 lg:py-28">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline">
            {business.name}
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl font-body">
            {business.tagline}
          </p>
        </div>
      </div>
    </section>
  );
}


function StoreLayoutInternal({
  children,
  business,
}: {
  children: React.ReactNode;
  business: Business;
}) {

  useEffect(() => {
    const fontPair = business?.fontPair;
    if (!fontPair || !fontPair.headlineFont || !fontPair.bodyFont) return;

    const styleId = 'dynamic-font-style';
    const existingStyleTag = document.getElementById(styleId);
    if (existingStyleTag) {
        document.head.removeChild(existingStyleTag);
    }
    
    const style = document.createElement('style');
    style.id = styleId;

    const headlineFont = fontPair.headlineFont.replace(/ /g, '+');
    const bodyFont = fontPair.bodyFont.replace(/ /g, '+');

    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=${headlineFont}:wght@400;700&family=${bodyFont}:wght@400;500;700&display=swap');
      
      :root {
        --font-headline: '${fontPair.headlineFont}', sans-serif;
        --font-body: '${fontPair.bodyFont}', sans-serif;
      }
    `;

    document.head.appendChild(style);

    return () => {
      const styleTag = document.getElementById(styleId);
      if (styleTag) {
        document.head.removeChild(styleTag);
      }
    };
  }, [business?.fontPair]);

  return (
    <div className="flex flex-col min-h-screen font-body">
      <StoreHeader business={business} />
      <HeroSection business={business} />
      <main className="flex-1 bg-background">{children}</main>
      <SearchLoadingOverlay business={business} />
    </div>
  );
}

export function StoreLayoutClient({
  children,
  business,
  products
}: {
  children: React.ReactNode;
  business: Business;
  products: Product[];
}) {
  return (
    <ProductSearchProvider products={products}>
      <StoreLayoutInternal business={business}>
        {children}
      </StoreLayoutInternal>
    </ProductSearchProvider>
  );
}
