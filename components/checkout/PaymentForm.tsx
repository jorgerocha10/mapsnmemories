'use client';

import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  onSuccess: () => void;
  onBack: () => void;
  clientSecret: string;
}

export default function PaymentForm({ onSuccess, onBack, clientSecret }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { totalAmount, clearCart, id: cartId } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  
  // This will help us detect if the payment succeeded but the redirect failed
  useEffect(() => {
    if (!stripe || !clientSecret) return;
    
    // Check the payment intent status
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (paymentIntent?.status === 'succeeded') {
        // If payment succeeded but we're still on this page (redirect failed),
        // clear the cart and show success message
        clearCart().then(() => {
          console.log('Cart cleared after payment success (no redirect)');
          onSuccess();
        });
      }
    });
  }, [stripe, clientSecret, clearCart, onSuccess]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // Attempt to clear cart before redirecting
      try {
        // We do this in a separate try/catch to not block the payment flow
        await clearCart();
        console.log('Cart cleared before redirect');
      } catch (clearError) {
        console.error('Failed to clear cart before redirect:', clearError);
        // Continue with payment even if cart clearing fails
      }
      
      // Update the payment intent with cart information if needed
      if (cartId) {
        try {
          await fetch('/api/checkout/payment-intent/update-metadata', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientSecret,
              metadata: {
                cartId,
              },
            }),
          });
        } catch (err) {
          console.error('Failed to update payment intent metadata:', err);
          // Continue with payment even if metadata update fails
        }
      }
      
      // Confirm the payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/confirmation`,
        }
      });
      
      // If we get here, there was an immediate error (not a redirect)
      if (error) {
        // Show error to your customer
        setErrorMessage(error.message || 'Something went wrong with your payment');
        console.error('Payment error:', error);
      }
      
      // We don't call onSuccess() here because the page will redirect on success
    } catch (err) {
      console.error('Error processing payment:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Details</h3>
        <PaymentElement />
        
        <Separator className="my-4" />
        
        <h3 className="text-lg font-medium">Billing Address</h3>
        <AddressElement options={{ mode: 'billing' }} />
        
        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="save-payment"
            checked={savePaymentMethod}
            onCheckedChange={(checked) => setSavePaymentMethod(!!checked)}
          />
          <Label htmlFor="save-payment">Save this payment method for future purchases</Label>
        </div>
      </div>
      
      {errorMessage && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <div className="space-y-4 pt-4">
        <div className="flex justify-between space-x-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={isProcessing}>
            Back
          </Button>
          <Button type="submit" className="flex-1" disabled={!stripe || isProcessing}>
            {isProcessing ? 'Processing...' : `Pay ${formatCurrency(totalAmount)}`}
          </Button>
        </div>
      </div>
    </form>
  );
} 