import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for validating review submission
const reviewSchema = z.object({
  productId: z.string().min(1, { message: 'Product ID is required' }),
  rating: z.number().min(1, { message: 'Rating must be at least 1' }).max(5, { message: 'Rating cannot be more than 5' }),
  title: z.string().optional(),
  content: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'You must be signed in to submit a review' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const result = reviewSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    const { productId, rating, title, content } = result.data;
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId,
      },
    });
    
    if (existingReview) {
      // Update existing review
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          title,
          content,
          isPublished: true,
          updatedAt: new Date(),
        },
      });
      
      return NextResponse.json(updatedReview);
    }
    
    // Create new review
    const review = await prisma.review.create({
      data: {
        rating,
        title,
        content,
        isPublished: true,
        userId,
        productId,
      },
    });
    
    return NextResponse.json(review);
  } catch (error) {
    console.error('Error creating/updating review:', error);
    return NextResponse.json(
      { error: 'An error occurred while submitting the review' },
      { status: 500 }
    );
  }
} 