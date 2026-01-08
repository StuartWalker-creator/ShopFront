
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import { useCart } from '@/context/cart-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCustomer } from '@/context/customer-context';

export function CartSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, isCartLoading } = useCart();
  const { customer } = useCustomer();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const businessId = params.businessId as string;
  const placeholderImage = PlaceHolderImages.find(img => img.id === 'product-placeholder');


  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  const handleCheckout = () => {
    if (!customer) {
        toast({
            title: "Please login to continue",
            description: "You need to be logged in to proceed to checkout.",
            variant: "destructive",
        });
        onOpenChange(false); // Close the cart
        router.push(`/store/${businessId}/login?redirect=/store/${businessId}/checkout`);
    } else {
        onOpenChange(false);
        router.push(`/store/${businessId}/checkout`);
    }
  }

  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Shopping Cart ({totalItems})</SheetTitle>
        </SheetHeader>
        <Separator />
        {isCartLoading ? (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : cartItems.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <h3 className="text-xl font-semibold">Your cart is empty</h3>
                    <p className="text-muted-foreground mt-2">Add some products to get started.</p>
                </div>
            </div>
        ) : (
        <>
            <ScrollArea className="flex-1">
            <div className="flex flex-col gap-6 p-6">
                {cartItems.map((item) => {
                    const imageUrl = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : placeholderImage?.imageUrl;
                    return (
                    <div key={item.id} className="flex items-start gap-4">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                        {imageUrl ? (
                            <Image
                            src={imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            />
                        ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">?</div>
                        )}
                        </div>
                        <div className="flex-1">
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                            <Minus className="h-3 w-3" />
                            </Button>
                            <span>{item.quantity}</span>
                            <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                            <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                        </div>
                        <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                        >
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )})}
            </div>
            </ScrollArea>
            <SheetFooter className="p-6 pt-4 bg-card border-t mt-auto">
                <div className="w-full space-y-4">
                    <div className="flex justify-between font-semibold">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Shipping and taxes will be calculated at checkout.
                    </p>
                    <Button className="w-full" size="lg" onClick={handleCheckout}>Checkout</Button>
                    <Button variant="outline" className="w-full" onClick={clearCart}>Clear Cart</Button>
                </div>
            </SheetFooter>
        </>
        )}
      </SheetContent>
    </Sheet>
  );
}
