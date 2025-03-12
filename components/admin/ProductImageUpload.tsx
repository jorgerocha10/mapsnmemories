'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUploadThing } from '@/lib/uploadthing';

interface ProductImage {
  id?: string;
  url: string;
  position: number;
  alt?: string | null;
}

interface ProductImageUploadProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
}

export default function ProductImageUpload({ 
  images, 
  onImagesChange 
}: ProductImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("productImage", {
    onClientUploadComplete: (res: Array<{ url: string; ufsUrl: string }>) => {
      // Add the new images to our state
      const newImages = res.map((file, idx) => ({
        id: `temp-${Date.now()}-${idx}`,
        // Use ufsUrl instead of url (deprecated)
        url: file.ufsUrl || file.url, // fallback for compatibility
        position: images.length + idx,
        alt: `Product image ${images.length + idx + 1}`,
      }));
      
      onImagesChange([...images, ...newImages]);
      setIsUploading(false);
    },
    onUploadError: (error: Error) => {
      console.error("Upload error:", error);
      setIsUploading(false);
    },
    onUploadBegin: () => {
      setIsUploading(true);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const res = await startUpload(Array.from(e.target.files));
      
      if (res && res.length > 0) {
        const newImages = [...images];
        
        res.forEach((uploadedFile) => {
          // Add new image with alt text
          newImages.push({
            url: uploadedFile.url,
            position: newImages.length,
            alt: `Product image ${newImages.length + 1}`,
          });
        });
        
        onImagesChange(newImages);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    // Remove the image at the specified index
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    
    // Update positions for remaining images
    const reorderedImages = updatedImages.map((img, idx) => ({
      ...img,
      position: idx,
    }));
    
    onImagesChange(reorderedImages);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Product Images</h3>
      <Separator />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
        {/* Display existing images */}
        {images.map((image, index) => (
          <Card key={image.id || `img-${index}`} className="overflow-hidden">
            <CardContent className="p-2">
              <div className="relative aspect-square mb-2">
                <Image
                  src={image.url}
                  alt={image.alt || `Product image ${index + 1}`}
                  fill
                  className="object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => handleRemoveImage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center text-xs text-muted-foreground">
                Position: {index + 1}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add new image card */}
        <Card>
          <CardContent className="p-2">
            <div className="relative aspect-square mb-2 flex items-center justify-center border-2 border-dashed rounded-md">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <label 
                htmlFor="image-upload" 
                className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4"
              >
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <div className="text-center space-y-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {isUploading ? "Uploading..." : "Upload Images"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    (Max 4MB each)
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 