import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-4 right-4 z-50 rounded-md border bg-background p-4 shadow-md transition-all",
          variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
Toast.displayName = "Toast"

interface ToastTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const ToastTitle = React.forwardRef<HTMLHeadingElement, ToastTitleProps>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-medium", className)} {...props} />
  )
)
ToastTitle.displayName = "ToastTitle"

interface ToastDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const ToastDescription = React.forwardRef<HTMLParagraphElement, ToastDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
  )
)
ToastDescription.displayName = "ToastDescription" 