'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState<number>(0);
  
  // If no images, show placeholder
  if (images.length === 0) {
    return (
      <div className="relative aspect-square w-full rounded-lg border bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">No image available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-background">
        <Image
          src={images[activeImage].url}
          alt={images[activeImage].alt || productName}
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
        />
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={cn(
                "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border",
                activeImage === index ? "ring-2 ring-primary ring-offset-2" : "hover:ring-1 hover:ring-primary hover:ring-offset-1"
              )}
              onClick={() => setActiveImage(index)}
              aria-label={`View ${image.alt || `image ${index + 1}`}`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover object-center"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 