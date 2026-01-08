
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { ArrowLeft, Search, Clock, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProductSearch } from '@/context/product-search-context';
import type { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';

interface SearchOverlayProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const MAX_RECENT_SEARCHES = 5;
const DEBOUNCE_DELAY = 300;

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
  
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
  
    return debouncedValue;
}

const getRecentSearches = (businessId: string): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(`recent_searches_${businessId}`);
    return stored ? JSON.parse(stored) : [];
};

const addRecentSearch = (businessId: string, query: string) => {
    if (!query) return;
    const searches = getRecentSearches(businessId);
    const newSearches = [query, ...searches.filter(s => s !== query)].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(`recent_searches_${businessId}`, JSON.stringify(newSearches));
};

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, index) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <strong key={index} className="font-bold">{part}</strong>
                ) : (
                    part
                )
            )}
        </span>
    );
}

export function SearchOverlay({ isOpen, onOpenChange }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const businessId = params.businessId as string;
  const { products, isLoading } = useProductSearch();
  
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, DEBOUNCE_DELAY);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 150);
      setRecentSearches(getRecentSearches(businessId));
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, businessId]);

  const handleSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    addRecentSearch(businessId, searchTerm);
    onOpenChange(false);
    router.push(`/store/${businessId}?q=${encodeURIComponent(searchTerm)}`);
  }, [businessId, onOpenChange, router]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };
  
  const suggestions = useMemo(() => {
    if (!debouncedQuery || !products) return [];

    const lowercasedQuery = debouncedQuery.toLowerCase();
    
    return products
      .map(product => {
        const title = product.title.toLowerCase();
        const description = product.description.toLowerCase();
        const category = product.category?.toLowerCase() || '';
        const keywords = (product.keywords || []).join(' ').toLowerCase();

        let score = 0;
        if (title.startsWith(lowercasedQuery)) score = 5;
        else if (title.includes(lowercasedQuery)) score = 4;
        else if (keywords.includes(lowercasedQuery)) score = 3;
        else if (category.includes(lowercasedQuery)) score = 2;
        else if (description.includes(lowercasedQuery)) score = 1;
        
        return { ...product, score };
      })
      .filter(product => product.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [debouncedQuery, products]);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        data-state={isOpen ? "open" : "closed"}
    >
        <div className="container mx-auto px-4 max-w-2xl">
            <form onSubmit={handleFormSubmit}>
                <div className="flex items-center h-16 border-b">
                    <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="mr-2">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            type="search"
                            placeholder="Search products..."
                            className="w-full pl-10 h-10 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>
            </form>

            <div className="py-6 space-y-6">
                {isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                ) : query.length === 0 ? (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground px-2">Recent Searches</h3>
                        <ul className="space-y-1">
                            {recentSearches.map((term) => (
                                <li key={term}>
                                    <button onClick={() => setQuery(term)} className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-muted">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{term}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : suggestions.length > 0 ? (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground px-2">Product Suggestions</h3>
                        <ul className="space-y-1">
                            {suggestions.map(product => (
                                <li key={product.id}>
                                    <Link 
                                        href={`/store/${businessId}/product/${product.id}`}
                                        onClick={() => onOpenChange(false)}
                                        className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-muted"
                                    >
                                        <div className="relative h-10 w-10 rounded-md overflow-hidden border">
                                            {product.imageUrls[0] ? (
                                                <Image src={product.imageUrls[0]} alt={product.title} fill className="object-cover"/>
                                            ) : (
                                                <Package className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"/>
                                            )}
                                        </div>
                                        <span className="flex-1 truncate">
                                            <HighlightedText text={product.title} highlight={query} />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No results for &quot;{query}&quot;</p>
                )}
            </div>
        </div>
    </div>
  );
}
