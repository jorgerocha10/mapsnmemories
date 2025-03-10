'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, loading, error, refreshCart } = useCart();
  
  // Use ref to prevent multiple refreshes
  const hasRefreshed = useRef(false);
  
  // Refresh cart on component mount - only once
  useEffect(() => {
    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshCart();
    }
  }, [refreshCart]);
  
  // Remove the redirection to cart page if cart is empty
  // This was causing issues with the payment flow
  // When payment succeeds, cart is cleared before the redirect happens
  
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
      
      <div>
        <CheckoutForm />
      </div>
    </div>
  );
} 