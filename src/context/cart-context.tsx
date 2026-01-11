
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, getDocs, collection, query, where, documentId } from 'firebase/firestore';
import type { Product } from '@/types/product';
import { useCustomer } from './customer-context';

interface CartItem extends Product {
  quantity: number;
}

interface DbCartItem {
    productId: string;
    quantity: number;
}

interface CustomerData {
    id: string;
    cart: DbCartItem[];
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, businessId }: { children: ReactNode, businessId: string }) {
  const { user, customer, isCustomerLoading } = useCustomer();
  const firestore = useFirestore();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const lastUserId = useRef<string | null>(null);

  // This function syncs the current cart state to Firestore.
  const syncCartToDb = useCallback(async (newCart: CartItem[]) => {
      if (user && firestore) {
          try {
              const customerRef = doc(firestore, 'businesses', businessId, 'customers', user.uid);
              const cartForDb = newCart.map(({ id, quantity }) => ({ productId: id, quantity }));
              await setDoc(customerRef, { cart: cartForDb }, { merge: true });
              localStorage.removeItem(`cart_${businessId}`)
          } catch (error) {
              console.error("Failed to sync cart to Firestore:", error);
          }
      }
  }, [user, firestore, businessId]);

  // Effect for handling cart logic across auth states
  useEffect(() => {
    // Don't do anything until the initial user/customer load is complete.
    if (isCustomerLoading) {
      return;
    }
    
    const currentUserId = user?.uid || null;

    // Only proceed if the user's auth state has actually changed.
    // This prevents re-running the logic on simple re-renders.
    if (currentUserId === lastUserId.current) {
      return;
    }

    lastUserId.current = currentUserId;

    // USER IS LOGGED OUT
    if (!currentUserId || !customer) {
      setIsCartLoading(true);
      try {
        const localCartData = localStorage.getItem(`cart_${businessId}`);
        setCartItems(localCartData ? JSON.parse(localCartData) : []);
      } catch (error) {
        console.error("Failed to load cart from local storage:", error);
        setCartItems([]);
      }
      setIsCartLoading(false);
      return;
    }
    
    // USER IS LOGGED IN
    setIsCartLoading(true);
    const dbCart = customer.cart || [];
      
    if (dbCart.length === 0) {
      setCartItems([]);
      setIsCartLoading(false);
      return;
    }

    const productIds = dbCart.map(item => item.productId);
    const productsRef = collection(firestore!, 'businesses', businessId, 'products');
    const productsQuery = query(productsRef, where(documentId(), 'in', productIds));

    getDocs(productsQuery).then(productSnapshots => {
      const productsData = new Map(productSnapshots.docs.map(d => [d.id, d.data() as Product]));
      
      const hydratedCart: CartItem[] = dbCart
        .map(item => {
          const productData = productsData.get(item.productId);
          if (!productData) return null;
          return { ...productData, id: item.productId, quantity: item.quantity };
        })
        .filter((item): item is CartItem => item !== null);
        
      setCartItems(hydratedCart);
    }).catch(error => {
      console.error("Error fetching products for cart:", error);
      setCartItems([]);
    }).finally(() => {
      setIsCartLoading(false);
    });

  }, [user, customer, isCustomerLoading, firestore, businessId]);


  const updateCart = (newCart: CartItem[]) => {
      setCartItems(newCart);
      if (customer) {
          syncCartToDb(newCart);
      } else {
          localStorage.setItem(`cart_${businessId}`, JSON.stringify(newCart));
      }
  }

  const addToCart = (product: Product) => {
    setCartItems(prevCart => {
        const existingItem = prevCart.find((item) => item.id === product.id);
        let newCart: CartItem[];
        if (existingItem) {
            newCart = prevCart.map((item) =>
                item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
        } else {
            newCart = [...prevCart, { ...product, quantity: 1 }];
        }
        
        if (customer) {
            syncCartToDb(newCart);
        } else {
            localStorage.setItem(`cart_${businessId}`, JSON.stringify(newCart));
        }

        return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    const newCart = cartItems.filter((item) => item.id !== productId);
    updateCart(newCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    let newCart: CartItem[];
    if (quantity <= 0) {
        newCart = cartItems.filter((item) => item.id !== productId);
    } else {
        newCart = cartItems.map((item) =>
            item.id === productId ? { ...item, quantity } : item
        );
    }
    updateCart(newCart);
  };

  const clearCart = () => {
    updateCart([]);
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, isCartLoading }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
