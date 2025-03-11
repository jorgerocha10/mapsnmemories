'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X, Minus, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

interface CartSlideOverProps {
  trigger?: React.ReactNode;
}

export function CartSlideOver({ trigger }: CartSlideOverProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { items, itemCount, totalAmount, loading, error, updateItem, removeItem } = useCart();
  
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    try {
      await updateItem(itemId, newQuantity);
    } catch (err) {
      console.error('Failed to update item quantity:', err);
    }
  };
  
  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };
  
  const handleCheckout = () => {
    setIsOpen(false);
    router.push('/checkout');
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {itemCount}
              </Badge>
            )}
            <span className="sr-only">Open cart</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg p-6">
        <SheetHeader className="px-1">
          <div className="flex items-center justify-between">
            <SheetTitle>Your Cart</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
          <p className="text-sm text-muted-foreground">
            {itemCount === 0
              ? 'Your cart is empty'
              : `You have ${itemCount} item${itemCount === 1 ? '' : 's'} in your cart`}
          </p>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {error ? (
            <div className="flex flex-col items-center justify-center h-32 p-4">
              <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
              <p className="text-center text-sm text-muted-foreground">
                {error}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-32">
              <p>Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Looks like you haven't added anything to your cart yet.
              </p>
              <SheetClose asChild>
                <Link href="/products">
                  <Button>Browse Products</Button>
                </Link>
              </SheetClose>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="grid grid-cols-[80px_1fr] gap-4">
                  <div className="relative aspect-square h-20 w-20 overflow-hidden rounded-md border">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{item.productName}</h3>
                        {item.variantName && (
                          <p className="text-sm text-muted-foreground">
                            Variant: {item.variantName}
                          </p>
                        )}
                      </div>
                      <p className="font-medium">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                          disabled={loading}
                        >
                          <Minus className="h-3 w-3" />
                          <span className="sr-only">Decrease quantity</span>
                        </Button>
                        <span className="mx-2 w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={loading}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="sr-only">Increase quantity</span>
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove item</span>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {!error && items.length > 0 && (
          <div className="space-y-4 pt-4">
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            
            <SheetFooter className="flex flex-col space-y-2 pt-2">
              <Button 
                onClick={handleCheckout} 
                className="w-full" 
                size="lg" 
                disabled={loading || items.length === 0}
              >
                Checkout
              </Button>
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </SheetClose>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
} 