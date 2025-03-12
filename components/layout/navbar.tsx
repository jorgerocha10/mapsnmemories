'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  ShoppingBag,
  Menu,
  X,
  User,
  LogOut,
  LogIn,
  UserPlus,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const { items } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/home', label: 'Home' },
    { href: '/products', label: 'Products' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image 
            src="/images/Logo_4.png" 
            alt="Maps N Memories Logo" 
            width={250} 
            height={40} 
            className="h-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.href) ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Shopping Cart */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Button>
          </Link>

          {/* User Menu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{session?.user?.name || 'Account'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/orders" className="cursor-pointer">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="default" size="sm">
                <Link href="/auth/signin">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <Link href="/cart" className="mr-2 relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Button>
          </Link>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-6">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="font-semibold text-lg">Menu</span>
                </div>
                <nav className="flex flex-col mt-6 space-y-6 px-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`text-sm font-medium py-2 hover:text-primary ${isActive(link.href) ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-8 pt-4 border-t px-2">
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span className="font-medium">{session?.user?.name || 'Account'}</span>
                      </div>
                      <div className="space-y-2">
                        <Button asChild variant="ghost" className="w-full justify-start" size="sm">
                          <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                            My Dashboard
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full justify-start" size="sm">
                          <Link href="/dashboard/orders" onClick={() => setIsMobileMenuOpen(false)}>
                            My Orders
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive hover:text-destructive"
                          size="sm"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            signOut({ callbackUrl: '/' });
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Button asChild size="sm">
                        <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign In
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-auto pb-4 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">© 2023 Maps N Memories</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 