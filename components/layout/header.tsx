"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CartSlideOver } from "@/components/cart/CartSlideOver";

const mainNavItems = [
  {
    title: "Home",
    href: "/home",
  },
  {
    title: "Products",
    href: "/products",
  },
];

export default function Header() {
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearchBar(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-4 flex md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] sm:w-[350px] p-6">
              <div className="py-6">
                <Link href="/home" className="flex items-center space-x-2 font-bold">
                  Maps & Memories
                </Link>
                <nav className="mt-6 flex flex-col space-y-3">
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-2 py-2 text-lg font-medium transition-colors hover:text-foreground/80",
                        pathname === item.href
                          ? "text-foreground"
                          : "text-foreground/60"
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Link href="/home" className="flex items-center space-x-2 font-bold">
          Maps & Memories
        </Link>

        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-center">
          <ul className="flex space-x-6">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground/80",
                    pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/home")
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {showSearchBar ? (
            <form onSubmit={handleSearch} className="relative flex w-full max-w-[200px] items-center md:max-w-[300px]">
              <Input
                type="search"
                placeholder="Search products..."
                className="pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0"
                onClick={() => setShowSearchBar(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close search</span>
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearchBar(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
          <CartSlideOver />
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
} 