'use client';

import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartItemList() {
  const { items, loading, updateItem, removeItem } = useCart();
  
  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <CartItemSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p>Your cart is empty.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="hidden md:grid md:grid-cols-[3fr_1fr_1fr_auto] gap-4 px-4 py-2 text-sm text-muted-foreground">
        <div>Product</div>
        <div className="text-center">Price</div>
        <div className="text-center">Quantity</div>
        <div className="text-right">Total</div>
      </div>
      
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border bg-card">
          <div className="md:grid md:grid-cols-[3fr_1fr_1fr_auto] gap-4 p-4">
            {/* Product */}
            <div className="flex gap-4 mb-4 md:mb-0">
              <div className="relative aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted"></div>
                )}
              </div>
              <div>
                <Link 
                  href={`/products/${item.productId}`}
                  className="font-medium hover:underline"
                >
                  {item.productName}
                </Link>
                {item.variantName && (
                  <p className="text-sm text-muted-foreground">
                    {item.variantName}
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-destructive md:hidden mt-2"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
            
            {/* Price */}
            <div className="mb-4 md:mb-0 md:text-center">
              <div className="flex items-center justify-between md:block">
                <span className="font-medium md:hidden">Price:</span>
                <span>{formatCurrency(item.price)}</span>
              </div>
            </div>
            
            {/* Quantity */}
            <div className="mb-4 md:mb-0 md:flex md:justify-center">
              <div className="flex items-center justify-between md:justify-center">
                <span className="font-medium md:hidden mr-4">Quantity:</span>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                    disabled={loading}
                  >
                    <Minus className="h-3 w-3" />
                    <span className="sr-only">Decrease quantity</span>
                  </Button>
                  <span className="mx-2 w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateItem(item.id, item.quantity + 1)}
                    disabled={loading}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="sr-only">Increase quantity</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Total */}
            <div className="flex items-center justify-between md:block md:text-right">
              <span className="font-medium md:hidden">Total:</span>
              <div className="flex items-center">
                <span className="font-medium">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-4 hidden md:inline-flex h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(item.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove item</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex justify-end py-4">
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            // Implement clear cart functionality
            items.forEach(item => removeItem(item.id));
          }}
          disabled={loading || items.length === 0}
        >
          Clear Cart
        </Button>
      </div>
    </div>
  );
}

// Skeleton loader for cart items
function CartItemSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="md:grid md:grid-cols-[3fr_1fr_1fr_auto] gap-4">
        <div className="flex gap-4 mb-4 md:mb-0">
          <Skeleton className="aspect-square h-20 w-20 flex-shrink-0 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="mb-4 md:mb-0 md:flex md:justify-center md:items-center">
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="mb-4 md:mb-0 md:flex md:justify-center md:items-center">
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="md:flex md:justify-end md:items-center">
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
} 