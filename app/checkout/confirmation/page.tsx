'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/context/CartContext';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

// Client component that uses the search params
function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartCleared, setCartCleared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get payment_intent and payment_intent_client_secret from URL
  const paymentIntentId = searchParams.get('payment_intent');
  const paymentStatus = searchParams.get('redirect_status');

  useEffect(() => {
    // If we don't have payment info in the URL, this might not be a proper redirect
    if (!paymentIntentId || !paymentStatus) {
      setIsLoading(false);
      setError('Missing payment information in URL');
      return;
    }

    // Perform payment confirmation steps in the correct order
    const performOrderConfirmation = async () => {
      try {
        setIsLoading(true);
        
        // Step 1: Clear the cart immediately if payment succeeded
        // This needs to happen first to prevent race conditions
        if (paymentStatus === 'succeeded' && !cartCleared) {
          console.log('Starting cart clearing before fetching order...');
          
          try {
            await clearCart();
            setCartCleared(true);
            console.log('Cart cleared successfully');
            
            // Also make a direct API call as a backup
            try {
              await fetch('/api/cart/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              console.log('Additional direct API call to clear cart succeeded');
            } catch (directApiError) {
              console.error('Direct API call to clear cart failed:', directApiError);
            }
          } catch (err) {
            console.error('Failed to clear cart:', err);
            // Continue to order fetching even if cart clearing fails
          }
        }
        
        // Step 2: Fetch order details from our API after cart is cleared
        console.log('Fetching order details...');
        const response = await fetch(`/api/checkout/order?payment_intent=${paymentIntentId}`);
        
        if (!response.ok) {
          // Get more details about the error
          let errorDetail = '';
          try {
            const errorData = await response.json();
            errorDetail = errorData.details || errorData.message || '';
          } catch (e) {
            // If we can't parse the error JSON, use the status text
            errorDetail = response.statusText;
          }
          
          throw new Error(`Failed to fetch order details: ${errorDetail}`);
        }
        
        const data = await response.json();
        
        // Ensure shipping property exists to prevent null reference errors
        if (!data.shipping) {
          data.shipping = {
            name: 'Customer',
            address: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          };
        }
        
        setOrderDetails(data);
        console.log('Order details retrieved successfully');
      } catch (error) {
        console.error('Error during order confirmation:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        
        // Create a fallback order with minimal info - only for display purposes
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
        
        // Show error toast
        if (typeof window !== 'undefined') {
          toast({
            title: 'Error loading order details',
            description: error instanceof Error ? error.message : 'Failed to load order information',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    performOrderConfirmation();
    
    // Add a fallback cart clearing mechanism - try again after a delay
    // This helps in case the first attempts fail
    const fallbackClearTimeout = setTimeout(() => {
      if (!cartCleared && paymentStatus === 'succeeded') {
        console.log('Running fallback cart clearing...');
        clearCart().then(() => {
          console.log('Fallback cart clearing succeeded');
          setCartCleared(true);
        }).catch(err => {
          console.error('Even fallback cart clearing failed:', err);
        });
      }
    }, 3000); // Wait 3 seconds before trying again
    
    // Clean up the timeout
    return () => clearTimeout(fallbackClearTimeout);
  }, [paymentIntentId, paymentStatus, clearCart, cartCleared]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Local format function that handles cents-to-dollars conversion
  // This is necessary because our API returns cents but our utils function expects dollars
  const formatOrderAmount = (amountInCents: number) => {
    return formatCurrency(amountInCents / 100);
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
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            We couldn't find any order information. This might be because:
          </p>
          <ul className="text-left list-disc pl-6 mb-6 space-y-2">
            <li>You arrived at this page directly without completing a checkout</li>
            <li>There was an issue processing your payment</li>
            <li>The order information is still being processed</li>
          </ul>
          {error && (
            <div className="mb-6 p-4 bg-destructive/5 rounded-md text-sm text-left">
              <p className="font-semibold">Error details:</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Make sure shipping data exists
  const shipping = orderDetails.shipping || {
    name: 'Customer',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  };

  // Check if we have meaningful shipping data to display
  const hasShippingAddress = shipping.address && shipping.city && shipping.state;

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
                <span className="font-semibold">{formatOrderAmount(orderDetails.total)}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
            <div className="bg-muted rounded-md p-4">
              {hasShippingAddress ? (
                <>
                  <p>{shipping.name}</p>
                  <p>{shipping.address}</p>
                  <p>
                    {shipping.city}, {shipping.state}{' '}
                    {shipping.postalCode}
                  </p>
                  <p>{shipping.country}</p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Shipping information not available. Please check your email for delivery details.
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Items</h2>
            {!orderDetails.items || orderDetails.items.length === 0 ? (
              <div className="bg-muted rounded-md p-4 text-center text-muted-foreground">
                No items found in this order.
              </div>
            ) : (
              <div className="space-y-2">
                {orderDetails.items.map((item: any) => (
                  <div key={item.id} className="bg-muted rounded-md p-4 flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatOrderAmount(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
            <div className="bg-muted rounded-md p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatOrderAmount(orderDetails.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping:</span>
                {orderDetails.shippingCost === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <span>{formatOrderAmount(orderDetails.shippingCost || 0)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (8%):</span>
                <span>{formatOrderAmount(orderDetails.tax || 0)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatOrderAmount(orderDetails.total || 0)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/orders">View All Orders</Link>
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