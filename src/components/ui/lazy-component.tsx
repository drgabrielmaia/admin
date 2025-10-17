'use client'

import { Suspense, lazy, ComponentType } from 'react'
import { LoadingSpinner, PageSkeleton } from './loading-spinner'

interface LazyComponentProps {
  fallback?: 'spinner' | 'skeleton' | 'custom'
  customFallback?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// HOC para lazy loading de componentes
export function withLazyLoading<T extends {}>(
  componentImport: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentProps = {}
) {
  const LazyComponent = lazy(componentImport)
  
  return function WrappedComponent(props: T) {
    const { fallback = 'spinner', customFallback, size = 'lg' } = options
    
    let fallbackContent: React.ReactNode
    
    switch (fallback) {
      case 'skeleton':
        fallbackContent = <PageSkeleton />
        break
      case 'custom':
        fallbackContent = customFallback
        break
      case 'spinner':
      default:
        fallbackContent = (
          <div className="flex items-center justify-center min-h-[200px]">
            <LoadingSpinner size={size} text="Carregando..." />
          </div>
        )
    }
    
    return (
      <Suspense fallback={fallbackContent}>
        <LazyComponent {...props as any} />
      </Suspense>
    )
  }
}

// Componente para seções que podem ser lazy-loaded
interface LazySectionProps {
  children: React.ReactNode
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
}

export function LazySection({ 
  children, 
  threshold = 0.1, 
  rootMargin = '50px',
  fallback 
}: LazySectionProps) {
  return (
    <div className="lazy-section">
      <Suspense fallback={fallback || <LoadingSpinner size="md" />}>
        {children}
      </Suspense>
    </div>
  )
}