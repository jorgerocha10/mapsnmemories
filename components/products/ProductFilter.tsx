'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Category } from '@prisma/client';

interface ProductFilterProps {
  categories: Category[];
  selectedCategoryIds: string[];
  minPrice: number;
  maxPrice: number;
  onFilterChange: (filters: {
    categoryIds?: string[];
    minPrice?: number;
    maxPrice?: number;
  }) => void;
}

export default function ProductFilter({
  categories,
  selectedCategoryIds,
  minPrice,
  maxPrice,
  onFilterChange,
}: ProductFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  
  // Update price range when props change
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);
  
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    let newCategories = [...selectedCategoryIds];
    
    if (checked) {
      newCategories.push(categoryId);
    } else {
      newCategories = newCategories.filter(id => id !== categoryId);
    }
    
    onFilterChange({ categoryIds: newCategories });
  };
  
  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
  };
  
  const applyPriceFilter = () => {
    onFilterChange({ minPrice: priceRange[0], maxPrice: priceRange[1] });
  };
  
  const resetFilters = () => {
    onFilterChange({
      categoryIds: [],
      minPrice: 0,
      maxPrice: 1000,
    });
  };
  
  const hasActiveFilters = 
    selectedCategoryIds.length > 0 || 
    minPrice > 0 || 
    maxPrice < 1000;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        )}
      </div>
      
      <Accordion type="multiple" defaultValue={['categories', 'price']} className="space-y-4">
        {/* Categories filter */}
        <AccordionItem value="categories" className="border rounded-md p-3">
          <AccordionTrigger className="text-sm font-medium">
            Categories
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 mt-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategoryIds.includes(category.id)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
              
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">No categories found</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Price filter */}
        <AccordionItem value="price" className="border rounded-md p-3">
          <AccordionTrigger className="text-sm font-medium">
            Price Range
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 mt-2">
              <div className="flex justify-between">
                <span className="text-sm">${priceRange[0]}</span>
                <span className="text-sm">${priceRange[1]}</span>
              </div>
              
              <Slider
                defaultValue={[minPrice, maxPrice]}
                value={priceRange}
                min={0}
                max={1000}
                step={10}
                onValueChange={handlePriceChange}
                className="my-4"
              />
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={applyPriceFilter}
              >
                Apply
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
} 