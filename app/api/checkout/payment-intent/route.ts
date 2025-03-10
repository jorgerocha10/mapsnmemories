import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Stripe from 'stripe';
import { z } from 'zod';

// Initialize Stripe without specifying API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key');

// Schema for validating payment intent request
const paymentIntentSchema = z.object({
  amount: z.number().min(1).int(),
  currency: z.string().default('usd'),
});

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          message: 'Authentication required',
          details: 'You must be logged in to create a payment intent.'
        },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = paymentIntentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { amount, currency } = validation.data;
    
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      // Use automatic payment methods instead of specifying types
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: session.user.id || '',
        email: session.user.email || '',
      },
    });
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // Handle Stripe errors specifically
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          message: 'Payment processing error',
          details: error.message 
        },
        { status: error.statusCode || 500 }
      );
    }
    
    return NextResponse.json(
      { 
        message: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 