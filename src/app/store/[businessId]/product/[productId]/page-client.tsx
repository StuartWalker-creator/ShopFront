
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import type { Business } from '../../page';
import type { Product } from '@/types/product';

export default function ProductPageClient({ business, product }: { business: Business, product: Product }) {
    const { addToCart } = useCart();
    const { toast } = useToast();
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!api) return;
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    const handleAddToCart = () => {
        addToCart(product);
        toast({
            title: "Added to Cart",
            description: `"${product.title}" has been added to your cart.`,
        });
    };

    const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div className="md:sticky md:top-24 self-start">
                    <Carousel setApi={setApi} className="w-full">
                        <CarouselContent>
                            {product.imageUrls && product.imageUrls.length > 0 ? (
                                product.imageUrls.map((url, index) => (
                                    <CarouselItem key={index}>
                                        <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                                            <Image
                                                src={url}
                                                alt={`${product.title} image ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))
                            ) : (
                                <CarouselItem>
                                    <div className="aspect-square relative bg-muted rounded-lg flex items-center justify-center">
                                        <p className="text-muted-foreground">No Image Available</p>
                                    </div>
                                </CarouselItem>
                            )}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                    </Carousel>
                    <div className="py-2 text-center text-sm text-muted-foreground">
                        {product.imageUrls?.length > 1 ? `Image ${current} of ${count}` : ''}
                    </div>
                </div>

                <div className="flex flex-col justify-start">
                    {product.category && <p className="text-sm text-muted-foreground mb-2">{product.category}</p>}
                    <h1 className="text-3xl lg:text-4xl font-bold font-headline mb-4">{product.title}</h1>
                    
                    <div className="flex items-baseline gap-4 mb-6">
                        <p className={`font-bold text-3xl ${hasDiscount ? 'text-destructive' : ''}`}>
                            ${(hasDiscount ? product.discountedPrice : product.price)?.toFixed(2)}
                        </p>
                        {hasDiscount && (
                            <p className="text-lg text-muted-foreground line-through">
                                ${product.price.toFixed(2)}
                            </p>
                        )}
                    </div>
                    
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground mb-6 font-body">
                       <p>{product.description}</p>
                    </div>

                    <Button size="lg" onClick={handleAddToCart}>
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}
