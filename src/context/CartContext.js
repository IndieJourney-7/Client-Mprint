import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/api";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch cart count from API
  const fetchCartCount = useCallback(async () => {
    try {
      setLoading(true);
      await api.get("/sanctum/csrf-cookie");
      const response = await api.get("/api/cart/count");
      setCartCount(response.data?.count || 0);
    } catch (error) {
      // User might not be logged in, set count to 0
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh cart count - can be called from any component
  const refreshCartCount = useCallback(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  // Update cart count directly (for optimistic updates)
  const updateCartCount = useCallback((count) => {
    setCartCount(count);
  }, []);

  // Increment cart count
  const incrementCartCount = useCallback((amount = 1) => {
    setCartCount(prev => prev + amount);
  }, []);

  // Decrement cart count
  const decrementCartCount = useCallback((amount = 1) => {
    setCartCount(prev => Math.max(0, prev - amount));
  }, []);

  // Fetch initial cart count on mount
  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  const value = {
    cartCount,
    loading,
    refreshCartCount,
    updateCartCount,
    incrementCartCount,
    decrementCartCount,
    fetchCartCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
