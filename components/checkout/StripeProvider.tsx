'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

// Initialize Stripe (publishable key)
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  'pk_test_51OhLSYD1qUU9uZgQxmB2l8C7vGpPGBZIE3gvLwYDWQsqk0bxcbZZ5GdlC8JDuuQPvUCqW8SWMqJXn32sblQYc0m400hfQTbsQ2'
);

interface StripeProviderProps {
  children: ReactNode | ((props: { clientSecret: string }) => ReactNode);
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Create a payment intent when the component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/checkout/payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: 1000, // This will be replaced with the actual amount
            currency: 'usd',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // Check if it's an authentication error
          if (response.status === 401) {
            setIsAuthError(true);
            throw new Error("Authentication required to proceed with payment");
          }
          
          throw new Error(errorData.message || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, []);

  // Handle login redirect
  const handleLogin = () => {
    router.push('/auth/signin?callbackUrl=/checkout');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthError) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center space-y-4">
        <h2 className="text-xl font-semibold">Authentication Required</h2>
        <p className="text-muted-foreground">
          You need to be logged in to proceed with the checkout process.
        </p>
        <Button onClick={handleLogin} className="mt-4">
          <LogIn className="mr-2 h-4 w-4" />
          Sign In to Continue
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive bg-destructive/10 rounded-md">
        <p className="font-medium">Payment system error:</p>
        <p>{error}</p>
        <p className="mt-2">Please try again later or contact support.</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-4 text-destructive bg-destructive/10 rounded-md">
        Unable to initialize payment system. Please try again later.
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {typeof children === 'function' 
        ? children({ clientSecret }) 
        : children}
    </Elements>
  );
} 