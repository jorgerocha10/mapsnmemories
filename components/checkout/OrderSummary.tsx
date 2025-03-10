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
  
  // Calculate shipping cost (free over $100, otherwise $10)
  const shippingCost = subtotal >= 100 ? 0 : 10;
  
  // Calculate tax (8% sales tax)
  const taxRate = 0.08;
  const tax = subtotal * taxRate;

  // Calculate final total
  const finalTotal = subtotal + shippingCost + tax;

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
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.productName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.price)}</p>
                  {item.quantity > 1 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator className="mb-4" />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              {shippingCost === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                <span>{formatCurrency(shippingCost)}</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 