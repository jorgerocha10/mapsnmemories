import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Product, Category } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductWithImages extends Product {
  images: { url: string; alt: string }[];
  category: Category | null;
}

interface ProductGridProps {
  products: ProductWithImages[];
  loading: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  // If loading, show skeleton loading UI
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // If no products, show empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-xl font-medium">No products found</h3>
        <p className="mt-2 text-center text-muted-foreground">
          Try adjusting your filters or search term
        </p>
      </div>
    );
  }

  // Show product grid
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: ProductWithImages }) {
  const thumbnailImage = product.images[0] || { url: '/placeholder.png', alt: 'Product image' };
  
  return (
    <Link href={`/products/${product.id}`} passHref>
      <Card className="h-full overflow-hidden transition-all hover:shadow-md">
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={thumbnailImage.url}
            alt={thumbnailImage.alt}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <CardContent className="p-4">
          {product.category && (
            <p className="mb-2 text-xs text-muted-foreground">{product.category.name}</p>
          )}
          <h3 className="line-clamp-1 text-lg font-medium">{product.name}</h3>
          <p className="line-clamp-2 mt-1 text-sm text-muted-foreground">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between p-4 pt-0">
          <div className="flex items-center">
            <p className="font-medium">
              {formatCurrency(Number(product.price))}
            </p>
            {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
              <p className="ml-2 text-sm text-muted-foreground line-through">
                {formatCurrency(Number(product.compareAtPrice))}
              </p>
            )}
          </div>
          {product.inventory <= 5 && product.inventory > 0 && (
            <p className="text-xs font-medium text-amber-600">Only {product.inventory} left</p>
          )}
          {product.inventory === 0 && (
            <p className="text-xs font-medium text-destructive">Out of stock</p>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="aspect-square">
        <Skeleton className="h-full w-full" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-5 w-16" />
      </CardFooter>
    </Card>
  );
} 