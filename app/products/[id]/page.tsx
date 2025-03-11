import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductGallery from '@/components/products/ProductGallery';
import ProductInfo from '@/components/products/ProductInfo';
import ProductReviews from '@/components/products/ProductReviews';
import RelatedProducts from '@/components/products/RelatedProducts';
import BackButton from '@/components/products/BackButton';
import { Product, ProductVariant, Review, Category } from '@prisma/client';

// Define interfaces for product-related data
interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

interface ProductVariantWithOptions extends ProductVariant {
  options: {
    id: string;
    name: string;
    value: string;
  }[];
}

interface ReviewWithUser extends Review {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ProductWithRelations extends Omit<Product, 'price' | 'compareAtPrice' | 'weight' | 'createdAt' | 'updatedAt'> {
  price: number | null;
  compareAtPrice: number | null;
  weight: number | null;
  category: Category | null;
  images: ProductImage[];
  variants: ProductVariantWithOptions[];
  reviews: ReviewWithUser[];
  createdAt: string;
  updatedAt: string;
}

// Helper function to serialize product data
// @ts-ignore
function serializeProduct(product: any) {
  if (!product) return null;
  
  return {
    ...product,
    price: product.price ? Number(product.price) : null,
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    weight: product.weight ? Number(product.weight) : null,
    variants: product.variants ? product.variants.map((variant: any) => ({
      ...variant,
      price: variant.price ? Number(variant.price) : null,
    })) : [],
    createdAt: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString(),
    reviews: product.reviews ? product.reviews.map((review: any) => ({
      ...review,
      createdAt: review.createdAt ? review.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: review.updatedAt ? review.updatedAt.toISOString() : new Date().toISOString(),
    })) : [],
  };
}

// Generate metadata for SEO
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  // Await the params before accessing properties
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [
        {
          url: product.images[0]?.url || '/placeholder-product.jpg',
          width: 1200,
          height: 630,
          alt: product.name
        }
      ]
    },
  };
}

// Fetch product data
async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            position: 'asc',
          },
        },
        category: true,
        variants: {
          include: {
            options: true,
          },
        },
        reviews: {
          where: {
            isPublished: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Get related products
async function getRelatedProducts(productId: string, categoryId: string | null) {
  try {
    // Find products in the same category, excluding the current product
    const products = await prisma.product.findMany({
      where: {
        categoryId: categoryId,
        id: {
          not: productId,
        },
        isVisible: true,
      },
      include: {
        images: {
          orderBy: {
            position: 'asc',
          },
        },
        category: true,
      },
      take: 4,
    });
    
    return products.map(product => serializeProduct(product));
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await the params before accessing properties
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    notFound();
  }

  // Get related products based on same category
  const relatedProducts = await getRelatedProducts(
    resolvedParams.id, 
    product.categoryId
  );
  
  // Serialize the product to convert Decimal to number
  const serializedProduct = serializeProduct(product);
  
  // If serialization failed, show 404 page
  if (!serializedProduct) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton />
      
      <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
        {/* Product gallery */}
        <ProductGallery images={serializedProduct.images} productName={serializedProduct.name} />
        
        {/* Product information */}
        <ProductInfo product={serializedProduct} />
      </div>
      
      {/* Product reviews */}
      <ProductReviews 
        reviews={serializedProduct.reviews} 
        productId={serializedProduct.id} 
      />
      
      {/* Related products */}
      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} />
      )}
    </div>
  );
} 