import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, PackageCheck, Receipt } from 'lucide-react';
import { getOrders, Order } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function getStatusVariant(status: Order['status']) {
  switch (status) {
    case 'paid':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (error: any) {
        const message = error?.message ?? 'Failed to load orders';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const totals = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalPaid = orders.filter((order) => order.status === 'paid').length;
    return { totalOrders: orders.length, totalSpent, totalPaid };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-6">
        <h1 className="text-3xl font-semibold text-gray-900">Order History</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
              <Receipt className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totals.totalOrders}</div>
              <p className="text-xs text-gray-500">All orders placed so far</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Orders Paid</CardTitle>
              <PackageCheck className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totals.totalPaid}</div>
              <p className="text-xs text-gray-500">Successfully completed orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
              <CalendarDays className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalSpent)}</div>
              <p className="text-xs text-gray-500">Cumulative amount of all orders</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders yet. Start shopping to create your first order.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.id}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(order.status)} className="capitalize">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ul className="space-y-1">
                            {order.items.map((item) => (
                              <li key={`${order.id}-${item.productId}-${item.size}-${item.color}`} className="text-sm text-gray-600">
                                <span className="font-medium text-gray-900">{item.name}</span> × {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </TableCell>
                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell>{new Date(order.updatedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
