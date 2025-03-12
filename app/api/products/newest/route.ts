import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure this is not cached

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isVisible: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 4,
      include: {
        images: true,
        category: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching newest products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 