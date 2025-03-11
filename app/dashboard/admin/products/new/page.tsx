import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { NewProductForm } from "@/components/admin/NewProductForm";

export default async function NewProductPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/admin/products/new");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get all categories for the dropdown
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  // Serialize the categories to prevent any Decimal serialization issues
  const serializedCategories = categories.map(category => ({
    id: category.id,
    name: category.name,
    // Include other fields as needed
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground">
            Create a new product for your store
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
            Enter the information for your new product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewProductForm categories={serializedCategories} />
        </CardContent>
      </Card>
    </div>
  );
} 