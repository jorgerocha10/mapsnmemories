"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import ErrorBoundary from "./error-boundary"
import { CartProvider } from "@/context/CartContext"

export function Providers({ children }: { children: React.ReactNode }) {
  // This helps with hydration issues by only rendering once the client is mounted
  const [mounted, setMounted] = useState(false)
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <CartProvider>
              {mounted ? children : null}
              <Toaster />
            </CartProvider>
          </ThemeProvider>
        </SessionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
} 