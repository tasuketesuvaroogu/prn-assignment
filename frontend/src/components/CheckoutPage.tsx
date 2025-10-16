import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { useCart } from '../context/CartContext';
import { checkoutOrder, createCheckoutSession } from '../utils/api';
import { toast } from 'sonner';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, refreshCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">Your cart is empty</h1>
        <p className="mb-6 text-gray-600">Add items to your cart before checking out.</p>
        <Button onClick={() => navigate('/')}>Browse Products</Button>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProcessing(true);

    try {
      const orderResponse = await checkoutOrder({
        shippingAddress: shippingAddress.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      const order = orderResponse.order;
      if (!order?.id) {
        throw new Error('Failed to create order');
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const successUrl = origin ? `${origin}/payment/success` : undefined;
      const cancelUrl = origin ? `${origin}/cart` : undefined;

      const checkout = await createCheckoutSession(order.id, successUrl, cancelUrl);
      if (checkout.checkoutUrl) {
        toast.success('Redirecting to secure checkout...');
        await refreshCart();
        window.location.href = checkout.checkoutUrl;
        return;
      }

      toast.success('Order created successfully');
      await refreshCart();
      navigate('/orders', { replace: true });
    } catch (error: any) {
      const message = error?.message ?? 'Failed to initiate checkout';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="mb-6 text-3xl font-semibold text-gray-900">Checkout</h1>
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="shippingAddress">
                  Shipping Address
                </label>
                <Textarea
                  id="shippingAddress"
                  placeholder="Enter your full shipping address"
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="notes">
                  Order Notes (optional)
                </label>
                <Input
                  id="notes"
                  placeholder="Add any special instructions"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Complete Order'}
              </Button>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.itemId} className="flex items-center justify-between text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                        {item.size ? ` • Size ${item.size}` : ''}
                        {item.color ? ` • ${item.color}` : ''}
                      </p>
                    </div>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>Calculated at payment</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
