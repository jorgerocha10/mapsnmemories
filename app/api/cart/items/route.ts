import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Schema for validating add to cart requests
const addToCartSchema = z.object({
  productId: z.string().min(1, { message: 'Product ID is required' }),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' }).default(1),
});

// Schema for validating update cart item requests
const updateCartItemSchema = z.object({
  cartItemId: z.string().min(1, { message: 'Cart item ID is required' }),
  quantity: z.number().int().min(0, { message: 'Quantity must be at least 0' }),
});

// Add item to cart
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    const userId = session?.user?.id;
    
    // Get session ID from cookies
    let sessionId = request.cookies.get('cartSessionId')?.value;
    
    // If not logged in and no session ID, generate one
    if (!userId && !sessionId) {
      sessionId = uuidv4();
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const result = addToCartSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    const { productId, variantId, quantity } = result.data;
    
    // Check if product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId, isVisible: true },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or unavailable' },
        { status: 404 }
      );
    }
    
    // If a variant was specified, check if it exists
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId, productId },
      });
      
      if (!variant) {
        return NextResponse.json(
          { error: 'Product variant not found' },
          { status: 404 }
        );
      }
      
      // Check if variant has enough inventory
      if (variant.inventory < quantity) {
        return NextResponse.json(
          { error: 'Not enough inventory available', availableQuantity: variant.inventory },
          { status: 400 }
        );
      }
    } else {
      // Check if product has enough inventory
      if (product.inventory < quantity) {
        return NextResponse.json(
          { error: 'Not enough inventory available', availableQuantity: product.inventory },
          { status: 400 }
        );
      }
    }
    
    // Find or create cart
    let cart;
    
    if (userId) {
      // Try to find existing cart for user
      cart = await prisma.cart.findFirst({
        where: { userId },
      });
      
      if (!cart) {
        // Create new cart for user
        cart = await prisma.cart.create({
          data: {
            userId,
          },
        });
      }
    } else if (sessionId) {
      // Try to find existing cart for session
      cart = await prisma.cart.findFirst({
        where: { sessionId },
      });
      
      if (!cart) {
        // Create new cart for session
        cart = await prisma.cart.create({
          data: {
            sessionId,
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: 'No user session available' },
        { status: 400 }
      );
    }
    
    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        ...(variantId ? { productVariantId: variantId } : { productVariantId: null }),
      },
    });
    
    let cartItem;
    
    if (existingCartItem) {
      // Update existing cart item quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
      });
    } else {
      // Add new item to cart
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          ...(variantId ? { productVariantId: variantId } : {}),
          quantity,
        },
      });
    }
    
    // Build response with cookie for anonymous users
    const response = NextResponse.json({
      success: true,
      cartItem,
      sessionId: !userId ? sessionId : null,
    });
    
    // If anonymous user, set the session ID cookie
    if (!userId && sessionId) {
      response.cookies.set({
        name: 'cartSessionId',
        value: sessionId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json(
      { error: 'An error occurred while adding the item to cart' },
      { status: 500 }
    );
  }
}

// Update cart item (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    const userId = session?.user?.id;
    const sessionId = request.cookies.get('cartSessionId')?.value;
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const result = updateCartItemSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    const { cartItemId, quantity } = result.data;
    
    // Find the cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });
    
    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }
    
    // Verify the cart belongs to the current user/session
    if (
      (userId && cartItem.cart.userId !== userId) ||
      (!userId && sessionId && cartItem.cart.sessionId !== sessionId) ||
      (!userId && !sessionId)
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    if (quantity === 0) {
      // Remove the item if quantity is 0
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });
      
      return NextResponse.json({ success: true, deleted: true });
    } else {
      // Update the item quantity
      const updatedCartItem = await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });
      
      return NextResponse.json({ success: true, cartItem: updatedCartItem });
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the cart item' },
      { status: 500 }
    );
  }
}

// Delete cart item (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    // Get the cart item ID from the URL search params
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('id');
    
    if (!cartItemId) {
      return NextResponse.json(
        { error: 'Cart item ID is required' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const session = await auth();
    const userId = session?.user?.id;
    const sessionId = request.cookies.get('cartSessionId')?.value;
    
    // Find the cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });
    
    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }
    
    // Verify the cart belongs to the current user/session
    if (
      (userId && cartItem.cart.userId !== userId) ||
      (!userId && sessionId && cartItem.cart.sessionId !== sessionId) ||
      (!userId && !sessionId)
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the cart item' },
      { status: 500 }
    );
  }
} 