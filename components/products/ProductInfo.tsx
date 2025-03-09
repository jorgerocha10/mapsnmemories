'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Product, ProductVariant, Category } from '@prisma/client';

interface VariantWithOptions extends ProductVariant {
  options: { 
    id: string; 
    name: string; 
    value: string; 
  }[];
}

interface ProductWithRelations extends Product {
  category: Category | null;
  variants: VariantWithOptions[];
  images: {
    id: string;
    url: string;
    alt: string | null;
    position: number;
  }[];
}

interface ProductInfoProps {
  product: ProductWithRelations;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants.length > 0 ? product.variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Get the selected variant
  const selectedVariant = selectedVariantId
    ? product.variants.find(v => v.id === selectedVariantId)
    : null;
  
  // Calculate the price to display
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const originalPrice = product.compareAtPrice;
  const hasDiscount = originalPrice && Number(originalPrice) > Number(displayPrice);
  
  // Calculate the stock status
  const inventory = selectedVariant ? selectedVariant.inventory : product.inventory;
  const isLowStock = inventory > 0 && inventory <= 5;
  const isOutOfStock = inventory === 0;
  
  // Group variants by option types (e.g., "Color", "Size")
  const optionGroups = product.variants.length > 0
    ? product.variants[0].options.reduce<Record<string, Set<string>>>((acc, option) => {
        if (!acc[option.name]) {
          acc[option.name] = new Set();
        }
        
        // Collect all unique values for each option type across variants
        product.variants.forEach(variant => {
          const matchingOption = variant.options.find(opt => opt.name === option.name);
          if (matchingOption) {
            acc[option.name].add(matchingOption.value);
          }
        });
        
        return acc;
      }, {})
    : {};
  
  // Handle variant change
  const handleVariantChange = (optionName: string, value: string) => {
    // Find the variant that matches the current selection plus the new selection
    const currentVariant = selectedVariantId 
      ? product.variants.find(v => v.id === selectedVariantId)
      : null;
    
    // Start with current selection
    const selectedOptions = new Map<string, string>();
    
    if (currentVariant) {
      currentVariant.options.forEach(opt => {
        selectedOptions.set(opt.name, opt.value);
      });
    }
    
    // Update with new selection
    selectedOptions.set(optionName, value);
    
    // Find matching variant
    const matchingVariant = product.variants.find(variant => {
      // A variant matches if it has all selected options
      return Array.from(selectedOptions.entries()).every(([name, value]) => {
        return variant.options.some(opt => opt.name === name && opt.value === value);
      });
    });
    
    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      
      // Add item to cart
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId,
          quantity,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }
      
      // Redirect to cart page
      router.push('/cart');
    } catch (error) {
      console.error('Error adding item to cart:', error);
      // You could add a toast notification here
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Product title and price */}
      <div>
        {product.category && (
          <Link href={`/products?category=${product.category.id}`} className="text-sm text-muted-foreground hover:text-foreground">
            {product.category.name}
          </Link>
        )}
        <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
        
        <div className="mt-4 flex items-end gap-2">
          <span className="text-2xl font-semibold">
            {formatCurrency(Number(displayPrice))}
          </span>
          
          {hasDiscount && (
            <span className="text-lg text-muted-foreground line-through">
              {formatCurrency(Number(originalPrice))}
            </span>
          )}
          
          {hasDiscount && (
            <Badge variant="secondary" className="ml-2">
              {Math.round((1 - Number(displayPrice) / Number(originalPrice)) * 100)}% OFF
            </Badge>
          )}
        </div>
      </div>
      
      <Separator />
      
      {/* Product variants */}
      {product.variants.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-medium">Options</h2>
          
          {Object.entries(optionGroups).map(([optionName, values]) => (
            <div key={optionName} className="space-y-2">
              <h3 className="text-sm font-medium">{optionName}</h3>
              <Select 
                value={selectedVariant?.options.find(o => o.name === optionName)?.value || ''}
                onValueChange={(value) => handleVariantChange(optionName, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${optionName}`} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(values).map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
      
      {/* Quantity selector */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Quantity</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isOutOfStock}
          >
            -
          </Button>
          <span className="w-8 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            disabled={isOutOfStock}
          >
            +
          </Button>
        </div>
      </div>
      
      {/* Add to cart button */}
      <div className="space-y-4">
        <Button
          className="w-full text-base"
          size="lg"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAddingToCart}
        >
          {isAddingToCart ? (
            "Adding to Cart..."
          ) : isOutOfStock ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </>
          )}
        </Button>
        
        {/* Stock status indicator */}
        {isLowStock && (
          <div className="flex items-center justify-center text-sm text-amber-600">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Only {inventory} items left in stock
          </div>
        )}
        
        {isOutOfStock && (
          <div className="flex items-center justify-center text-sm text-destructive">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Out of stock
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* Product description */}
      <div className="space-y-4">
        <h2 className="font-medium">Description</h2>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p>{product.description}</p>
        </div>
      </div>
      
      {/* Product details */}
      <div className="space-y-4">
        <h2 className="font-medium">Product Details</h2>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-2 gap-px divide-x bg-muted text-sm">
            {product.sku && (
              <>
                <div className="p-3 bg-card">SKU</div>
                <div className="p-3 bg-card">{product.sku}</div>
              </>
            )}
            {product.dimensions && (
              <>
                <div className="p-3 bg-card">Dimensions</div>
                <div className="p-3 bg-card">{product.dimensions}</div>
              </>
            )}
            {product.weight && (
              <>
                <div className="p-3 bg-card">Weight</div>
                <div className="p-3 bg-card">{Number(product.weight)} kg</div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 