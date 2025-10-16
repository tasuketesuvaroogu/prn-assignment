import { ShoppingBag, Plus, Home, LogIn, LogOut, UserPlus, ShoppingCart, List } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();

  const cartCount = getItemCount();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            <span>Fashion Store</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            {user && (
              <Link to="/products/new">
                <Button
                  variant={isActive('/products/new') ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </Link>
            )}
            {user && (
              <Link to="/orders">
                <Button
                  variant={location.pathname.startsWith('/orders') ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  Orders
                </Button>
              </Link>
            )}
            {user && (
              <Link to="/cart">
                <Button
                  variant={location.pathname.startsWith('/cart') ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            {!user ? (
              <>
                <Link to="/login">
                  <Button
                    variant={isActive('/login') ? 'default' : 'ghost'}
                    className="gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant={isActive('/register') ? 'default' : 'ghost'}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register
                  </Button>
                </Link>
              </>
            ) : (
              <Button variant="outline" className="gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
