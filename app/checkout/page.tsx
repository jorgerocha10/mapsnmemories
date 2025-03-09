'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import CartSummary from '@/components/cart/CartSummary';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, loading, error, refreshCart } = useCart();
  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  
  // Use ref to prevent multiple refreshes
  const hasRefreshed = useRef(false);
  
  // Refresh cart on component mount - only once
  useEffect(() => {
    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshCart();
    }
  }, [refreshCart]);
  
  // If cart is empty, redirect to cart page
  useEffect(() => {
    if (!loading && items.length === 0 && hasRefreshed.current) {
      router.push('/cart');
    }
  }, [loading, items.length, router]);
  
  if (loading && !hasRefreshed.current) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center py-16">
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/cart" className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      {error && (
        <div className="mb-6 p-4 rounded-md bg-destructive/10 text-destructive">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm
            checkoutStep={checkoutStep}
            setCheckoutStep={setCheckoutStep}
          />
        </div>
        
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-6 shadow-sm sticky top-24">
            <h2 className="font-semibold text-lg mb-2">Order Summary</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
            <Separator className="mb-4" />
            <CartSummary />
          </div>
        </div>
      </div>
    </div>
  );
} 