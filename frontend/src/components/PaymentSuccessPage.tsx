import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Order, confirmOrderPayment, getOrderById } from '../utils/api';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { refreshCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      return;
    }

    const confirm = async () => {
      setStatus('loading');
      try {
        const response = await confirmOrderPayment(orderId, sessionId ?? undefined);
        setOrder(response.order);
        setStatus('success');
        await refreshCart();
      } catch (error) {
        try {
          const existing = await getOrderById(orderId);
          if (existing) {
            setOrder(existing);
            setStatus('success');
            await refreshCart();
            return;
          }
        } catch (innerError) {
          console.error(innerError);
        }

        toast.error('Unable to confirm payment. Please contact support.');
        setStatus('error');
      }
    };

    confirm();
  }, [orderId, sessionId, refreshCart]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Finalizing your payment...</span>
        </div>
      </div>
    );
  }

  if (status === 'error' || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <XCircle className="mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">We couldn't verify your payment</h1>
        <p className="mb-6 max-w-md text-gray-600">
          Please check your email for order details or contact our support team for further assistance.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/cart">
            <Button variant="outline">Back to Cart</Button>
          </Link>
          <Link to="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="flex flex-col items-center text-center">
            <CheckCircle className="mb-4 h-12 w-12 text-emerald-500" />
            <CardTitle className="text-2xl font-semibold text-gray-900">Payment Successful</CardTitle>
            <p className="mt-2 text-sm text-gray-600">Thank you! Your order has been confirmed.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Order ID</p>
              <p className="font-mono text-sm text-gray-900">{order.id}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-lg font-semibold capitalize text-gray-900">{order.status}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Items</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}-${item.size}-${item.color}`}>
                    <span className="font-medium text-gray-900">{item.name}</span> × {item.quantity}{' '}
                    <span className="text-gray-500">(${item.price.toFixed(2)} each)</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="text-lg font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/orders">
                <Button>View Orders</Button>
              </Link>
              <Link to="/">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
