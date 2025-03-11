import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

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
        const cartId = paymentIntent.metadata?.cartId;

        // First, check if an order with this payment intent already exists
        // If it does, just update the status
        const existingOrder = await prisma.order.findFirst({
          where: { paymentIntentId: paymentIntent.id }
        });

        if (existingOrder) {
          // Order exists, update its status
          await updateOrderStatus(paymentIntent.id, OrderStatus.PROCESSING);
        } else {
          // Order doesn't exist, create a new one
          await createOrderFromPaymentIntent(paymentIntent);
        }

        // Clear the user's cart
        if (userId) {
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
        
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`❌ Payment failed: ${paymentIntent.id}`);
        
        // Update order status to CANCELLED if it exists
        await updateOrderStatus(paymentIntent.id, OrderStatus.CANCELLED);
        
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

// Helper function to create an order from a payment intent
async function createOrderFromPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
  try {
    const userId = paymentIntent.metadata?.userId;
    const email = paymentIntent.metadata?.email;
    const cartId = paymentIntent.metadata?.cartId;
    
    // If we don't have a user ID, we can't create an order
    if (!userId) {
      console.log(`⚠️ No user ID found in payment intent: ${paymentIntent.id}`);
      return;
    }
    
    // Generate a unique order number
    const orderNumber = 'ORD-' + Math.floor(Math.random() * 10000);
    
    // Tax rate is 8%
    const taxRate = 0.08;
    
    // Get the user's default address
    const userAddress = await prisma.address.findFirst({
      where: {
        userId: userId,
        isDefault: true
      }
    });

    // Define the type for cart items
    interface CartItemType {
      productId: string;
      productVariantId?: string | null;
      quantity: number;
      price: number;
      productName: string;
    }

    let cartItems: CartItemType[] = [];
    let subtotal = 0;
    let shippingCost = 0;
    let tax = 0;
    let total = 0;
    
    // PRIORITY 1: Extract cart items from payment intent metadata
    if (paymentIntent.metadata) {
      // First check if we have item_X_id fields in the metadata (detailed format)
      const itemCount = parseInt(paymentIntent.metadata.itemCount || '0');
      
      if (itemCount > 0) {
        console.log(`Webhook: Using item metadata for payment intent ${paymentIntent.id}`);
        
        // Extract items from individual metadata fields
        for (let i = 0; i < itemCount; i++) {
          const productId = paymentIntent.metadata[`item_${i}_id`];
          const productName = paymentIntent.metadata[`item_${i}_name`];
          const price = parseFloat(paymentIntent.metadata[`item_${i}_price`] || '0');
          const quantity = parseInt(paymentIntent.metadata[`item_${i}_qty`] || '1');
          const variantId = paymentIntent.metadata[`item_${i}_variant`] || null;
          
          if (productId && productName) {
            cartItems.push({
              productId,
              productVariantId: variantId,
              quantity,
              price,
              productName
            });
          }
        }
      }
      // If individual items weren't found, try the cartSnapshot field
      else if (paymentIntent.metadata.cartSnapshot) {
        console.log(`Webhook: Using cartSnapshot for payment intent ${paymentIntent.id}`);
        
        try {
          // If there's a single cartSnapshot field
          const snapshotData = JSON.parse(paymentIntent.metadata.cartSnapshot);
          
          if (snapshotData.items && Array.isArray(snapshotData.items)) {
            cartItems = snapshotData.items.map((item: any) => ({
              productId: item.productId,
              productVariantId: item.variantId || null,
              quantity: item.quantity,
              price: item.price,
              productName: item.productName
            }));
          }
        } catch (error) {
          console.error('Webhook: Error parsing cart snapshot from metadata:', error);
        }
      }
      // If chunked cartSnapshot, reconstruct it
      else if (paymentIntent.metadata.cartSnapshotChunks) {
        console.log(`Webhook: Using chunked cartSnapshot for payment intent ${paymentIntent.id}`);
        
        try {
          const chunks = parseInt(paymentIntent.metadata.cartSnapshotChunks);
          let fullSnapshot = '';
          
          for (let i = 0; i < chunks; i++) {
            const chunkKey = `cartSnapshot_${i}`;
            if (paymentIntent.metadata[chunkKey]) {
              fullSnapshot += paymentIntent.metadata[chunkKey];
            }
          }
          
          if (fullSnapshot) {
            const snapshotData = JSON.parse(fullSnapshot);
            
            if (snapshotData.items && Array.isArray(snapshotData.items)) {
              cartItems = snapshotData.items.map((item: any) => ({
                productId: item.productId,
                productVariantId: item.variantId || null,
                quantity: item.quantity,
                price: item.price,
                productName: item.productName
              }));
            }
          }
        } catch (error) {
          console.error('Webhook: Error reconstructing cart snapshot from chunks:', error);
        }
      }
    }
    
    // PRIORITY 2: If we didn't get items from metadata, use the user's cart
    if (cartItems.length === 0) {
      // Try to get cart items if they're still available
      let userCart = null;
      if (cartId) {
        userCart = await prisma.cart.findUnique({
          where: { id: cartId },
          include: { 
            items: {
              include: {
                product: true,
                productVariant: true
              }
            }
          }
        });
      }
      
      if (!userCart || userCart.items.length === 0) {
        // If we don't have a cart or it's empty, try to find the user's cart by user ID
        userCart = await prisma.cart.findFirst({
          where: { userId },
          include: { 
            items: {
              include: {
                product: true,
                productVariant: true
              }
            }
          }
        });
      }
      
      // If we have cart items, use them to create the order
      if (userCart && userCart.items.length > 0) {
        console.log(`Webhook: Using current cart for payment intent ${paymentIntent.id}`);
        
        // Create order from cart items
        subtotal = userCart.items.reduce((sum, item) => 
          sum + (Number(item.productVariant?.price || item.product.price) * item.quantity), 0);
        
        shippingCost = subtotal >= 100 ? 0 : 10;
        tax = Math.round(subtotal * taxRate * 100) / 100;
        total = subtotal + shippingCost + tax;
        
        cartItems = userCart.items.map(item => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          price: Number(item.productVariant?.price || item.product.price),
          productName: item.product.name,
        }));
      }
    }
    
    // If we got items from metadata, calculate values if not already set
    if (cartItems.length > 0 && subtotal === 0) {
      subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      shippingCost = subtotal >= 100 ? 0 : 10;
      tax = Math.round(subtotal * taxRate * 100) / 100;
      total = subtotal + shippingCost + tax;
    }
    
    // If we couldn't get cart items from any source, log an error and return
    if (cartItems.length === 0) {
      console.error(`❌ Webhook: Unable to create order - no cart items found for payment intent ${paymentIntent.id}`);
      return;
    }
     
    // Create the order with the real cart items we retrieved
    await prisma.order.create({
      data: {
        orderNumber,
        status: OrderStatus.PROCESSING,
        total,
        subtotal,
        tax,
        shipping: shippingCost,
        discount: 0,
        paymentIntentId: paymentIntent.id,
        userId,
        addressId: userAddress?.id,
        items: {
          create: cartItems.map(item => ({
            quantity: item.quantity,
            price: item.price,
            productId: item.productId,
            productVariantId: item.productVariantId,
          }))
        },
        statusUpdates: {
          create: {
            status: OrderStatus.PROCESSING,
            message: 'Order created automatically via webhook'
          }
        }
      }
    });
    
    console.log(`✅ Webhook: Order ${orderNumber} created successfully with ${cartItems.length} items`);
    
  } catch (error) {
    console.error(`❌ Error creating order from payment intent ${paymentIntent.id}:`, error);
    throw error;
  }
}

// Helper function to update order status
async function updateOrderStatus(paymentIntentId: string, status: OrderStatus) {
  try {
    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: { paymentIntentId },
      include: { items: true } // Include items to allow processing inventory
    });

    if (order) {
      console.log(`🔄 Updating order ${order.orderNumber} status to ${status}`);
      
      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: { status }
      });
      
      // Create a status update record
      await prisma.orderStatusUpdate.create({
        data: {
          orderId: order.id,
          status,
          message: `Order ${status.toLowerCase()} via payment webhook`
        }
      });
      
      // BUSINESS LOGIC: Add additional order processing here
      if (status === OrderStatus.PROCESSING) {
        // TODO: Update inventory based on order items
        // Example:
        // for (const item of order.items) {
        //   await prisma.product.update({
        //     where: { id: item.productId },
        //     data: { inventory: { decrement: item.quantity } }
        //   });
        // }
        
        // TODO: Send order confirmation email to customer
        // Example:
        // await sendOrderConfirmationEmail(order.id);
        
        // TODO: Notify admin of new order
        // Example:
        // await notifyAdminOfNewOrder(order.id);
      }
      
      console.log(`✅ Order ${order.orderNumber} status updated to ${status}`);
    } else {
      console.log(`⚠️ No order found for payment intent: ${paymentIntentId}`);
    }
  } catch (error) {
    console.error(`❌ Error updating order status for payment intent ${paymentIntentId}:`, error);
    throw error;
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