import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { ProductDetail } from './components/ProductDetail';
import { ProductForm } from './components/ProductForm';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CartPage } from './components/CartPage';
import { CheckoutPage } from './components/CheckoutPage';
import { OrdersPage } from './components/OrdersPage';
import { PaymentSuccessPage } from './components/PaymentSuccessPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/products/new"
            element={(
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            )}
          />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route
            path="/products/:id/edit"
            element={(
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/cart"
            element={(
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/checkout"
            element={(
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/orders"
            element={(
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/payment/success"
            element={(
              <ProtectedRoute>
                <PaymentSuccessPage />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}
