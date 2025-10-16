import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CartItem,
  CartSummary,
  addItemToCart,
  clearCart as apiClearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../utils/api';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cart: CartSummary | null;
  loading: boolean;
  refreshCart: () => Promise<CartSummary | null>;
  addItem: (payload: { productId: string; quantity?: number; size?: string; color?: string }) => Promise<CartSummary | null>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<CartSummary | null>;
  removeItem: (itemId: string) => Promise<CartSummary | null>;
  clearCart: () => Promise<void>;
  getItemCount: () => number;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCart(null);
      return null;
    }

    setLoading(true);
    try {
      const summary = await getCart();
      setCart(summary);
      return summary;
    } catch (error: any) {
      const message = error?.message ?? 'Unable to load cart';
      toast.error(message);
      setCart(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [token, refreshCart]);

  const addItem = useCallback(
    async (payload: { productId: string; quantity?: number; size?: string; color?: string }) => {
      if (!token) {
        toast.error('Please login to manage your cart');
        return null;
      }

      try {
        const response = await addItemToCart(payload);
        setCart(response);
        toast.success('Added to cart');
        return response;
      } catch (error: any) {
        const message = error?.message ?? 'Failed to add item to cart';
        toast.error(message);
        throw error;
      }
    },
    [token]
  );

  const updateItemQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!token) {
      toast.error('Please login to manage your cart');
      return null;
    }

    try {
      const response = await updateCartItem(itemId, quantity);
      setCart(response);
      toast.success('Cart updated');
      return response;
    } catch (error: any) {
      const message = error?.message ?? 'Failed to update cart item';
      toast.error(message);
      throw error;
    }
  }, [token]);

  const removeItem = useCallback(async (itemId: string) => {
    if (!token) {
      toast.error('Please login to manage your cart');
      return null;
    }

    try {
      const response = await removeCartItem(itemId);
      setCart(response);
      toast.success('Removed from cart');
      return response;
    } catch (error: any) {
      const message = error?.message ?? 'Failed to remove cart item';
      toast.error(message);
      throw error;
    }
  }, [token]);

  const clearCart = useCallback(async () => {
    if (!token) {
      setCart(null);
      return;
    }

    try {
      await apiClearCart();
      setCart({ items: [], total: 0, updatedAt: new Date().toISOString() });
    } catch (error: any) {
      const message = error?.message ?? 'Failed to clear cart';
      toast.error(message);
      throw error;
    }
  }, [token]);

  const getItemCount = useCallback(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  }, [cart]);

  const getCartTotal = useCallback(() => {
    return cart?.total ?? 0;
  }, [cart]);

  const value = useMemo(
    () => ({ cart, loading, refreshCart, addItem, updateItemQuantity, removeItem, clearCart, getItemCount, getCartTotal }),
    [cart, loading, refreshCart, addItem, updateItemQuantity, removeItem, clearCart, getItemCount, getCartTotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
