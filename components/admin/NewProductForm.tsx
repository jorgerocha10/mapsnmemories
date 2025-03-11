'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { Trash2, Plus, ImageIcon, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Define the form schema with Zod
const productFormSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce.number().min(0.01, { message: "Price must be greater than 0." }),
  compareAtPrice: z.coerce.number().min(0).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  inventory: z.coerce.number().min(0, { message: "Inventory must be a positive number." }),
  isVisible: z.boolean().default(true),
  weight: z.coerce.number().min(0).optional(),
  dimensions: z.string().optional(),
  categoryId: z.string({ required_error: "Please select a category." }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function NewProductForm({ 
  categories 
}: { 
  categories: any[] 
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<{ url: string; position: number }[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      sku: "",
      barcode: "",
      inventory: 0,
      isVisible: true,
      weight: 0,
      dimensions: "",
      categoryId: "",
    },
  });

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);
    try {
      // Send the price directly in dollars (not cents)
      const formData = {
        ...data,
        price: data.price,
        compareAtPrice: data.compareAtPrice || null,
        // Ensure SKU and barcode are properly handled
        sku: data.sku?.trim() || null,
        barcode: data.barcode?.trim() || null,
        images: images.map((img: { url: string; position: number }, index: number) => ({
          url: img.url,
          position: index,
        })),
      };

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData?.details) {
          // Handle validation errors from the API
          errorData.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              const fieldName = detail.path[0];
              form.setError(fieldName as any, { 
                type: 'server', 
                message: detail.message 
              });
            }
          });
          throw new Error("Validation failed");
        }
        throw new Error(errorData.error || "Failed to create product");
      }

      const result = await response.json();
      
      // Show success toast with enhanced details
      toast.success(`Product "${data.name}" created successfully`, {
        description: "Your new product has been added to the store.",
        action: {
          label: "View Product",
          onClick: () => router.push(`/dashboard/admin/products/${result.product.id}`)
        },
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        duration: 5000, // Show for 5 seconds
      });
      
      // Redirect back to the products dashboard
      router.push("/dashboard/admin/products");
    } catch (error) {
      console.error("Error creating product:", error);
      
      if (error instanceof Error && error.message === "Validation failed") {
        toast.error("Please fix the validation errors");
      } else {
        toast.error("Failed to create product");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleAddImage = () => {
    if (!newImageUrl) return;
    
    setImages([
      ...images,
      { 
        url: newImageUrl, 
        position: images.length 
      }
    ]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_: any, i: number) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product description"
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Pricing and Inventory */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="compareAtPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compare at Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="Optional" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Original price for showing discounts
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inventory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Stock keeping unit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="UPC, EAN, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Product Images</h3>
          <Separator />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
            {images.map((image: { url: string; position: number }, index: number) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-2">
                  <div className="relative aspect-square mb-2">
                    <Image
                      src={image.url}
                      alt={`Product image ${index + 1}`}
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

            {/* Add new image */}
            <Card>
              <CardContent className="p-2">
                <div className="relative aspect-square mb-2 flex items-center justify-center border-2 border-dashed rounded-md">
                  <div className="text-center p-4">
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                    <div className="mt-2">
                      <Input
                        type="text"
                        placeholder="Image URL"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="mb-2"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleAddImage}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Visibility and Other Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Product Settings</h3>
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Visibility</FormLabel>
                    <FormDescription>
                      Make this product visible to customers
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dimensions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dimensions (L×W×H)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 10×5×2 inches" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (oz)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/admin/products")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 