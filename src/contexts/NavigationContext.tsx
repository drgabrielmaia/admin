'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface NavigationContextType {
  isNavigating: boolean
  navigateTo: (url: string) => void
  setNavigating: (loading: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Reset loading quando a rota mudou
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  const navigateTo = (url: string) => {
    if (pathname === url) return // Não navegar se já estiver na mesma página
    
    setIsNavigating(true)
    
    // Usar setTimeout para garantir que o loading apareça imediatamente
    setTimeout(() => {
      router.push(url)
    }, 10)
  }

  const setNavigating = (loading: boolean) => {
    setIsNavigating(loading)
  }

  return (
    <NavigationContext.Provider value={{ 
      isNavigating, 
      navigateTo, 
      setNavigating 
    }}>
      {children}
      
      {/* Loading Overlay Global */}
      {isNavigating && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 shadow-xl">
            <LoadingSpinner size="lg" text="Carregando página..." />
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  )
}

// Hook para links com preload
export function useOptimizedLink() {
  const { navigateTo, isNavigating } = useNavigation()
  
  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    if (!isNavigating) {
      navigateTo(href)
    }
  }
  
  return { handleLinkClick, isNavigating }
}