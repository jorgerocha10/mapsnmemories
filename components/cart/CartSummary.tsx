'use client';

import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartSummary() {
  const { items, totalAmount, loading } = useCart();
  
  if (loading) {
    return <CartSummarySkeleton />;
  }
  
  // Calculate shipping cost (free over $100, otherwise $10)
  const shippingCost = totalAmount >= 100 ? 0 : 10;
  
  // Calculate tax (assuming 8% sales tax)
  const taxRate = 0.08;
  const tax = totalAmount * taxRate;
  
  // Calculate final total
  const finalTotal = totalAmount + shippingCost + tax;
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Items ({items.length})</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          {shippingCost === 0 ? (
            <span className="text-green-600">Free</span>
          ) : (
            <span>{formatCurrency(shippingCost)}</span>
          )}
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Estimated Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        
        {shippingCost > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Add {formatCurrency(100 - totalAmount)} more to qualify for free shipping</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between font-semibold text-lg pt-2">
        <span>Total</span>
        <span>{formatCurrency(finalTotal)}</span>
      </div>
    </div>
  );
}

function CartSummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="flex justify-between pt-2">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
} 