'use client';

import { Providers } from '@/context/client-providers';

export default function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { businessId: string };
}) {
  return (
    <Providers businessId={params.businessId}>
      {children}
    </Providers>
  );
}