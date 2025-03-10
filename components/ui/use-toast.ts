'use client'

import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

export type ToastProps = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

type ToastActionType = {
  addToast: (toast: Omit<ToastProps, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

export function useToast(): [ToastProps[], ToastActionType] {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((toast: Omit<ToastProps, 'id'>): string => {
    const id = uuidv4()
    const newToast = { ...toast, id }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto-dismiss toast after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return [
    toasts,
    {
      addToast,
      removeToast,
      clearToasts
    }
  ]
}

type ToastOptions = Omit<ToastProps, 'id'>

export function toast(options: ToastOptions) {
  // This is a dummy function that will be replaced by the actual implementation
  // when the useToast hook is used
  console.warn('toast() function called outside of a component using useToast().')
  return ''
} 