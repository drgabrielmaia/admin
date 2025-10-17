'use client'

import Link from 'next/link'
import { useNavigation } from '@/contexts/NavigationContext'
import { cn } from '@/lib/utils'
import { ReactNode, useState, useRef } from 'react'

interface OptimizedLinkProps {
  href: string
  children: ReactNode
  className?: string
  prefetch?: boolean
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  showLoading?: boolean
}

export function OptimizedLink({ 
  href, 
  children, 
  className, 
  prefetch = true,
  onClick,
  disabled = false,
  showLoading = true
}: OptimizedLinkProps) {
  const { navigateTo, isNavigating } = useNavigation()
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = () => {
    setIsHovered(true)
    
    // Preload da rota após 300ms de hover
    if (prefetch) {
      timeoutRef.current = setTimeout(() => {
        // Next.js já faz preload automático, mas podemos forçar
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = href
        document.head.appendChild(link)
      }, 300)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || isNavigating) {
      e.preventDefault()
      return
    }

    if (onClick) {
      onClick(e)
    }

    // Não usar navegação personalizada para pages específicas que estão causando problemas
    const problematicPages = [
      '/dashboard/admin/configuracao-comissoes',
      '/dashboard/admin/indicacoes',
      '/dashboard/admin/relatorio-comissoes'
    ]
    
    if (showLoading && !problematicPages.includes(href)) {
      e.preventDefault()
      navigateTo(href)
    }
  }

  return (
    <Link 
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      prefetch={prefetch}
      className={cn(
        "transition-all duration-200",
        isHovered && "scale-[1.02]",
        disabled || isNavigating ? "opacity-50 cursor-not-allowed" : "hover:opacity-80",
        className
      )}
    >
      {children}
    </Link>
  )
}

// Link para navegação da sidebar
export function NavLink({ 
  href, 
  children, 
  className,
  isActive = false
}: OptimizedLinkProps & { isActive?: boolean }) {
  return (
    <OptimizedLink
      href={href}
      className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
        isActive 
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" 
          : "text-slate-300 hover:bg-slate-800 hover:text-white",
        className
      )}
    >
      {children}
    </OptimizedLink>
  )
}