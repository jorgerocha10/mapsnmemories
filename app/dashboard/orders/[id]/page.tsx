import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, Package, Truck, CheckCircle } from "lucide-react"

export const metadata = {
  title: "Order Details | Dashboard",
  description: "View your order details",
}

type Params = Promise<{ id: string }>;

interface OrderDetailPageProps {
  params: Params
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/orders")
  }

  if (!session.user.email) {
    return <div>User email not found in session</div>
  }

  // First get the user ID from the email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true }
  })

  if (!user) {
    return <div>User not found</div>
  }

  const userId = user.id
  const { id: orderId } = await params

  // Fetch order details
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      userId, // Ensure the order belongs to the user
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
      address: true,
      statusUpdates: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  // Helper function to get order status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'PROCESSING':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'SHIPPED':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Shipped</Badge>
      case 'DELIVERED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Delivered</Badge>
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>
      case 'REFUNDED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Refunded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get tracking steps based on order status
  const getTrackingSteps = () => {
    const steps = [
      { status: 'PENDING', label: 'Order Placed', icon: Package, completed: true },
      { status: 'PROCESSING', label: 'Processing', icon: Package, completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) },
      { status: 'SHIPPED', label: 'Shipped', icon: Truck, completed: ['SHIPPED', 'DELIVERED'].includes(order.status) },
      { status: 'DELIVERED', label: 'Delivered', icon: CheckCircle, completed: ['DELIVERED'].includes(order.status) },
    ]

    return steps
  }

  const trackingSteps = getTrackingSteps()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link href="/dashboard/orders">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')} at {format(new Date(order.createdAt), 'h:mm a')}
          </p>
        </div>
        <div>
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Order tracking */}
      {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Track your order status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative flex items-center justify-between">
              {/* Progress bar */}
              <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${trackingSteps.filter(step => step.completed).length /
                      (trackingSteps.length - 1) * 100
                      }%`
                  }}
                />
              </div>

              {/* Steps */}
              {trackingSteps.map((step, index) => (
                <div key={step.status} className="relative flex flex-col items-center">
                  <div
                    className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${step.completed
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-background'
                      }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="mt-2 text-sm font-medium">{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'} in your order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 relative overflow-hidden rounded-md border">
                        {item.product.images && item.product.images[0] ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-secondary">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.product.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(Number(item.price) / 100)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(item.price) * item.quantity / 100)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order summary and shipping info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Order summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal) / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(Number(order.shipping) / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(Number(order.tax) / 100)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-{formatCurrency(Number(order.discount) / 100)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total) / 100)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping info */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            {order.address ? (
              <div className="space-y-1">
                <p className="font-medium">{user.name || 'User'}</p>
                <p>{order.address.street}</p>
                <p>
                  {order.address.city}, {order.address.state} {order.address.postalCode}
                </p>
                <p>{order.address.country}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No shipping information available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 