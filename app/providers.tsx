"use client"

import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { useEffect, useState } from "react"
import ErrorBoundary from "./error-boundary"
import { CartProvider } from "@/context/CartContext"

export function Providers({ children }: { children: React.ReactNode }) {
  // This helps with hydration issues by only rendering once the client is mounted
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ErrorBoundary>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CartProvider>
            {mounted ? children : null}
            <Toaster />
          </CartProvider>
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
} 