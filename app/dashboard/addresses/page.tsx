import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, MapPin, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Addresses | Dashboard",
  description: "Manage your shipping addresses",
}

export default async function AddressesPage() {
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
    select: { id: true, name: true }
  })

  if (!user) {
    return <div>User not found</div>
  }

  const userId = user.id
  const userName = user.name || 'User'

  // Fetch user's addresses
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Addresses</h1>
          <p className="text-muted-foreground">
            Manage your shipping addresses
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/addresses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Address
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {addresses.length === 0 ? (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Addresses Found</CardTitle>
              <CardDescription>
                You haven't added any shipping addresses yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Add a shipping address to make checkout faster
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/dashboard/addresses/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Address
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          addresses.map((address) => (
            <Card key={address.id} className="relative">
              {address.isDefault && (
                <Badge className="absolute right-4 top-4">Default</Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  {address.city}, {address.state}
                </CardTitle>
                <CardDescription>
                  Shipping Address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p>{userName}</p>
                  <p>{address.street}</p>
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/addresses/${address.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                {!address.isDefault && (
                  <form action={`/api/user/addresses/${address.id}/delete`} method="POST">
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </form>
                )}
                {!address.isDefault && (
                  <form action={`/api/user/addresses/${address.id}/default`} method="POST">
                    <Button variant="secondary" size="sm">
                      Set as Default
                    </Button>
                  </form>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 