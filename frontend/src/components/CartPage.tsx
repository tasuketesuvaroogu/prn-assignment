import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

export function CartPage() {
  const { cart, loading, updateItemQuantity, removeItem, getCartTotal, refreshCart } = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    if (!cart) {
      setQuantities({});
      return;
    }

    const nextQuantities = cart.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.itemId] = item.quantity;
      return acc;
    }, {});

    setQuantities(nextQuantities);
  }, [cart]);

  const subtotal = useMemo(() => getCartTotal(), [getCartTotal, cart]);

  const handleQuantityInput = (itemId: string, event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value)) return;
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(1, value) }));
  };

  const commitQuantityChange = async (itemId: string, quantity: number) => {
    const safeQuantity = Math.max(1, quantity);
    setIsUpdating(true);
    try {
      await updateItemQuantity(itemId, safeQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const adjustQuantity = async (itemId: string, delta: number) => {
    const current = quantities[itemId] ?? 1;
    const next = Math.max(1, current + delta);
    setQuantities((prev) => ({ ...prev, [itemId]: next }));
    await commitQuantityChange(itemId, next);
  };

  if (loading && !cart) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">Your cart is empty</h1>
        <p className="mb-6 text-gray-600">Browse our catalog and add items to your cart.</p>
        <Link to="/">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="mb-6 text-3xl font-semibold text-gray-900">Your Cart</h1>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {cart.items.map((item) => (
                <div key={item.itemId} className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded bg-gray-100">
                      <img
                        src={item.image || 'https://via.placeholder.com/160'}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                      {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                      {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                      <p className="mt-2 text-sm font-medium text-gray-900">Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => adjustQuantity(item.itemId, -1)}
                        disabled={isUpdating || quantities[item.itemId] === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        value={quantities[item.itemId] ?? item.quantity}
                        onChange={(event) => handleQuantityInput(item.itemId, event)}
                        onBlur={() => commitQuantityChange(item.itemId, quantities[item.itemId] ?? item.quantity)}
                        className="w-20 text-center"
                        disabled={isUpdating}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => adjustQuantity(item.itemId, 1)}
                        disabled={isUpdating}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" className="gap-2 text-red-600 hover:text-red-700" onClick={() => removeItem(item.itemId)}>
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <Link to="/checkout" className="block">
                <Button className="w-full">Proceed to Checkout</Button>
              </Link>
              <Link to="/" className="block text-center text-sm text-gray-500 hover:text-gray-700">
                Continue shopping
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
