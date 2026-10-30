import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../api/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    totalItems: 0,
    totalQuantityKg: 0,
    subtotal: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!user || user.role !== 'CUSTOMER') {
      setCart({ items: [], totalItems: 0, totalQuantityKg: 0, subtotal: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await cartService.getCart();
      setCart(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (cropId, quantityKg) => {
    setError(null);
    const addedItem = await cartService.addToCart(cropId, quantityKg);
    await fetchCart();
    return addedItem;
  };

  const updateQuantity = async (itemId, quantityKg) => {
    setError(null);
    const updated = await cartService.updateCartItem(itemId, quantityKg);
    await fetchCart();
    return updated;
  };

  const removeItem = async (itemId) => {
    setError(null);
    await cartService.removeCartItem(itemId);
    await fetchCart();
  };

  const clearCart = async () => {
    setError(null);
    await cartService.clearCart();
    setCart({ items: [], totalItems: 0, totalQuantityKg: 0, subtotal: 0 });
  };

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
