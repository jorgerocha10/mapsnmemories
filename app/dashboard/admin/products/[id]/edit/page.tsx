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

interface ProductEditPageProps {
  params: {
    id: string;
  };
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const productId = params.id;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/admin/products/" + productId + "/edit");
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
    },
  });

  // Get all categories for the dropdown
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  // If product doesn't exist, show 404
  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">
            Update product information and inventory
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>
            Edit your product information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductEditForm product={product} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
} 