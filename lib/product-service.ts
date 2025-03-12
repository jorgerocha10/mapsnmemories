import prisma from './prisma';
import { Product, Category, ProductImage } from '@prisma/client';

export interface ProductWithImages extends Product {
  images: ProductImage[];
  category: Category | null;
}

/**
 * Fetches the newest products from the database
 * @param limit Number of products to fetch (default: 4)
 * @returns Array of products with their images and category
 */
export async function getNewestProducts(limit = 4): Promise<ProductWithImages[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isVisible: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        images: true,
        category: true,
      },
    });

    return products;
  } catch (error) {
    console.error('Failed to fetch newest products:', error);
    return [];
  }
} 