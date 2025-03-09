'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import CartItemList from '@/components/cart/CartItemList';
import CartSummary from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const router = useRouter();
  const { items, itemCount, totalAmount, loading, error, refreshCart } = useCart();
  
  // Use ref to prevent multiple refreshes
  const hasRefreshed = useRef(false);
  
  // Refresh cart on component mount - only once
  useEffect(() => {
    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshCart();
    }
  }, [refreshCart]);
  
  // Handle checkout
  const handleCheckout = () => {
    router.push('/checkout');
  };
  
  // Show empty state if cart is empty
  if (!loading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        <div className="mx-auto max-w-lg text-center py-16">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link href="/products">
            <Button size="lg">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-10">Your Cart</h1>
      
      {error && (
        <div className="mb-6 p-4 rounded-md bg-destructive/10 text-destructive">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CartItemList />
        </div>
        
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-6 shadow-sm sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <CartSummary />
            <Separator className="my-4" />
            <Button 
              onClick={handleCheckout} 
              className="w-full" 
              size="lg" 
              disabled={loading || items.length === 0}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 