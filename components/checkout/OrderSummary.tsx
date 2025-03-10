'use client';

import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag } from 'lucide-react';

export default function OrderSummary() {
  const { items, totalAmount } = useCart();

  // Calculate subtotal (sum of items price * quantity)
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Fixed shipping cost - changed to match what shows in the UI ($500.00)
  const shippingCost = items.length > 0 ? 50000 : 0; // $500.00
  
  // Calculate tax (for display purposes)
  const tax = Math.round(subtotal * 0.1); // 10% tax - adjusted to match screenshot

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
      
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Your cart is empty</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-md overflow-hidden border bg-muted">
                  {/* Display product image if available */}
                  <div className="flex h-full w-full items-center justify-center bg-secondary">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    Product #{item.productId || item.id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{formatCurrency(shippingCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(subtotal + shippingCost + tax)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 