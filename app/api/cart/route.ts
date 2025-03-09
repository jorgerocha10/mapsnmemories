import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Get cart (either for logged in user or anonymous user with session cookie)
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    const userId = session?.user?.id;
    
    // Get session ID from cookies
    let sessionId = request.cookies.get('cartSessionId')?.value;
    
    if (!sessionId) {
      sessionId = uuidv4();
      // Note: In an API route, we can't set cookies directly,
      // so we'll handle this in the frontend
    }
    
    // Try to find user's cart
    let cart = null;
    
    if (userId) {
      // If user is logged in, find their cart or create one
      cart = await prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { position: 'asc' },
                    take: 1,
                  },
                },
              },
              productVariant: {
                include: {
                  options: true,
                },
              },
            },
          },
        },
      });
      
      // If user is logged in but doesn't have a cart, check if they have one by sessionId
      if (!cart && sessionId) {
        const sessionCart = await prisma.cart.findFirst({
          where: { sessionId },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: {
                      orderBy: { position: 'asc' },
                      take: 1,
                    },
                  },
                },
                productVariant: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        });
        
        // If there's a session cart, associate it with the user
        if (sessionCart) {
          cart = await prisma.cart.update({
            where: { id: sessionCart.id },
            data: { 
              userId, 
              sessionId: null, // Clear session ID as it's now associated with a user
            },
            include: {
              items: {
                include: {
                  product: {
                    include: {
                      images: {
                        orderBy: { position: 'asc' },
                        take: 1,
                      },
                    },
                  },
                  productVariant: {
                    include: {
                      options: true,
                    },
                  },
                },
              },
            },
          });
        }
      }
    } else if (sessionId) {
      // If not logged in, find cart by session ID
      cart = await prisma.cart.findFirst({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { position: 'asc' },
                    take: 1,
                  },
                },
              },
              productVariant: {
                include: {
                  options: true,
                },
              },
            },
          },
        },
      });
    }
    
    // If still no cart found, we'll create one later when items are added
    if (!cart) {
      return NextResponse.json({
        id: null,
        items: [],
        itemCount: 0,
        totalAmount: 0,
        sessionId,
      });
    }
    
    // Calculate totals
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => {
      const price = item.productVariant 
        ? Number(item.productVariant.price) 
        : Number(item.product.price);
      return sum + (price * item.quantity);
    }, 0);
    
    // Format the response
    const cartData = {
      id: cart.id,
      items: cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.images[0]?.url || null,
        variantId: item.productVariantId,
        variantName: item.productVariant?.name || null,
        variantOptions: item.productVariant?.options || [],
        price: item.productVariant 
          ? Number(item.productVariant.price) 
          : Number(item.product.price),
        quantity: item.quantity,
      })),
      itemCount,
      totalAmount,
      sessionId: !userId ? sessionId : null, // Only return sessionId for anonymous users
    };
    
    return NextResponse.json(cartData);
  } catch (error) {
    console.error('Error retrieving cart:', error);
    return NextResponse.json(
      { error: 'An error occurred while retrieving the cart' },
      { status: 500 }
    );
  }
} 