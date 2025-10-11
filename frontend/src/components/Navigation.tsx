import { ShoppingBag, Plus, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';

export function Navigation() {
  const location = useLocation();

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
            <Link to="/products/new">
              <Button
                variant={isActive('/products/new') ? 'default' : 'ghost'}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
