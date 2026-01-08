
'use server';

import React from 'react';
import { getBusinessById, getPublishedProducts } from '@/firebase/server';
import { notFound } from 'next/navigation';
import { CartProvider } from '@/context/cart-context';
import { StoreLayoutClient } from './layout-client';
import type { Business } from './page';
import { CustomerProvider } from '@/context/customer-context';

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { businessId: string };
}) {
  const business = await getBusinessById(params.businessId) as Business | null;
  
  if (!business) {
    notFound();
  }

  const products = await getPublishedProducts(params.businessId);

  // Pass the business and product data to all children, including nested pages
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore - Cloning to pass props to the page component
      return React.cloneElement(child, { ...child.props, business, products });
    }
    return child;
  });

  return (
    <CustomerProvider businessId={params.businessId}>
      <CartProvider businessId={params.businessId}>
        <StoreLayoutClient business={business} products={products}>
          {childrenWithProps}
        </StoreLayoutClient>
      </CartProvider>
    </CustomerProvider>
  );
}
