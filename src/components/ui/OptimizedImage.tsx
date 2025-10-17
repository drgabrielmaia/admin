'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

/**
 * Componente de imagem otimizada - Melhora performance de carregamento
 * Uses Next.js Image component with optimization and lazy loading
 */
export const OptimizedImage = memo(({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-[#1A1C20] border border-[#2E3138] rounded-lg',
          className
        )}
        style={{ width, height }}
      >
        <div className="text-[#94A3B8] text-sm">
          Erro ao carregar imagem
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-[#1A1C20] border border-[#2E3138] animate-pulse"
          style={{ width, height }}
        >
          <div className="text-[#94A3B8] text-sm">
            Carregando...
          </div>
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        quality={85}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </div>
  )
})