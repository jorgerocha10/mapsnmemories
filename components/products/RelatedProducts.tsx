'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Product, Category } from '@prisma/client';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious 
} from '@/components/ui/carousel';

interface ProductWithDetails extends Product {
  category: Category | null;
  images: {
    id: string;
    url: string;
    alt: string | null;
    position: number;
  }[];
}

interface RelatedProductsProps {
  products: ProductWithDetails[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }
  
  return (
    <section className="mt-16 space-y-6">
      <h2 className="text-2xl font-bold">Related Products</h2>
      
      <Carousel
        opts={{
          align: 'start',
          loop: products.length > 3,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {products.map((product) => (
            <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <Link href={`/products/${product.id}`} passHref>
                <Card className="h-full overflow-hidden transition-all hover:shadow-md">
                  <div className="aspect-square relative overflow-hidden">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    {product.category && (
                      <p className="mb-2 text-xs text-muted-foreground">{product.category.name}</p>
                    )}
                    <h3 className="line-clamp-1 text-base font-medium">{product.name}</h3>
                    <p className="mt-2 font-medium">
                      {formatCurrency(Number(product.price))}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-end gap-2 mt-4">
          <CarouselPrevious className="relative" />
          <CarouselNext className="relative" />
        </div>
      </Carousel>
    </section>
  );
} 