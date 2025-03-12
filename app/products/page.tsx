import { Suspense } from 'react';
import { Metadata } from 'next';
import ProductCatalog from '@/components/products/ProductCatalog';
import ProductsLoading from '@/components/products/ProductsLoading';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Products | E-commerce Store',
  description: 'Browse our extensive collection of products',
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: {
    category?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
  };
}) {
  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Products</h1>
      
      <Suspense fallback={<ProductsLoading />}>
        <ProductCatalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
} 