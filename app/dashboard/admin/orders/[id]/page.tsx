import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import UpdateOrderStatusForm from "@/components/admin/UpdateOrderStatusForm";

interface OrderDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const orderId = params.id;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/admin/orders/" + orderId);
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get order details with all related data
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      address: true,
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: true,
            },
          },
        },
      },
    },
  });

  // If order doesn't exist, show 404
  if (!order) {
    notFound();
  }

  // Helper function to get order status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "PROCESSING":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "SHIPPED":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Shipped</Badge>;
      case "DELIVERED":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Delivered</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "REFUNDED":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground">
              {format(new Date(order.createdAt), "PPP")}
            </p>
            {getStatusBadge(order.status)}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/orders">
            Back to Orders
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Customer</h3>
              <p>{order.user.name || "Not provided"}</p>
              <p className="text-sm text-muted-foreground">{order.user.email}</p>
              <Button variant="link" size="sm" className="px-0" asChild>
                <Link href={`/dashboard/admin/customers/${order.user.id}`}>
                  View Customer Profile
                </Link>
              </Button>
            </div>
            
            <div>
              <h3 className="font-medium">Shipping Address</h3>
              <p>{order.address.name}</p>
              <p>{order.address.street}</p>
              {order.address.street2 && <p>{order.address.street2}</p>}
              <p>{order.address.city}, {order.address.state} {order.address.postalCode}</p>
              <p>{order.address.country}</p>
            </div>
            
            <div>
              <h3 className="font-medium">Contact</h3>
              <p>{order.address.phone || "Not provided"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal) / 100)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span>{formatCurrency(Number(order.shipping) / 100)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tax</span>
              <span>{formatCurrency(Number(order.tax) / 100)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">{formatCurrency(Number(order.total) / 100)}</span>
            </div>
            
            <div className="pt-4">
              <h3 className="font-medium">Payment Details</h3>
              <div className="grid grid-cols-2 gap-1 mt-2">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="truncate font-mono text-sm">{order.paymentIntentId}</span>
                
                <span className="text-muted-foreground">Payment Status</span>
                <span>{order.paymentStatus || "Unknown"}</span>
                
                <span className="text-muted-foreground">Payment Method</span>
                <span>Credit Card</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>
            {order.items.length} item{order.items.length !== 1 ? "s" : ""} in this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => {
                const productImage = item.product.images && item.product.images.length > 0 
                  ? item.product.images[0]
                  : null;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {productImage && (
                          <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden">
                            <img
                              src={productImage}
                              alt={item.product.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{item.product.title}</p>
                          <Button variant="link" size="sm" className="px-0 h-5" asChild>
                            <Link href={`/products/${item.product.slug}`}>
                              View Product
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(Number(item.price) / 100)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency((Number(item.price) * item.quantity) / 100)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update Order Status</CardTitle>
          <CardDescription>
            Change the current order status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateOrderStatusForm 
            orderId={order.id} 
            currentStatus={order.status} 
          />
        </CardContent>
      </Card>
    </div>
  );
} 