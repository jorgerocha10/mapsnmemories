import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Package } from "lucide-react"

export const metadata = {
  title: "Wishlist | Dashboard",
  description: "View and manage your wishlist",
}

export default async function WishlistPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  if (!session.user.email) {
    return <div>User email not found in session</div>
  }

  // First get the user ID from the email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  })

  if (!user) {
    return <div>User not found</div>
  }

  const userId = user.id

  // Fetch user's wishlist items with product details
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
        <p className="text-muted-foreground">
          View and manage your saved items
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Wishlist is Empty</CardTitle>
            <CardDescription>
              You haven't added any items to your wishlist yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Browse our products and add items to your wishlist to save them for later
            </p>
            <Button asChild>
              <Link href="/products">
                Browse Products
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative h-48 w-full">
                {item.product.images && item.product.images[0] ? (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{item.product.name}</CardTitle>
                <CardDescription>
                  {formatCurrency(Number(item.product.price))}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground mb-4">
                  {item.product.description}
                </p>
                <div className="flex space-x-2">
                  <Button asChild className="flex-1">
                    <Link href={`/products/${item.product.id}`}>
                      View Product
                    </Link>
                  </Button>
                  <form action={`/api/user/wishlist/${item.id}/delete`} method="POST" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </form>
                </div>
                <form action="/api/cart/add" method="POST" className="mt-2">
                  <input type="hidden" name="productId" value={item.product.id} />
                  <input type="hidden" name="quantity" value="1" />
                  <Button variant="secondary" className="w-full">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 