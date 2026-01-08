
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCart } from '@/context/cart-context';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
//import { createOrder } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Truck, Wallet, Landmark } from 'lucide-react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import type { Business } from '../page';
import { useCustomer } from '@/context/customer-context';

const formSchema = z.object({
    customerName: z.string().min(2, { message: "Name must be at least 2 characters." }),
    phone: z.string().min(10, { message: "Please enter a valid phone number." }),
    deliveryAddress: z.string().optional(),
    fulfillmentMethod: z.enum(['delivery', 'pickup'], { required_error: "Please select a fulfillment method." }),
    paymentMethod: z.enum(['online', 'on_delivery'], { required_error: "Please select a payment method." })
}).superRefine((data, ctx) => {
    if (data.fulfillmentMethod === 'delivery') {
        if (!data.deliveryAddress || data.deliveryAddress.length < 10) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['deliveryAddress'],
                message: "Please enter a valid delivery address.",
            });
        }
    }
});

type FormData = z.infer<typeof formSchema>;

const calculateDistance = (address1: string, address2: string): number => {
    // This is a placeholder. In a real application, you would use a mapping service API.
    // For now, we'll return a static distance for demonstration.
    console.log(`Calculating distance between "${address1}" and "${address2}"`);
    return 10;
};

export default function CheckoutForm({ business }: { business: Business }) {
    const { cartItems, clearCart } = useCart();
    const { user, customer, isCustomerLoading } = useCustomer();
    const router = useRouter();
    const params = useParams();
    const businessId = params.businessId as string;
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    
    const fulfillmentOptions = business.fulfillment;

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            customerName: customer?.username || "",
            phone: "",
            deliveryAddress: "",
        },
    });

     useEffect(() => {
        if (fulfillmentOptions) {
            const hasDelivery = fulfillmentOptions.delivery?.enabled;
            const hasPickup = fulfillmentOptions.pickup?.enabled;
            const currentMethod = form.getValues('fulfillmentMethod');

            // Set default fulfillment method only if not already set or if current is invalid
            if (!currentMethod || (currentMethod === 'delivery' && !hasDelivery) || (currentMethod === 'pickup' && !hasPickup)) {
                if (hasDelivery) {
                    form.setValue('fulfillmentMethod', 'delivery');
                } else if (hasPickup) {
                    form.setValue('fulfillmentMethod', 'pickup');
                }
            }

            const hasPayOnline = fulfillmentOptions.payment?.payOnline?.enabled;
            const hasPayOnDelivery = fulfillmentOptions.payment?.payOnDelivery?.enabled;
            const currentPayment = form.getValues('paymentMethod');
            
             // Set default payment method only if not already set or if current is invalid
            if (!currentPayment || (currentPayment === 'online' && !hasPayOnline) || (currentPayment === 'on_delivery' && !hasPayOnDelivery)) {
                if (hasPayOnline) {
                    form.setValue('paymentMethod', 'online');
                } else if (hasPayOnDelivery) {
                    form.setValue('paymentMethod', 'on_delivery');
                }
            }
        }
    }, [fulfillmentOptions, form]);


    useEffect(() => {
        if (customer) {
            form.setValue('customerName', customer.username);
        }
    }, [customer, form]);

    const fulfillmentMethod = form.watch('fulfillmentMethod');
    const deliveryAddress = form.watch('deliveryAddress');
    
    const [shippingCost, setShippingCost] = useState(0);

    useEffect(() => {
        if (fulfillmentMethod === 'delivery' && deliveryAddress && deliveryAddress.length > 10) {
            const distance = calculateDistance(business?.businessAddress || '', deliveryAddress);
            const fee = distance * (fulfillmentOptions?.delivery?.feePerMile || 0);
            setShippingCost(fee);
        } else {
            setShippingCost(0);
        }
    }, [fulfillmentMethod, deliveryAddress, fulfillmentOptions?.delivery?.feePerMile, business?.businessAddress]);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    const total = subtotal + shippingCost;
    
async function placeOrder(transactionId?: string) {
      setIsProcessing(true)

        const payload = {
            businessId,
                customerId: user!.uid,
                customerName:form.getValues('customerName'),
                    fulfillmentMethod: form.getValues('fulfillmentMethod'),
                        paymentMethod: form.getValues('paymentMethod'),
                            transactionId
                              }
console.error('Sending payload to the server')
                                const res = await fetch('/api/v1/business-domain/orders', {
                                    method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload)
                                              })

                                                const result = await res.json()
console.error("request finished, response goteen")
                                                  if (result.success) {
                                                      clearCart()
                                                          router.replace(`/store/${businessId}/orders`)
                                                            } else {
                                                                console.error("result: ",result,"  error: ",result.error)
                                                                setIsProcessing(false)
                                                                    toast({
                                                                          variant: 'destructive',
                                                                                title: 'Order failed',
                                                                                      description: result.error
                                                                                          })
                                                                                            }
                                                                                            }


    const flutterwaveConfig = {
        public_key: business.flutterwavePublicKey || '',
        tx_ref: `shopfront-${Date.now()}`,
        amount: total,
        currency: 'UGX',
        payment_options: 'card,mobilemoneyuganda,ussd',
        customer: {
          email: user?.email || '',
          phone_number: form.getValues('phone'),
          name: form.getValues('customerName'),
        },
        customizations: {
          title: `${business.name || 'ShopFront'} Purchase`,
          description: `Payment for items from your cart`,
          
        },
        redirect_url: `${window.location.origin}/payment/callback`
    };
    
    const handleFlutterwavePayment = useFlutterwave(flutterwaveConfig);

    function onSubmit(data: FormData) {
        if (!user || !businessId) {
            toast({ variant: 'destructive', title: "Error", description: "Could not place order. Please try again." });
            return;
        }

        if (data.paymentMethod === 'online') {
            if (!business.flutterwavePublicKey) {
                toast({
                    variant: 'destructive',
                    title: "Online Payments Unavailable",
                    description: "This store has not configured online payments yet. Please select another payment method or contact the store owner.",
                });
                return;
            }

            handleFlutterwavePayment({
                callback: (response) => {
                   if (response.status === 'successful') {
                       placeOrder(response.transaction_id!.toString());
                   } else {
                       toast({
                           variant: 'destructive',
                           title: "Payment Failed",
                           description: "Your payment was not successful. Please try again.",
                       });
                   }
                   closePaymentModal(); // 🔑 Close the modal regardless of status
                },
                onClose: () => {
                    // This is called if the user closes the modal without paying.
                    // We don't need to do anything here, but the function must be provided.
                },
            });
        } else {
            placeOrder();
        }
    }

    useEffect(() => {
        if (!isCustomerLoading && !customer) {
            router.push(`/store/${businessId}/login?redirect=/store/${businessId}/checkout`);
        }
    }, [customer, isCustomerLoading, router, businessId]);

    const isLoading = isCustomerLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-14rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (cartItems.length === 0 && !isCustomerLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-14rem)]">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold">Your Cart is Empty</h2>
                    <p className="text-muted-foreground mt-2">Add items to your cart to proceed to checkout.</p>
                    <Button className="mt-4" onClick={() => router.push(`/store/${businessId}`)}>Continue Shopping</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="grid lg:grid-cols-[1fr_0.75fr] gap-12">
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>1. Contact Information</CardTitle></CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="customerName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl><Input placeholder="0771234567" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                    </Card>
                    
                    <Card>
                         <CardHeader><CardTitle>2. Fulfillment Method</CardTitle></CardHeader>
                         <CardContent>
                            <FormField
                                control={form.control}
                                name="fulfillmentMethod"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} value={field.value} className="grid sm:grid-cols-2 gap-4">
                                                {fulfillmentOptions?.delivery?.enabled && (
                                                    <FormItem>
                                                        <FormControl>
                                                            <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                                                        </FormControl>
                                                        <Label htmlFor="delivery" className={`rounded-lg border p-4 flex flex-col gap-2 cursor-pointer hover:border-primary ${field.value === 'delivery' ? 'border-primary ring-2 ring-primary' : ''}`}>
                                                            <div className="flex items-center gap-2 font-semibold"><Truck /> Delivery</div>
                                                            <p className="text-sm text-muted-foreground">Get your order shipped to your address.</p>
                                                        </Label>
                                                    </FormItem>
                                                )}
                                                {fulfillmentOptions?.pickup?.enabled && (
                                                    <FormItem>
                                                        <FormControl>
                                                            <RadioGroupItem value="pickup" id="pickup" className="sr-only"/>
                                                        </FormControl>
                                                        <Label htmlFor="pickup" className={`rounded-lg border p-4 flex flex-col gap-2 cursor-pointer hover:border-primary ${field.value === 'pickup' ? 'border-primary ring-2 ring-primary' : ''}`}>
                                                            <div className="flex items-center gap-2 font-semibold"><Package /> In-Store Pickup</div>
                                                            <p className="text-sm text-muted-foreground">Pick up from: {fulfillmentOptions.pickup.address || business.businessAddress}</p>
                                                        </Label>
                                                    </FormItem>
                                                )}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                         </CardContent>
                    </Card>
                   
                    {fulfillmentMethod === 'delivery' && (
                         <Card>
                            <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Delivery Address</FormLabel>
                                        <FormControl><Input placeholder="e.g., Plot 123, Main Street, Kampala" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <p className="text-xs text-muted-foreground">
                                    The delivery fee will be calculated based on the distance from our store.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    
                    <Card>
                         <CardHeader><CardTitle>3. Payment Method</CardTitle></CardHeader>
                         <CardContent>
                            <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} value={field.value} className="grid sm:grid-cols-2 gap-4">
                                                {fulfillmentOptions?.payment?.payOnline?.enabled && (
                                                    <FormItem>
                                                        <FormControl>
                                                            <RadioGroupItem value="online" id="online" className="sr-only" />
                                                        </FormControl>
                                                        <Label htmlFor="online" className={`rounded-lg border p-4 flex flex-col gap-2 cursor-pointer hover:border-primary ${field.value === 'online' ? 'border-primary ring-2 ring-primary' : ''}`}>
                                                            <div className="flex items-center gap-2 font-semibold"><Wallet /> Pay Now</div>
                                                            <p className="text-sm text-muted-foreground">Pay with Card or Mobile Money.</p>
                                                        </Label>
                                                    </FormItem>
                                                )}
                                                {fulfillmentOptions?.payment?.payOnDelivery?.enabled && (
                                                    <FormItem>
                                                        <FormControl>
                                                            <RadioGroupItem value="on_delivery" id="on_delivery" className="sr-only"/>
                                                        </FormControl>
                                                        <Label htmlFor="on_delivery" className={`rounded-lg border p-4 flex flex-col gap-2 cursor-pointer hover:border-primary ${field.value === 'on_delivery' ? 'border-primary ring-2 ring-primary' : ''}`}>
                                                            <div className="flex items-center gap-2 font-semibold"><Landmark /> Pay on Delivery/Pickup</div>
                                                            <p className="text-sm text-muted-foreground">Pay with cash when you receive your order.</p>
                                                        </Label>
                                                    </FormItem>
                                                )}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                         </CardContent>
                    </Card>
                    
                    <div>
                        <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isProcessing ? 'Placing Order...' : `Place Order - UGX ${total.toLocaleString()}`}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-2">
                            You will be required to confirm the reception of your order manually on your orders page.
                        </p>
                    </div>
                </form>
            </Form>

            <div className="space-y-6 lg:sticky lg:top-24 self-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="relative h-16 w-16 rounded-md border overflow-hidden">
                                        <Image src={item.imageUrls[0]} alt={item.title} fill className="object-cover" />
                                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">{item.quantity}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium truncate">{item.title}</p>
                                    </div>
                                    <p className="font-medium">UGX {(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="space-y-2 text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>UGX {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>{shippingCost > 0 ? `UGX ${shippingCost.toLocaleString()}` : 'Free'}</span>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>UGX {total.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
