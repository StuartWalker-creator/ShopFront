
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from 'react';
import {
  Bell,
  Home,
  LineChart,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { useAuth } from "@/firebase";
import { ThemeToggle } from "@/components/theme-toggle";
import { BusinessProvider, useBusiness } from '@/context/business-context';
import { UpgradeCard } from "@/components/dashboard/upgrade-card";

const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/dashboard/products", icon: Package, label: "Products" },
    { href: "/dashboard/customers", icon: Users, label: "Customers" },
    { href: "/dashboard/analytics", icon: LineChart, label: "Analytics" },
    { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  ];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const auth = useAuth();
    const router = useRouter();
    const { business } = useBusiness();

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleLogout = async () => {
        if (auth) {
        await auth.signOut();
        router.push('/');
        }
    };
    
    if (!business) {
         return (
            <div className="flex items-center justify-center min-h-screen">
                <Icons.logo className="h-16 w-16 text-primary animate-pulse" />
            </div>
        );
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="">{business?.name || 'ShopFront'}</span>
                </Link>
                <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Toggle notifications</span>
                </Button>
                </div>
                <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                        pathname === item.href ? "bg-muted text-primary" : ""
                        }`}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                    ))}
                </nav>
                </div>
                <div className="mt-auto p-4">
                <UpgradeCard />
                </div>
            </div>
            </div>
            <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                <Sheet>
                <SheetTrigger asChild>
                    <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                    >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <nav className="grid gap-2 text-lg font-medium">
                    <Link
                        href="#"
                        className="flex items-center gap-2 text-lg font-semibold mb-4"
                    >
                        <Icons.logo className="h-6 w-6 text-primary" />
                        <span className="">{business?.name || 'ShopFront'}</span>
                    </Link>
                    {navItems.map((item) => (
                        <Link
                        key={item.label}
                        href={item.href}
                        className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${
                            pathname === item.href ? "bg-muted text-foreground" : ""
                        }`}
                        >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                        </Link>
                    ))}
                    </nav>
                    <div className="mt-auto">
                    <UpgradeCard />
                    </div>
                </SheetContent>
                </Sheet>
                <div className="w-full flex-1">
                {/* Can add a search bar here if needed */}
                </div>
                <ThemeToggle />
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar>
                        <>
                            <AvatarImage src={business?.logoUrl || undefined} alt={business?.name} />
                            <AvatarFallback>{business?.name ? getInitials(business.name) : 'JD'}</AvatarFallback>
                        </>
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="w-full cursor-pointer">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
                {children}
            </main>
            </div>
        </div>
    )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <BusinessProvider>
            <DashboardLayoutContent>
                {children}
            </DashboardLayoutContent>
        </BusinessProvider>
    );
}
