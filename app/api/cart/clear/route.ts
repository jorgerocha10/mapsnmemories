import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    
    // Get the cartSessionId from the cookie (fix the cookie name)
    const sessionId = req.cookies.get('cartSessionId')?.value;
    
    // If there's no session ID and no authenticated user, there's nothing to clear
    if (!sessionId && !session?.user) {
      return NextResponse.json({ message: 'No cart found to clear' });
    }
    
    // Find the cart - either by user ID if authenticated or session ID if not
    const cart = await prisma.cart.findFirst({
      where: session?.user
        ? { userId: session.user.id as string }
        : { sessionId },
      include: {
        items: true,
      },
    });
    
    // If no cart is found, nothing to do
    if (!cart) {
      return NextResponse.json({ message: 'No cart found to clear' });
    }
    
    // Delete all cart items first (due to foreign key constraints)
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });
    
    // Don't delete the cart itself, just empty it - this preserves the user's cart ID
    // This approach is better than deleting the cart entirely
    
    // Also clear the cart sessionId if it exists to ensure a completely fresh cart next time
    if (sessionId) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { 
          sessionId: null
        }
      });
    }
    
    // Return success response
    return NextResponse.json({
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to clear cart',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 