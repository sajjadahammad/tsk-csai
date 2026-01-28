import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./Spinner"

export interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  children: React.ReactNode
  className?: string
  spinnerSize?: "sm" | "md" | "lg"
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ isLoading, message, children, className, spinnerSize = "lg" }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)}>
        {children}
        {isLoading && (
          <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm"
            role="alert"
            aria-busy="true"
            aria-live="polite"
          >
            <Spinner size={spinnerSize} className="text-primary" />
            {message && (
              <p className="text-sm font-medium text-foreground">{message}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
LoadingOverlay.displayName = "LoadingOverlay"

export { LoadingOverlay }
