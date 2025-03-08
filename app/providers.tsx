"use client"

import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { useEffect, useState } from "react"
import ErrorBoundary from "./error-boundary"

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
          {mounted ? children : null}
          <Toaster />
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
} 