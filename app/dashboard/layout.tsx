import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { User, Package, LayoutDashboard, ShoppingBag, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/db"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard")
  }
  
  // Get user role from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })
  
  const isAdmin = user?.role === "ADMIN"
  
  const navItems = [
    { href: "/dashboard", icon: User, label: "Profile" },
    { href: "/dashboard/orders", icon: Package, label: "Orders" },
  ]
  
  // Admin-only navigation items
  const adminNavItems = [
    { href: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/admin/orders", icon: Package, label: "Orders" },
    { href: "/dashboard/admin/products", icon: ShoppingBag, label: "Products" },
    { href: "/dashboard/admin/customers", icon: Users, label: "Customers" },
  ]

  return (
    <div className="container max-w-7xl py-10">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-8">
        <aside className="lg:w-1/4">
          <div className="sticky top-4">
            <div className="space-y-6">
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
              
              {/* Admin navigation section - only shown for admin users */}
              {isAdmin && (
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                    Admin
                  </h2>
                  <div className="space-y-1">
                    {adminNavItems.map((item) => (
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
              )}
            </div>
          </div>
        </aside>
        <div className="flex-1 lg:max-w-3xl">{children}</div>
      </div>
    </div>
  )
} 