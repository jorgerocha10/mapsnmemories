'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import ShippingForm from './ShippingForm';
import PaymentForm from './PaymentForm';
import OrderSummary from './OrderSummary';
import StripeProvider from './StripeProvider';
import { useCart } from '@/context/CartContext';

type CheckoutStep = 'shipping' | 'payment' | 'confirmation';

export default function CheckoutForm() {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingData, setShippingData] = useState<any>(null);
  const router = useRouter();
  const { clearCart } = useCart();

  const handleShippingSubmit = (data: any) => {
    setShippingData(data);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = () => {
    // Clear the cart after successful payment
    clearCart().then(() => {
      console.log('Cart cleared after successful payment');
    }).catch(err => {
      console.error('Failed to clear cart:', err);
    });
    
    // Redirect to confirmation page
    router.push('/checkout/confirmation');
  };

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('shipping');
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className={`flex flex-col items-center ${currentStep === 'shipping' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'shipping' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              1
            </div>
            <span className="mt-1 text-sm">Shipping</span>
          </div>
          <div className="flex-1 h-px bg-border mx-2"></div>
          <div className={`flex flex-col items-center ${currentStep === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
            <span className="mt-1 text-sm">Payment</span>
          </div>
          <div className="flex-1 h-px bg-border mx-2"></div>
          <div className={`flex flex-col items-center ${currentStep === 'confirmation' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'confirmation' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              3
            </div>
            <span className="mt-1 text-sm">Confirmation</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          {currentStep === 'shipping' && (
            <ShippingForm onSubmit={handleShippingSubmit} initialData={shippingData} />
          )}

          {currentStep === 'payment' && (
            <StripeProvider>
              {({ clientSecret }) => (
                <PaymentForm 
                  onSuccess={handlePaymentSuccess} 
                  onBack={handleBack} 
                  clientSecret={clientSecret} 
                />
              )}
            </StripeProvider>
          )}
        </div>

        <div className="md:col-span-1">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
} 