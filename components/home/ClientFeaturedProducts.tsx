"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

// Interface for product data
interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

interface Product {
  id: string;
  name: string;
  price: string | number;
  images: ProductImage[];
  category: {
    id: string;
    name: string;
  } | null;
}

export function ClientFeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products/newest');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return <FeaturedProductsSkeleton />;
  }

  if (products.length === 0) {
    return <FeaturedProductsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  // Get the first image or use a placeholder
  const thumbnailImage = product.images[0] || null;
  const imageUrl = thumbnailImage?.url || '/placeholder.png';
  const imageAlt = thumbnailImage?.alt || `${product.name} product image`;
  
  // Fix price formatting - check if price might be in cents
  const price = Number(product.price);
  const formattedPrice = price > 100 ? formatCurrency(price / 100) : formatCurrency(price);
  
  return (
    <Link href={`/products/${product.id}`} className="group">
      <Card className="h-full overflow-hidden transition-all hover:shadow-md">
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium">{product.name}</h3>
          <p className="text-sm text-muted-foreground">
            {formattedPrice}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="h-full overflow-hidden">
          <div className="aspect-square">
            <Skeleton className="h-full w-full" />
          </div>
          <CardContent className="p-4">
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 