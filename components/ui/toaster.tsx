'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Toast, ToastDescription, ToastTitle } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'

export function Toaster() {
  const [mounted, setMounted] = useState(false)
  const [toasts, { removeToast }] = useToast()

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          className="animate-in fade-in slide-in-from-bottom-4 duration-300"
          onClick={() => removeToast(toast.id)}
        >
          <div className="grid gap-1">
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </div>
        </Toast>
      ))}
    </>,
    document.body
  )
} 