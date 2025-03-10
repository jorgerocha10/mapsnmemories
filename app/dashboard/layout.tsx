import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { User, Package, MapPin, CreditCard, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard")
  }
  
  const navItems = [
    { href: "/dashboard", icon: User, label: "Profile" },
    { href: "/dashboard/orders", icon: Package, label: "Orders" },
    { href: "/dashboard/addresses", icon: MapPin, label: "Addresses" },
    { href: "/dashboard/payment", icon: CreditCard, label: "Payment Methods" },
    { href: "/dashboard/wishlist", icon: Heart, label: "Wishlist" },
  ]

  return (
    <div className="container max-w-7xl py-10">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-8">
        <aside className="lg:w-1/4">
          <div className="sticky top-4">
            <div className="space-y-1">
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  Dashboard
                </h2>
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link
                        href={item.href}
                        className="flex items-center"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex-1 lg:max-w-3xl">{children}</div>
      </div>
    </div>
  )
} 