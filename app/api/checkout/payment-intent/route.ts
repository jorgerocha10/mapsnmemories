import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Initialize Stripe without specifying API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key');

// Schema for validating payment intent request
const paymentIntentSchema = z.object({
  amount: z.number().min(1).int(),
  currency: z.string().default('usd'),
  shipping: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
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
    
    const { amount, currency, shipping } = validation.data;

    // Find the user's cart and create a snapshot of its current state
    const userCart = await prisma.cart.findFirst({
      where: { userId: session.user.id as string },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            },
            productVariant: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      }
    });

    if (!userCart || userCart.items.length === 0) {
      return NextResponse.json(
        { 
          message: 'Empty cart',
          details: 'Your cart is empty. Please add items before checkout.'
        },
        { status: 400 }
      );
    }

    // Create a clean, serializable cart snapshot
    const cartSnapshot = {
      id: userCart.id,
      items: userCart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        price: Number(item.productVariant?.price || item.product.price),
        quantity: item.quantity,
        variantId: item.productVariantId,
        variantName: item.productVariant?.name || null
      }))
    };

    // Calculate total amount from cart snapshot to ensure consistency
    const cartTotal = cartSnapshot.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );

    // Add tax (8%)
    const taxRate = 0.08;
    // Ensure tax is rounded to 2 decimal places
    const tax = Math.round(cartTotal * taxRate * 100) / 100;
    
    // Add shipping (free over $100, otherwise $10)
    const shippingAmount = cartTotal >= 100 ? 0 : 10;
    
    // Calculate final total (in dollars)
    const finalTotal = cartTotal + tax + shippingAmount;
    
    // Convert to cents for Stripe (ensure we're using integer math)
    const finalAmountCents = Math.round(finalTotal * 100);

    // Store cart snapshot as a JSON string in metadata
    const snapshotString = JSON.stringify(cartSnapshot);
    
    // Create metadata object with base info
    type PaymentMetadata = {
      userId: string;
      email: string;
      cartId: string;
      cartSnapshot: string;
      cartTotal: string;
      tax: string;
      shipping: string;
      itemCount: string;
      shippingName?: string;
      shippingAddress?: string;
      shippingCity?: string;
      shippingState?: string;
      shippingPostal?: string;
      shippingCountry?: string;
    };

    const baseMetadata: PaymentMetadata = {
      userId: session.user.id || '',
      email: session.user.email || '',
      cartId: userCart.id,
      cartSnapshot: snapshotString.substring(0, 500), // Stripe metadata has a size limit
      cartTotal: cartTotal.toString(),
      tax: tax.toString(),
      shipping: shippingAmount.toString(),
      itemCount: userCart.items.length.toString()
    };

    // Add shipping information to metadata if provided
    if (shipping) {
      if (shipping.name) baseMetadata.shippingName = shipping.name;
      if (shipping.address) baseMetadata.shippingAddress = shipping.address;
      if (shipping.city) baseMetadata.shippingCity = shipping.city;
      if (shipping.state) baseMetadata.shippingState = shipping.state;
      if (shipping.postalCode) baseMetadata.shippingPostal = shipping.postalCode;
      if (shipping.country) baseMetadata.shippingCountry = shipping.country;
    }
    
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountCents, // Use calculated amount from actual cart
      currency,
      // Use automatic payment methods instead of specifying types
      automatic_payment_methods: { enabled: true },
      metadata: baseMetadata,
    });

    // If the snapshot is too large for one metadata field, split it across multiple fields
    if (snapshotString.length > 500) {
      const chunks = Math.ceil(snapshotString.length / 500);
      for (let i = 0; i < chunks; i++) {
        const start = i * 500;
        const end = Math.min((i + 1) * 500, snapshotString.length);
        const chunk = snapshotString.substring(start, end);
        
        // Update payment intent to add the additional chunk
        await stripe.paymentIntents.update(
          paymentIntent.id,
          {
            metadata: {
              [`cartSnapshot_${i}`]: chunk
            }
          }
        );
      }
      
      // Add a count of how many chunks we created
      await stripe.paymentIntents.update(
        paymentIntent.id,
        {
          metadata: {
            cartSnapshotChunks: chunks.toString()
          }
        }
      );
    }
    
    // Store cart summary as individual line items for better retrieval
    const itemsMetadata: Record<string, string> = {};
    cartSnapshot.items.forEach((item, index) => {
      itemsMetadata[`item_${index}_id`] = item.productId;
      itemsMetadata[`item_${index}_name`] = item.productName;
      itemsMetadata[`item_${index}_price`] = item.price.toString();
      itemsMetadata[`item_${index}_qty`] = item.quantity.toString();
      if (item.variantId) {
        itemsMetadata[`item_${index}_variant`] = item.variantId;
      }
    });
    
    // Add the summarized items to the payment intent metadata
    await stripe.paymentIntents.update(
      paymentIntent.id,
      {
        metadata: {
          ...itemsMetadata,
          itemCount: cartSnapshot.items.length.toString()
        }
      }
    );
    
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