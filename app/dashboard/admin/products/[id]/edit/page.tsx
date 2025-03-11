import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductEditForm from "@/components/admin/ProductEditForm";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user;
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // Redirect if not authenticated or not admin
  if (!user || user.role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/dashboard/admin/products");
  }

  // Fetch product data
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      images: {
        orderBy: {
          position: 'asc',
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Serialize product data to handle Decimal values
  const serializedProduct = {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    weight: product.weight ? Number(product.weight) : null,
  };

  // Fetch categories for dropdown
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">Update product information</p>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <ProductEditForm product={serializedProduct} categories={categories} />
      </div>
    </div>
  );
} 