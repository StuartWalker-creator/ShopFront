"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const CartProvider = dynamic(
  () => import("./cart-context").then(m => m.CartProvider),
  { ssr: false }
);

export function Providers({
  children,
  businessId,
}: {
  children: ReactNode;
  businessId: string;
}) {
  return (
    <CartProvider businessId={businessId}>
      {children}
    </CartProvider>
  );
}