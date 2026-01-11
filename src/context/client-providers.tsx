"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Lazy-load CartProvider
const CartProvider = dynamic(
  () => import("./cart-context").then(mod => mod.CartProvider),
  { ssr: false }
);

export function Providers({ children, businessId }: { children: ReactNode, businessId: string }) {
  return <CartProvider businessId={businessId}>{children}</CartProvider>;
}