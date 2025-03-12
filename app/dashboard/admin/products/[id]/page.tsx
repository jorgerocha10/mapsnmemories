import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id: productId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/admin/products/" + productId);
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get product details
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      images: {
        orderBy: {
          position: 'asc',
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
    },
  });

  // If product doesn't exist, show 404
  if (!product) {
    notFound();
  }

  // Calculate average rating
  const averageRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
    : 0;

  // Serialize product data to handle Decimal fields
  const serializedProduct = {
    ...product,
    price: Number(product.price) / 100,
    compareAtPrice: product.compareAtPrice 
      ? Number(product.compareAtPrice) / 100 
      : null,
    weight: product.weight ? Number(product.weight) : null,
  };

  // Function to render stock status badge
  const getStockStatusBadge = (inventory: number) => {
    if (inventory > 10) {
      return <Badge className="bg-green-500">In Stock</Badge>;
    } else if (inventory > 0) {
      return <Badge className="bg-yellow-500">Low Stock</Badge>;
    } else {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-muted-foreground">
            Product details and information
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/admin/products/${product.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Images */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {product.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {product.images.map((image, index) => (
                    <div key={image.id} className="relative aspect-square">
                      <Image
                        src={image.url}
                        alt={`Product image ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">No images available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p>{product.category?.name || "Uncategorized"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p>{formatCurrency(serializedProduct.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inventory</p>
                  <p className="flex items-center">
                    {product.inventory} {" "}
                    <span className="ml-2">{getStockStatusBadge(product.inventory)}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visibility</p>
                  <p>{product.isVisible ? "Visible" : "Hidden"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p>{product.sku || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Barcode</p>
                  <p>{product.barcode || "N/A"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Description</h3>
              <p className="text-sm">{product.description || "No description provided."}</p>
            </div>

            <Separator />

            {/* Reviews */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Reviews</h3>
                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground mr-2">
                    Average Rating: {averageRating.toFixed(1)} / 5
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ({product.reviews.length} reviews)
                  </p>
                </div>
              </div>

              {product.reviews.length > 0 ? (
                <div className="space-y-4">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {review.user?.image && (
                            <div className="relative w-8 h-8 mr-2">
                              <Image
                                src={review.user.image}
                                alt={review.user.name || "User"}
                                fill
                                className="rounded-full object-cover"
                              />
                            </div>
                          )}
                          <p className="font-medium">{review.user?.name || "Anonymous"}</p>
                        </div>
                        <div className="flex items-center">
                          <p className="font-bold mr-1">{review.rating}</p>
                          <p className="text-sm text-muted-foreground">/5</p>
                        </div>
                      </div>
                      <p className="text-sm mt-2">{review.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 