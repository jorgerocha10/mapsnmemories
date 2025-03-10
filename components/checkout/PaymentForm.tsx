'use client';

import { useState } from 'react';
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
}

export default function PaymentForm({ onSuccess, onBack }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { totalAmount } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
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
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </Button>
        </div>
      </div>
    </form>
  );
} 