'use client'

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500",
          sizeClasses[size],
          className
        )}
      />
      {text && (
        <p className="text-sm text-slate-400 animate-pulse">{text}</p>
      )}
    </div>
  )
}

// Loading skeleton para páginas
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-slate-800 rounded"></div>
        <div className="h-10 w-32 bg-slate-800 rounded"></div>
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-lg border border-slate-700"></div>
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg">
        <div className="p-6 space-y-4">
          <div className="h-6 w-40 bg-slate-700 rounded"></div>
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading para listas
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array(items).fill(0).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-slate-800 border border-slate-700 rounded-lg animate-pulse">
          <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-slate-700 rounded"></div>
            <div className="h-3 w-1/2 bg-slate-700 rounded"></div>
          </div>
          <div className="h-8 w-20 bg-slate-700 rounded"></div>
        </div>
      ))}
    </div>
  )
}