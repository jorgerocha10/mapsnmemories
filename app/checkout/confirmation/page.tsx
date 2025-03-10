'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

// Client component that uses the search params
function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get payment_intent and payment_intent_client_secret from URL
  const paymentIntentId = searchParams.get('payment_intent');
  const paymentStatus = searchParams.get('redirect_status');

  useEffect(() => {
    // If we don't have payment info in the URL, this might not be a proper redirect
    if (!paymentIntentId || !paymentStatus) {
      setIsLoading(false);
      return;
    }

    // Get order details based on payment intent ID
    const fetchOrderDetails = async () => {
      try {
        // Fetch order details from our API
        const response = await fetch(`/api/checkout/order?payment_intent=${paymentIntentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        
        const data = await response.json();
        setOrderDetails(data);
      } catch (error) {
        console.error('Error fetching order details:', error);
        // If there's an error, create a fallback order with basic info
        setOrderDetails({
          id: 'ORD-' + Math.floor(Math.random() * 10000),
          date: new Date().toISOString(),
          status: 'confirmed',
          paymentStatus: paymentStatus === 'succeeded' ? 'paid' : 'pending',
          subtotal: 0,
          shippingCost: 0,
          tax: 0,
          total: 0,
          items: [],
          shipping: {
            name: 'Customer',
            address: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [paymentIntentId, paymentStatus]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we don't have order details, show an error
  if (!orderDetails) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-destructive/10 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            We couldn't find any order information. This might be because:
          </p>
          <ul className="text-left list-disc pl-6 mb-6 space-y-2">
            <li>You arrived at this page directly without completing a checkout</li>
            <li>There was an issue processing your payment</li>
            <li>The order information is still being processed</li>
          </ul>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Order Confirmed!</h1>
          <p className="text-muted-foreground mt-2">
            Thank you for your order. We've sent a confirmation email to your inbox.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Order Details</h2>
            <div className="bg-muted rounded-md p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-medium">{orderDetails.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{formatDate(orderDetails.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Status:</span>
                <span className="capitalize">{orderDetails.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <span className="capitalize">{orderDetails.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">{formatCurrency(orderDetails.total)}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
            <div className="bg-muted rounded-md p-4">
              <p>{orderDetails.shipping.name}</p>
              <p>{orderDetails.shipping.address}</p>
              <p>
                {orderDetails.shipping.city}, {orderDetails.shipping.state}{' '}
                {orderDetails.shipping.postalCode}
              </p>
              <p>{orderDetails.shipping.country}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Items</h2>
            <div className="space-y-2">
              {orderDetails.items.map((item: any) => (
                <div key={item.id} className="bg-muted rounded-md p-4 flex justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
            <div className="bg-muted rounded-md p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(orderDetails.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping:</span>
                <span>{formatCurrency(orderDetails.shippingCost || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>{formatCurrency(orderDetails.tax || 0)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(orderDetails.total || 0)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" asChild>
              <Link href="/account/orders">View All Orders</Link>
            </Button>
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component that uses Suspense boundary
export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
} 