'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { setCookie } from 'cookies-next';

// Define cart item type
interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  variantId: string | null;
  variantName: string | null;
  variantOptions: { id: string; name: string; value: string }[];
  price: number;
  quantity: number;
}

// Define cart state
interface CartState {
  id: string | null;
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
}

// Initial cart state
const initialCartState: CartState = {
  id: null,
  items: [],
  itemCount: 0,
  totalAmount: 0,
  sessionId: null,
  loading: true,
  error: null,
};

// Define cart context type
interface CartContextType extends CartState {
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<boolean>;
  updateItem: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart provider props
interface CartProviderProps {
  children: React.ReactNode;
}

// CartProvider component
export function CartProvider({ children }: CartProviderProps) {
  // Cart state
  const [cart, setCart] = useState<CartState>(initialCartState);
  
  // Use a ref to prevent multiple fetches during initialization
  const initialFetchDone = useRef(false);
  
  // Fetch the cart from the API
  const fetchCart = useCallback(async () => {
    try {
      setCart(prevCart => ({ ...prevCart, loading: true, error: null }));
      
      const response = await fetch('/api/cart');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      const data = await response.json();
      
      // If there's a sessionId in the response, store it in a cookie
      if (data.sessionId) {
        setCookie('cartSessionId', data.sessionId, {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });
      }
      
      setCart({
        id: data.id,
        items: data.items || [],
        itemCount: data.itemCount || 0,
        totalAmount: data.totalAmount || 0,
        sessionId: data.sessionId,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart(prevCart => ({
        ...prevCart,
        loading: false,
        error: 'Failed to load cart. Please try again.',
      }));
    }
  }, []);
  
  // Fetch cart on component mount, but only once
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchCart().catch(console.error);
    }
  }, [fetchCart]);
  
  // Add item to cart
  const addItem = async (productId: string, quantity: number, variantId?: string) => {
    try {
      setCart(prevCart => ({ ...prevCart, loading: true, error: null }));
      
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          variantId,
          quantity,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }
      
      // Refresh cart after adding item
      await fetchCart();
      
      return true;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      setCart(prevCart => ({
        ...prevCart,
        loading: false,
        error: 'Failed to add item to cart. Please try again.',
      }));
      return false;
    }
  };
  
  // Update cart item
  const updateItem = async (cartItemId: string, quantity: number) => {
    try {
      setCart(prevCart => ({ ...prevCart, loading: true, error: null }));
      
      const response = await fetch('/api/cart/items', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItemId,
          quantity,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }
      
      // If quantity is 0, remove the item from the cart state
      if (quantity === 0) {
        setCart(prevCart => ({
          ...prevCart,
          items: prevCart.items.filter(item => item.id !== cartItemId),
          itemCount: prevCart.itemCount - (prevCart.items.find(item => item.id === cartItemId)?.quantity || 0),
          totalAmount: prevCart.items.reduce((sum, item) => {
            if (item.id === cartItemId) return sum;
            return sum + (item.price * item.quantity);
          }, 0),
          loading: false,
        }));
      } else {
        // Otherwise, refresh cart to get updated state
        await fetchCart();
      }
      
      return true;
    } catch (error) {
      console.error('Error updating cart item:', error);
      setCart(prevCart => ({
        ...prevCart,
        loading: false,
        error: 'Failed to update cart item. Please try again.',
      }));
      return false;
    }
  };
  
  // Remove item from cart
  const removeItem = async (cartItemId: string) => {
    try {
      setCart(prevCart => ({ ...prevCart, loading: true, error: null }));
      
      const response = await fetch(`/api/cart/items?id=${cartItemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }
      
      // Update cart state locally
      setCart(prevCart => ({
        ...prevCart,
        items: prevCart.items.filter(item => item.id !== cartItemId),
        itemCount: prevCart.itemCount - (prevCart.items.find(item => item.id === cartItemId)?.quantity || 0),
        totalAmount: prevCart.items.reduce((sum, item) => {
          if (item.id === cartItemId) return sum;
          return sum + (item.price * item.quantity);
        }, 0),
        loading: false,
      }));
      
      return true;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      setCart(prevCart => ({
        ...prevCart,
        loading: false,
        error: 'Failed to remove item from cart. Please try again.',
      }));
      return false;
    }
  };
  
  // Clear cart (for checkout completion)
  const clearCart = async () => {
    try {
      // Implementation depends on your API design
      // For now, we'll just clear the state locally
      setCart({
        ...initialCartState,
        loading: false,
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      setCart(prevCart => ({
        ...prevCart,
        loading: false,
        error: 'Failed to clear cart. Please try again.',
      }));
      return false;
    }
  };
  
  // Refresh cart data - this function can be called from other components
  // We need to make sure it doesn't cause infinite loops
  const refreshCart = useCallback(async () => {
    // Only refresh if we've already done the initial fetch
    if (initialFetchDone.current) {
      await fetchCart().catch(console.error);
    }
  }, [fetchCart]);
  
  // Combine cart state and actions
  const value = {
    ...cart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refreshCart,
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook for using the cart context
export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
} 