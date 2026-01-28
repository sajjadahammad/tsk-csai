import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const skeletonVariants = cva("bg-muted", {
  variants: {
    animation: {
      pulse: "animate-pulse",
      wave: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
      none: "",
    },
    variant: {
      text: "h-4 rounded",
      circular: "rounded-full",
      rectangular: "rounded-md",
    },
  },
  defaultVariants: {
    animation: "pulse",
    variant: "rectangular",
  },
})

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number
  height?: string | number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, animation, variant, width, height, style, ...props }, ref) => {
    const inlineStyles: React.CSSProperties = {
      ...style,
      ...(width && { width: typeof width === "number" ? `${width}px` : width }),
      ...(height && { height: typeof height === "number" ? `${height}px` : height }),
    }

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading content"
        className={cn(skeletonVariants({ animation, variant, className }))}
        style={inlineStyles}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton, skeletonVariants }
