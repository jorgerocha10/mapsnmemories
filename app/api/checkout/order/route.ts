import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key');

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          message: 'Authentication required',
          details: 'You must be logged in to view order details.'
        },
        { status: 401 }
      );
    }
    
    // Get payment intent ID from URL
    const paymentIntentId = request.nextUrl.searchParams.get('payment_intent');
    
    if (!paymentIntentId) {
      return NextResponse.json(
        { 
          message: 'Missing payment intent ID',
          details: 'Payment intent ID is required to retrieve order details.'
        },
        { status: 400 }
      );
    }
    
    // First, check if an order with this payment intent already exists
    let existingOrder = await prisma.order.findFirst({
      where: { 
        paymentIntentId: paymentIntentId
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        address: true,
        statusUpdates: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });
    
    // If we already have the order in our database, return it
    if (existingOrder) {
      // Format the response to match our expected structure
      const shippingAddress = existingOrder.address 
        ? {
            name: session.user.name || 'Customer',
            address: existingOrder.address.street,
            city: existingOrder.address.city,
            state: existingOrder.address.state,
            postalCode: existingOrder.address.postalCode,
            country: existingOrder.address.country
          }
        : {
            name: session.user.name || 'Customer',
            address: 'N/A',
            city: 'N/A',
            state: 'N/A',
            postalCode: 'N/A',
            country: 'N/A'
          };
          
      return NextResponse.json({
        id: existingOrder.orderNumber,
        date: existingOrder.createdAt.toISOString(),
        status: existingOrder.status.toLowerCase(),
        paymentStatus: existingOrder.paymentIntentId ? 'paid' : 'pending', // Derive from payment intent existence
        subtotal: Number(existingOrder.subtotal),
        shippingCost: Number(existingOrder.shipping),
        tax: Number(existingOrder.tax),
        total: Number(existingOrder.total),
        items: existingOrder.items.map(item => ({
          id: item.id,
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.price)
        })),
        shipping: shippingAddress
      });
    }
    
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return NextResponse.json(
        { 
          message: 'Payment intent not found',
          details: 'The specified payment intent could not be found.'
        },
        { status: 404 }
      );
    }
    
    // Define the type for cart items to avoid implicit any
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
    let calculatedTotal = 0;
    
    // PRIORITY 1: First try to reconstruct cart items from the payment intent metadata
    // This is the most reliable source since it captures the cart at checkout time
    if (paymentIntent.metadata) {
      console.log(`Attempting to reconstruct cart from payment intent metadata for ${paymentIntentId}`);
      
      // First check if we have item_X_id fields in the metadata (detailed format)
      const itemCount = parseInt(paymentIntent.metadata.itemCount || '0');
      
      if (itemCount > 0) {
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
      // If individual items weren't found, try the JSON string format
      else if (paymentIntent.metadata.cartSnapshot) {
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
          console.error('Error parsing cart snapshot from metadata:', error);
        }
      } else if (paymentIntent.metadata.cartSnapshotChunks) {
        // If the cart snapshot is split across multiple metadata fields
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
          console.error('Error reconstructing cart snapshot from chunks:', error);
        }
      }
      
      // If we got items from metadata, calculate values
      if (cartItems.length > 0) {
        subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        shippingCost = subtotal >= 100 ? 0 : 10;
        tax = Math.round(subtotal * 0.08 * 100) / 100;
        calculatedTotal = subtotal + shippingCost + tax;
      }
    }
    
    // PRIORITY 2: If we didn't get cart items from metadata, check the user's current cart
    if (cartItems.length === 0) {
      // Retrieve the metadata from the payment intent, which might contain cart ID
      const cartId = paymentIntent.metadata?.cartId;
      
      // Find the user's cart and items
      let userCart;
      
      // Check if we have a cart ID in the payment intent metadata
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
      
      // If we couldn't find the cart by ID from metadata, try to find by user ID
      if (!userCart && session.user.id) {
        userCart = await prisma.cart.findFirst({
          where: { userId: session.user.id as string },
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
      
      // If we have cart items, use them for the order
      if (userCart && userCart.items.length > 0) {
        console.log(`Using current cart for payment intent ${paymentIntentId}`);
        
        // Calculate values based on actual cart items
        subtotal = userCart.items.reduce((sum, item) => 
          sum + (Number(item.productVariant?.price || item.product.price) * item.quantity), 0);
        
        // Calculate shipping cost (free over $100, otherwise $10)
        shippingCost = subtotal >= 100 ? 0 : 10;
        
        // Calculate tax (8%)
        tax = Math.round(subtotal * 0.08 * 100) / 100;
        
        // Calculate total
        calculatedTotal = subtotal + shippingCost + tax;
        
        // Map cart items to the format needed for order items
        cartItems = userCart.items.map(item => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          price: Number(item.productVariant?.price || item.product.price),
          productName: item.product.name,
        }));
      }
    }
    
    // If we still don't have any cart items after exhausting all options, return an error
    if (cartItems.length === 0) {
      return NextResponse.json(
        { 
          message: 'Unable to create order',
          details: 'Could not find cart items for this payment. The cart may have been cleared before order creation.'
        },
        { status: 400 }
      );
    }
    
    // Generate a unique order number
    const orderNumber = 'ORD-' + Math.floor(Math.random() * 10000);
    
    // Check if user has a default address
    const userAddress = await prisma.address.findFirst({
      where: {
        userId: session.user.id as string,
        isDefault: true
      }
    });
    
    let createdOrder = null;
    
    // If payment was successful, save the order to the database
    if (paymentIntent.status === 'succeeded') {
      try {
        // Create the order in the database with real cart items
        createdOrder = await prisma.order.create({
          data: {
            orderNumber: orderNumber,
            status: OrderStatus.PENDING, // Initial status
            total: calculatedTotal,
            subtotal: subtotal,
            tax: tax,
            shipping: shippingCost,
            discount: 0, // No discount in this example
            paymentIntentId: paymentIntentId,
            userId: session.user.id as string,
            addressId: userAddress?.id, // Link to user's address if available
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
                status: OrderStatus.PENDING,
                message: 'Order placed successfully'
              }
            }
          }
        });
        
        console.log(`Order created successfully: ${orderNumber} with ${cartItems.length} items`);
      } catch (orderError) {
        console.error('Error creating order:', orderError);
        return NextResponse.json(
          { 
            message: 'Failed to create order',
            details: orderError instanceof Error ? orderError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }
    
    // Create shipping information based on real address
    const shippingInfo = {
      name: session.user.name || 'Customer',
      address: userAddress?.street || 'N/A',
      city: userAddress?.city || 'N/A',
      state: userAddress?.state || 'N/A',
      postalCode: userAddress?.postalCode || 'N/A',
      country: userAddress?.country || 'N/A',
    };
    
    // Create order details for response with exact cart items
    const orderDetails = {
      id: orderNumber,
      date: new Date().toISOString(),
      status: 'confirmed',
      paymentStatus: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
      subtotal,
      shippingCost,
      tax,
      total: calculatedTotal,
      items: cartItems.map(item => ({
        id: item.productId,
        name: item.productName,
        quantity: item.quantity,
        price: item.price
      })),
      shipping: shippingInfo
    };
    
    return NextResponse.json(orderDetails);
  } catch (error) {
    console.error('Error retrieving order details:', error);
    
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
        message: 'Failed to retrieve order details',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 