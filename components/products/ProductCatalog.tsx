'use client';

import { useState, useEffect } from 'react';
import ProductGrid from './ProductGrid';
import ProductFilter from './ProductFilter';
import ProductSort from './ProductSort';
import { PaginationButton } from '@/components/ui/pagination-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Product, Category } from '@prisma/client';

interface ProductWithImages extends Product {
  images: { url: string; alt: string }[];
  category: Category | null;
}

// Define filter state interface
interface FilterState {
  categoryIds: string[];
  minPrice: number;
  maxPrice: number;
  sort: string;
}

export default function ProductCatalog({
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
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [error, setError] = useState('');
  
  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    categoryIds: searchParams.category ? [searchParams.category] : [],
    minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : 0,
    maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : 1000,
    sort: searchParams.sort || 'newest',
  });
  
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = 12;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products based on filters
        const response = await fetch(`/api/products?${new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          sort: filters.sort,
          ...(filters.categoryIds.length > 0 && { categories: filters.categoryIds.join(',') }),
          ...(filters.minPrice > 0 && { minPrice: filters.minPrice.toString() }),
          ...(filters.maxPrice < 1000 && { maxPrice: filters.maxPrice.toString() }),
          ...(searchParams.search && { search: searchParams.search }),
        }).toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data.products);
        setTotalProducts(data.total);
        
        // Fetch categories if not already loaded
        if (categories.length === 0) {
          const categoriesResponse = await fetch('/api/categories');
          if (!categoriesResponse.ok) {
            throw new Error('Failed to fetch categories');
          }
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }
        
      } catch (err) {
        setError('An error occurred while fetching products. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters, searchParams.search, page, pageSize, categories.length]);
  
  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const totalPages = Math.ceil(totalProducts / pageSize);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      {/* Sidebar with filters */}
      <div className="space-y-6 lg:col-span-1">
        <div className="lg:hidden">
          <ProductSort
            currentSort={filters.sort}
            onSortChange={(sort: string) => updateFilters({ sort })}
          />
          <Separator className="my-4" />
        </div>
        
        <ProductFilter
          categories={categories}
          selectedCategoryIds={filters.categoryIds}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onFilterChange={updateFilters}
        />
      </div>
      
      {/* Main content area */}
      <div className="lg:col-span-3">
        <div className="hidden items-center justify-between mb-6 lg:flex">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{products.length}</span> of{' '}
            <span className="font-medium">{totalProducts}</span> products
          </p>
          
          <ProductSort
            currentSort={filters.sort}
            onSortChange={(sort: string) => updateFilters({ sort })}
          />
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <ProductGrid products={products} loading={loading} />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <PaginationButton 
              currentPage={page} 
              totalPages={totalPages} 
              baseUrl={`/products?${new URLSearchParams({
                ...(filters.categoryIds.length > 0 && { category: filters.categoryIds[0] }),
                ...(filters.sort !== 'newest' && { sort: filters.sort }),
                ...(filters.minPrice > 0 && { minPrice: filters.minPrice.toString() }),
                ...(filters.maxPrice < 1000 && { maxPrice: filters.maxPrice.toString() }),
                ...(searchParams.search && { search: searchParams.search }),
              }).toString()}`} 
            />
          </div>
        )}
      </div>
    </div>
  );
} 