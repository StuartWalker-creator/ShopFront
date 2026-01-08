
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import type { Business } from './page';
import type { Product } from '@/types/product';
import { Star, X as XIcon } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useProductSearch } from '@/context/product-search-context';


function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const params = useParams();
  const businessId = params.businessId as string;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    addToCart(product);
    toast({
        title: "Added to Cart",
        description: `"${product.title}" has been added to your cart.`,
    })
  }

  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price - product.discountedPrice!) / product.price) * 100)
    : 0;

  const imageUrl = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : undefined;

  return (
    <Link href={`/store/${businessId}/product/${product.id}`} className="block group">
        <Card className="overflow-hidden flex flex-col h-full border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl">
        <div className="relative">
            {imageUrl ? (
                <Image src={imageUrl} alt={product.title} width={400} height={400} className="w-full h-auto aspect-square object-cover" />
            ) : (
                <div className="w-full h-auto aspect-square bg-muted flex items-center justify-center text-muted-foreground">No Image</div>
            )}
            {product.isFeatured && (
            <Badge className="absolute top-2 left-2" variant="default">
                <Star className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Featured</span>
            </Badge>
            )}
            {hasDiscount && <Badge className="absolute top-2 right-2" variant="destructive">-{discountPercentage}%</Badge>}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col justify-between bg-card">
            <div>
            <h3 className="font-semibold text-base md:text-lg truncate group-hover:text-primary transition-colors font-headline">{product.title}</h3>
            <div className="flex items-baseline gap-2">
                <p className={`font-bold text-xl ${hasDiscount ? 'text-destructive' : ''}`}>
                ${(hasDiscount ? product.discountedPrice : product.price)?.toFixed(2)}
                </p>
                {hasDiscount && (
                <p className="text-sm text-muted-foreground line-through">
                    ${product.price.toFixed(2)}
                </p>
                )}
            </div>
            {product.category && <p className="text-xs text-muted-foreground mt-1">{product.category}</p>}
            </div>
            <Button className="w-full mt-4 bg-primary" onClick={handleAddToCart}>Add to Cart</Button>
        </CardContent>
        </Card>
    </Link>
  );
}


function ProductGrid({ products }: { products: Product[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}

function ProductCarousel({ products }: { products: Product[] }) {
    return (
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {products.map((product) => (
              <CarouselItem key={product.id} className="basis-[65%] md:basis-1/2 lg:basis-1/3 xl:basis-1/4 pl-2">
                <div className="p-1 h-full">
                  <ProductCard product={product} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="ml-12 hidden sm:flex" />
          <CarouselNext className="mr-12 hidden sm:flex" />
        </Carousel>
    );
}

const ProductList = ({ products, layout }: { products: Product[], layout: Business['layout'] }) => {
    switch (layout) {
        case 'Carousel':
            return <ProductCarousel products={products} />;
        case 'Minimalist':
            return <ProductGrid products={products} />;
        case 'Grid':
        default:
            return <ProductGrid products={products} />;
    }
};


export default function StorePageClient({ business }: { business: Business }) {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const businessId = business.id;
    
    const { products, isLoading, error, searchQuery, setSearchQuery } = useProductSearch();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortOrder, setSortOrder] = useState('date-desc');
    
    useEffect(() => {
      const q = searchParams.get('q');
      setSearchQuery(q || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    useEffect(() => {
      const theme = business?.theme;
      if (!theme) return;
  
      const styleId = 'dynamic-theme-style';
      const existingStyleTag = document.getElementById(styleId);
      if (existingStyleTag) {
          document.head.removeChild(existingStyleTag);
      }
      
      const style = document.createElement('style');
      style.id = styleId;
      
      const createCssVariables = (palette: Omit<typeof theme, 'dark'>, selector: string) => {
        return `
          ${selector} {
            ${Object.entries(palette)
              .map(([key, value]) => {
                if (key === 'dark' || !value) return '';
                const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                return `${cssVar}: ${value};`;
              })
              .join('\n')}
          }
        `;
      };
  
      let cssText = createCssVariables(theme, ':root');
      if (theme.dark) {
        cssText += createCssVariables(theme.dark, '.dark');
      }
  
      style.innerHTML = cssText;
      document.head.appendChild(style);
  
      return () => {
          const styleTag = document.getElementById(styleId);
          if (styleTag) {
              document.head.removeChild(styleTag);
          }
      };
    }, [business?.theme]);


    const { filteredAndSortedProducts, categories } = useMemo(() => {
        if (!products) {
            return { filteredAndSortedProducts: [], categories: [] };
        }
        
        const allCategories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

        let filtered = products;

        if (searchQuery) {
          const lowercasedQuery = searchQuery.toLowerCase();
          filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(lowercasedQuery) ||
            p.description.toLowerCase().includes(lowercasedQuery) ||
            p.category?.toLowerCase().includes(lowercasedQuery) ||
            (p.keywords || []).some(k => k.toLowerCase().includes(lowercasedQuery))
          );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }
        
        const sorted = [...filtered].sort((a, b) => {
            switch (sortOrder) {
                case 'price-asc':
                    return (a.discountedPrice || a.price) - (b.discountedPrice || b.price);
                case 'price-desc':
                    return (b.discountedPrice || b.price) - (a.discountedPrice || a.price);
                case 'date-desc':
                default:
                    return 0; 
            }
        });
        
        return {
            filteredAndSortedProducts: sorted,
            categories: allCategories,
        };
    }, [products, selectedCategory, sortOrder, searchQuery]);


    if (error) {
        return <div className="text-center py-16 text-destructive">Error loading products. Please try again later.</div>
    }

    const clearFilters = () => {
        setSelectedCategory('all');
        setSortOrder('date-desc');
        setSearchQuery('');
        router.push(`/store/${businessId}`);
    }
    const isFiltered = selectedCategory !== 'all' || !!searchQuery;
    
    const mainProductList = filteredAndSortedProducts;

    const featuredProducts = useMemo(() => 
        products
            .filter(p => p.isFeatured)
            .filter(p => !mainProductList.some(mp => mp.id === p.id)) // Exclude products already in search results
            .slice(0, 4),
        [products, mainProductList]
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
                 <h2 className="text-2xl font-bold font-headline self-start md:self-center">Products</h2>
                <div className="flex items-center gap-2 sm:gap-4 self-end md:self-center">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[150px] sm:w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-[150px] sm:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-desc">Newest</SelectItem>
                            <SelectItem value="price-asc">Price: Low to High</SelectItem>
                            <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        </SelectContent>
                    </Select>
                     {isFiltered && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                            <XIcon className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {searchQuery && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold">Search results for &quot;{searchQuery}&quot;</h3>
                <p className="text-sm text-muted-foreground">{mainProductList.length} products found.</p>
              </div>
            )}
            
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {Array.from({length: 8}).map((_, i) => (
                            <Card key={i}>
                            <Skeleton className="w-full h-auto aspect-square" />
                            <CardContent className="p-4">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-8 w-1/2" />
                                <Skeleton className="h-10 w-full mt-4" />
                            </CardContent>
                            </Card>
                    ))}
                </div>
            ) : mainProductList.length > 0 ? (
                <div className="space-y-12">
                   <ProductList products={mainProductList} layout={business.layout} />
                   {mainProductList.length > 0 && mainProductList.length < 10 && featuredProducts.length > 0 && (
                        <div className="space-y-6 pt-12">
                            <h2 className="text-2xl font-bold font-headline">You might also like</h2>
                            <ProductGrid products={featuredProducts} />
                        </div>
                   )}
                </div>
            ) : (
                 <div className="text-center py-16">
                    <h2 className="mt-4 text-2xl font-semibold font-headline">No Matching Products Found</h2>
                    <p className="mt-2 text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
            )}
        </div>
    );
};
