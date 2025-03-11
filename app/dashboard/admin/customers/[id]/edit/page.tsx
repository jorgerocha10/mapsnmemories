import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
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
import CustomerEditForm from "@/components/admin/CustomerEditForm";

interface CustomerEditPageProps {
  params: Promise<{ id: string }>;
}

// Define customer type with the fields we need for editing
type CustomerForEdit = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  profile: {
    id: string;
    bio: string | null;
    phone: string | null;
  } | null;
  addresses: Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
};

export default async function CustomerEditPage({ params }: CustomerEditPageProps) {
  const resolvedParams = await params;
  const customerId = resolvedParams.id;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/admin/customers/" + customerId + "/edit");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get customer details for editing
  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    include: {
      profile: true,
      addresses: true,
    },
  }) as CustomerForEdit | null;

  // If customer doesn't exist, show 404
  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
          <p className="text-muted-foreground">
            Update customer information and settings
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/admin/customers/${customerId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
          <CardDescription>
            Edit basic information and account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerEditForm customer={customer} />
        </CardContent>
      </Card>
    </div>
  );
} 