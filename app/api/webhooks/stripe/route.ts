import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed.`, err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        // Get the payment intent data
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`💰 Payment succeeded: ${paymentIntent.id}`);

        // Extract user information from metadata
        const userId = paymentIntent.metadata?.userId;
        const email = paymentIntent.metadata?.email;

        if (userId) {
          // Clear the user's cart when payment succeeds
          await clearUserCart(userId);
        } else if (email) {
          // Try to find user by email if userId isn't available
          const user = await prisma.user.findUnique({
            where: { email }
          });
          
          if (user) {
            await clearUserCart(user.id);
          }
        }

        // Store the successful payment as an order in your database
        // (You might already be doing this in another part of your application)
        
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`❌ Payment failed: ${paymentIntent.id}`);
        
        // Handle failed payment if needed
        break;
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to clear a user's cart
async function clearUserCart(userId: string) {
  try {
    console.log(`🧹 Clearing cart for user: ${userId}`);
    
    // Find user's cart
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true }
    });

    if (cart) {
      // Delete all cart items
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
      
      console.log(`✅ Cart cleared for user: ${userId}`);
    } else {
      console.log(`⚠️ No cart found for user: ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Error clearing cart for user ${userId}:`, error);
    throw error;
  }
} 