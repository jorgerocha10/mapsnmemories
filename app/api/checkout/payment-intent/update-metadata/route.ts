import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Stripe from 'stripe';
import { z } from 'zod';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key');

// Schema for validation
const updateMetadataSchema = z.object({
  clientSecret: z.string(),
  metadata: z.record(z.string(), z.string().or(z.number()).or(z.boolean()).optional()),
});

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          message: 'Authentication required',
          details: 'You must be logged in to update payment metadata.'
        },
        { status: 401 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validation = updateMetadataSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { clientSecret, metadata } = validation.data;
    
    // Extract payment intent ID from client secret
    const paymentIntentId = clientSecret.split('_secret_')[0];
    
    if (!paymentIntentId) {
      return NextResponse.json(
        { message: 'Invalid client secret' },
        { status: 400 }
      );
    }

    // Add user info to metadata
    const enhancedMetadata = {
      ...metadata,
      userId: session.user.id || '',
      email: session.user.email || '',
      name: session.user.name || '',
    };
    
    // Update the payment intent
    const paymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      {
        metadata: enhancedMetadata,
      }
    );
    
    return NextResponse.json({
      message: 'Payment intent metadata updated successfully',
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error updating payment intent metadata:', error);
    
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
        message: 'Failed to update payment intent metadata',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 