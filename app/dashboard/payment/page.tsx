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
import { PlusCircle, CreditCard, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Payment Methods | Dashboard",
  description: "Manage your payment methods",
}

export default async function PaymentMethodsPage() {
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
  
  // Fetch user's payment methods
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' },
  })
  
  // Helper function to mask card number
  const maskCardNumber = (accountNumber: string | null) => {
    if (!accountNumber) return 'xxxx-xxxx-xxxx-xxxx'
    
    // Keep only the last 4 digits visible
    return `xxxx-xxxx-xxxx-${accountNumber.slice(-4)}`
  }
  
  // Helper function to get card icon based on provider
  const getCardIcon = (provider: string) => {
    return <CreditCard className="h-6 w-6" />
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground">
            Manage your payment methods
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/payment/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Payment Method
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paymentMethods.length === 0 ? (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Payment Methods Found</CardTitle>
              <CardDescription>
                You haven't added any payment methods yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Add a payment method to make checkout faster
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/dashboard/payment/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Payment Method
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id} className="relative">
              {method.isDefault && (
                <Badge className="absolute right-4 top-4">Default</Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getCardIcon(method.provider)}
                  <span className="ml-2">{method.provider}</span>
                </CardTitle>
                <CardDescription>
                  {method.type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-mono">{maskCardNumber(method.accountNumber)}</p>
                  {method.expiryDate && (
                    <p className="text-sm text-muted-foreground">Expires: {method.expiryDate}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/payment/${method.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                {!method.isDefault && (
                  <form action={`/api/user/payment/${method.id}/delete`} method="POST">
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </form>
                )}
                {!method.isDefault && (
                  <form action={`/api/user/payment/${method.id}/default`} method="POST">
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