/**
 * Utilitários para monitoramento de performance
 * Ajuda a identificar gargalos e otimizar o aplicativo
 */

// Monitor de performance para funções
export function measurePerformance<T>(
  fn: () => T | Promise<T>,
  label: string
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now()
    
    try {
      const result = await fn()
      const end = performance.now()
      const duration = end - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ Performance [${label}]: ${duration.toFixed(2)}ms`)
        
        // Alertar sobre operações lentas (>500ms)
        if (duration > 500) {
          console.warn(`🐌 Operação lenta detectada: ${label} (${duration.toFixed(2)}ms)`)
        }
      }
      
      resolve(result)
    } catch (error) {
      reject(error)
    }
  })
}

// Hook para medir tempo de renderização
export function useRenderTime(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      console.log(`🎨 Render time [${componentName}]: ${(end - start).toFixed(2)}ms`)
    }
  }
  
  return () => {}
}

// Utilitário para lazy loading de dados
export function createLazyLoader<T>(
  loader: () => Promise<T>,
  cacheKey?: string
) {
  let cached: T | null = null
  let loading = false
  let promise: Promise<T> | null = null
  
  return async (): Promise<T> => {
    // Se já temos dados em cache, retornar imediatamente
    if (cached !== null) {
      return cached
    }
    
    // Se já está carregando, aguardar a promessa existente
    if (loading && promise) {
      return promise
    }
    
    // Iniciar carregamento
    loading = true
    promise = measurePerformance(loader, `LazyLoad: ${cacheKey || 'unknown'}`)
    
    try {
      const result = await promise
      cached = result
      return result
    } finally {
      loading = false
      promise = null
    }
  }
}

// Cache simples para resultados de API
const apiCache = new Map<string, { data: any; timestamp: number }>()

export function createApiCache<T>(
  cacheTimeMs = 5 * 60 * 1000 // 5 minutos por padrão
) {
  return {
    get(key: string): T | null {
      const cached = apiCache.get(key)
      if (!cached) return null
      
      // Verificar se ainda é válido
      if (Date.now() - cached.timestamp > cacheTimeMs) {
        apiCache.delete(key)
        return null
      }
      
      return cached.data
    },
    
    set(key: string, data: T): void {
      apiCache.set(key, {
        data,
        timestamp: Date.now()
      })
    },
    
    clear(key?: string): void {
      if (key) {
        apiCache.delete(key)
      } else {
        apiCache.clear()
      }
    }
  }
}