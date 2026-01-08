
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { Product } from '@/types/product';

interface ProductSearchContextType {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
}

const ProductSearchContext = createContext<ProductSearchContextType | undefined>(undefined);

export function ProductSearchProvider({
  children,
  products: initialProducts,
}: {
  children: ReactNode;
  products: Product[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery) {
        setIsSearching(true);
        // Simulate a short delay to allow the loading spinner to be seen
        // and for the UI to update before filtering begins.
        const timer = setTimeout(() => {
            setIsSearching(false);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    } else {
        setIsSearching(false);
    }
  }, [searchQuery]);
  

  const value = {
    products: initialProducts,
    isLoading: false,
    error: null,
    searchQuery,
    setSearchQuery,
    isSearching,
    setIsSearching,
  };

  return (
    <ProductSearchContext.Provider value={value}>
      {children}
    </ProductSearchContext.Provider>
  );
}

export function useProductSearch() {
  const context = useContext(ProductSearchContext);
  if (context === undefined) {
    throw new Error('useProductSearch must be used within a ProductSearchProvider');
  }
  return context;
}
