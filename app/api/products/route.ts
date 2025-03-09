import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');
    const sort = searchParams.get('sort') || 'newest';
    const categories = searchParams.get('categories')?.split(',') || [];
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice') || '0') : 0;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice') || '1000') : 1000;
    const search = searchParams.get('search') || '';
    
    // Create the where clause
    const where: any = {
      isVisible: true,
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
      ...(categories.length > 0 && {
        categoryId: {
          in: categories,
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    
    // Set up sorting
    let orderBy: any = {};
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
      case 'name-desc':
        orderBy = { name: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }
    
    // Calculate pagination
    const skip = (page - 1) * pageSize;
    
    // Get total count for pagination
    const total = await prisma.product.count({ where });
    
    // Get products with pagination, filtering, and sorting
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        images: {
          select: {
            url: true,
            alt: true,
            position: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching products' },
      { status: 500 }
    );
  }
} 