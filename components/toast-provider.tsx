'use client'

import React, { createContext, useContext } from 'react'
import { useToast, ToastProps } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

// Create context with default values
type ToastContextType = {
  toast: (props: Omit<ToastProps, 'id'>) => string
  dismiss: (id: string) => void
  clear: () => void
}

const ToastContext = createContext<ToastContextType>({
  toast: () => '',
  dismiss: () => { },
  clear: () => { },
})

export const useToastContext = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [, { addToast, removeToast, clearToasts }] = useToast()

  // Create an object with the toast functions
  const value = {
    toast: addToast,
    dismiss: removeToast,
    clear: clearToasts,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
} 