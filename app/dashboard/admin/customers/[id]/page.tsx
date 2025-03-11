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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  ShoppingBag,
  CreditCard,
  User
} from "lucide-react";

// Helper function to format date
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

interface CustomerPageProps {
  params: {
    id: string;
  };
}

// Define types for our complex query results
type CustomerWithDetails = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  profile: {
    id: string;
    userId: string;
    bio: string | null;
    phone: string | null;
  } | null;
  addresses: Array<{
    id: string;
    userId: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    createdAt: Date;
    total: number | string;
    status: string;
    items: Array<{
      id: string;
      product: {
        id: string;
        name: string;
      };
    }>;
    statusUpdates: Array<{
      status: string;
    }>;
  }>;
  reviews: Array<{
    id: string;
    product: {
      id: string;
      name: string;
    };
  }>;
  paymentMethods: Array<{
    id: string;
    cardBrand: string;
    lastFourDigits: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
  }>;
  _count: {
    orders: number;
    reviews: number;
  };
};

export default async function CustomerDetailPage({ params }: CustomerPageProps) {
  const customerId = params.id;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/admin/customers/" + customerId);
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get customer details
  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    include: {
      profile: true,
      addresses: true,
      orders: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
          statusUpdates: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      reviews: {
        include: {
          product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
      paymentMethods: true,
      _count: {
        select: {
          orders: true,
          reviews: true,
        },
      },
    },
  }) as CustomerWithDetails | null;

  // If customer doesn't exist, show 404
  if (!customer) {
    notFound();
  }

  // Calculate customer metrics
  const totalSpent = customer.orders.reduce(
    (total: number, order: { total: number | string }) => total + Number(order.total), 
    0
  );
  
  const averageOrderValue = customer.orders.length > 0 
    ? totalSpent / customer.orders.length 
    : 0;

  const firstOrderDate = customer.orders.length > 0 
    ? customer.orders[customer.orders.length - 1].createdAt 
    : null;

  const lastOrderDate = customer.orders.length > 0 
    ? customer.orders[0].createdAt 
    : null;

  // Get default address
  const defaultAddress = customer.addresses.find(addr => addr.isDefault) || customer.addresses[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Details</h1>
          <p className="text-muted-foreground">
            View and manage customer information
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/admin/customers/${customer.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Customer
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Profile */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Customer information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative h-24 w-24 rounded-full overflow-hidden">
                {customer.image ? (
                  <Image
                    src={customer.image}
                    alt={customer.name || "Customer"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                    {customer.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">{customer.name || "Unnamed User"}</h3>
                <p className="text-sm text-muted-foreground">
                  Member since {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              {customer.profile?.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{customer.profile.phone}</span>
                </div>
              )}
              {defaultAddress && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                  <div>
                    <p>{defaultAddress.street}</p>
                    <p>
                      {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
                    </p>
                    <p>{defaultAddress.country}</p>
                  </div>
                </div>
              )}
            </div>

            {customer.profile?.bio && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{customer.profile.bio}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Customer Analytics */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Customer Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="orders">
              <TabsList className="mb-4">
                <TabsTrigger value="stats">
                  <User className="h-4 w-4 mr-2" />
                  Statistics
                </TabsTrigger>
                <TabsTrigger value="orders">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="payment">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="stats" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(totalSpent)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {customer._count.orders}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(averageOrderValue)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {customer._count.reviews}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Activity Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="rounded-full px-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        Joined
                      </Badge>
                      <span>Account created on {formatDate(customer.createdAt)}</span>
                    </div>
                    
                    {firstOrderDate && (
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="rounded-full px-2">
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          First Order
                        </Badge>
                        <span>First purchase on {formatDate(firstOrderDate)}</span>
                      </div>
                    )}
                    
                    {lastOrderDate && lastOrderDate !== firstOrderDate && (
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="rounded-full px-2">
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          Recent Order
                        </Badge>
                        <span>Last purchase on {formatDate(lastOrderDate)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Order History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer.orders.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customer.orders.map((order) => {
                            const status = order.statusUpdates[0]?.status || order.status;
                            
                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                                <TableCell>{formatDate(order.createdAt)}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={status === "DELIVERED" ? "default" : 
                                             status === "PROCESSING" ? "secondary" :
                                             status === "SHIPPED" ? "outline" : "destructive"}
                                  >
                                    {status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{order.items.length} items</TableCell>
                                <TableCell>{formatCurrency(Number(order.total))}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/admin/orders/${order.id}`}>
                                      View
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No orders found for this customer.
                      </div>
                    )}
                  </CardContent>
                  {customer.orders.length > 5 && (
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/dashboard/admin/orders?customer=${customer.id}`}>
                          View All Orders
                        </Link>
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer.paymentMethods.length > 0 ? (
                      <div className="space-y-4">
                        {customer.paymentMethods.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{payment.cardBrand} •••• {payment.lastFourDigits}</div>
                                <div className="text-xs text-muted-foreground">
                                  Expires {payment.expiryMonth}/{payment.expiryYear}
                                </div>
                              </div>
                            </div>
                            {payment.isDefault && (
                              <Badge>Default</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No payment methods found for this customer.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 