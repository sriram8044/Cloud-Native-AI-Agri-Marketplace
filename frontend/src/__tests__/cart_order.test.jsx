import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CartPage from '../pages/CartPage';
import OrdersPage from '../pages/OrdersPage';
import FarmerOrdersPage from '../pages/FarmerOrdersPage';
import CropCard from '../components/CropCard';
import CropDetailModal from '../components/CropDetailModal';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

describe('Phase 5 Frontend Cart & Order UI Tests', () => {
  it('renders CartPage with sign-in prompt when not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CartPage />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Sign In to View Your Cart/i)).toBeDefined();
    expect(screen.getByText(/Sign In to Account/i)).toBeDefined();
  });

  it('renders OrdersPage with sign-in prompt when not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <OrdersPage />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Sign In to View Orders/i)).toBeDefined();
  });

  it('renders FarmerOrdersPage with farmer sign-in prompt when not authenticated', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <FarmerOrdersPage />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Farmer Sign In Required/i)).toBeDefined();
  });

  it('renders CropCard with Add to Cart button and price metrics', () => {
    const mockCrop = {
      id: 101,
      name: 'Organic Wheat',
      category: 'Grains',
      description: 'Golden high-protein wheat grain',
      pricePerKg: '45.00',
      availableQuantityKg: '500.00',
      location: 'Punjab, India',
      createdAt: '2026-10-27T10:00:00',
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CropCard crop={mockCrop} onSelect={() => {}} />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Organic Wheat')).toBeDefined();
    expect(screen.getByText(/45.00/i)).toBeDefined();
    expect(screen.getByText(/Add to Cart/i)).toBeDefined();
    expect(screen.getByText(/View Details/i)).toBeDefined();
  });

  it('renders CropDetailModal with interactive quantity selector and Add to Cart action', () => {
    const mockCrop = {
      id: 102,
      name: 'Kashmiri Saffron',
      category: 'Spices',
      description: 'Grade A premium pure saffron',
      pricePerKg: '250.00',
      availableQuantityKg: '20.00',
      location: 'Pampore, Kashmir',
      createdAt: '2026-10-27T10:00:00',
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CropDetailModal crop={mockCrop} onClose={() => {}} />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Kashmiri Saffron')).toBeDefined();
    expect(screen.getByText(/Select Quantity \(kg\)/i)).toBeDefined();
    expect(screen.getByText(/Add 1 kg to Cart/i)).toBeDefined();
  });
});
