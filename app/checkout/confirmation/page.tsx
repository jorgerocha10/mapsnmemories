'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const router = useRouter();
  
  // Generate a random order number (in a real app, this would come from the backend)
  const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // In a real application, we would fetch the order details from the backend
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-lg mx-auto text-center">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Thank You for Your Order!</h1>
        <p className="text-lg mb-8">
          Your order has been received and is now being processed.
        </p>
        
        <div className="rounded-lg border bg-card p-6 mb-8 text-left">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-medium">{orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{orderDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">customer@example.com</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">Credit Card (ending in 1111)</p>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-8">
          A confirmation email has been sent to your email address.
        </p>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Button asChild size="lg" className="flex-1">
            <Link href="/products">Continue Shopping</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link href="/dashboard/orders">View Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 