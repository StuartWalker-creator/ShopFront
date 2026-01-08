
"use client";

import { collection, query, orderBy, limit } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useBusinessId } from "@/hooks/use-business-id";
import Link from "next/link";

import {
  Activity,
  CreditCard,
  DollarSign,
  Users,
  Package,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Order {
    id: string;
    customerName: string;
    orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    orderDate: string;
    totalAmount: number;
}

const getStatusVariant = (status: Order['orderStatus']) => {
    switch (status) {
        case 'delivered': return 'default';
        case 'pending': return 'destructive';
        case 'processing': return 'secondary';
        case 'shipped': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'secondary';
    }
};

export default function DashboardPage() {
  const firestore = useFirestore();
  const { businessId, isLoading: isBusinessIdLoading } = useBusinessId();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return query(collection(firestore, 'businesses', businessId, 'products'));
  }, [firestore, businessId]);
  
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return query(
        collection(firestore, 'businesses', businessId, 'orders'), 
        orderBy('orderDate', 'desc'), 
        limit(5)
    );
  }, [firestore, businessId]);

  const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);
  const { data: recentOrders, isLoading: areOrdersLoading } = useCollection<Order>(ordersQuery);

  const isLoading = isBusinessIdLoading || areProductsLoading || areOrdersLoading;
  const productCount = products?.length ?? 0;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Link href="/dashboard">
            <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">$0.00</div>
                <p className="text-xs text-muted-foreground">
                No sales data yet
                </p>
            </CardContent>
            </Card>
        </Link>
        <Link href="/dashboard/customers">
            <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                No customers yet
                </p>
            </CardContent>
            </Card>
        </Link>
        <Link href="/dashboard/orders">
            <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                No sales this month
                </p>
            </CardContent>
            </Card>
        </Link>
        <Link href="/dashboard/products">
            <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                <div className="text-2xl font-bold animate-pulse">...</div>
                ) : (
                <>
                    <div className="text-2xl font-bold">{productCount}</div>
                    <p className="text-xs text-muted-foreground">
                    {productCount === 0 ? 'No products created' : `You have ${productCount} products`}
                    </p>
                </>
                )}
            </CardContent>
            </Card>
        </Link>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : !recentOrders || recentOrders.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No recent orders.
                    </TableCell>
                    </TableRow>
                ) : (
                    recentOrders.map(order => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.customerName}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(order.orderStatus)} className="capitalize">
                                    {order.orderStatus}
                                </Badge>
                            </TableCell>
                            <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          {recentOrders && recentOrders.length > 0 && (
            <CardFooter className="justify-center border-t p-4">
                <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/orders">View All Orders</Link>
                </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </>
  )
}
