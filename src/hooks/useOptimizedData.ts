'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UseOptimizedDataProps {
  tableName: string
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  cacheKey?: string
  refreshInterval?: number
}

interface UseOptimizedDataReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setData: (data: T[]) => void
}

// Cache global simples
const dataCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useOptimizedData<T = any>({
  tableName,
  select = '*',
  filters = {},
  orderBy,
  cacheKey,
  refreshInterval
}: UseOptimizedDataProps): UseOptimizedDataReturn<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Gerar chave de cache baseada nos parâmetros
  const getCacheKey = useCallback(() => {
    if (cacheKey) return cacheKey
    return `${tableName}_${JSON.stringify({ select, filters, orderBy })}`
  }, [tableName, select, filters, orderBy, cacheKey])

  // Verificar se dados estão em cache e ainda são válidos
  const getCachedData = useCallback(() => {
    const key = getCacheKey()
    const cached = dataCache.get(key)
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data
    }
    return null
  }, [getCacheKey])

  // Salvar dados no cache
  const setCachedData = useCallback((newData: T[]) => {
    const key = getCacheKey()
    dataCache.set(key, {
      data: newData,
      timestamp: Date.now()
    })
  }, [getCacheKey])

  // Função para buscar dados
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      // Verificar cache primeiro
      const cachedData = getCachedData()
      if (cachedData && showLoading) {
        setData(cachedData)
        setLoading(false)
        return
      }

      // Construir query
      let query = supabase.from(tableName).select(select)

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      // Aplicar ordenação
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false })
      }

      const { data: result, error: queryError } = await query

      if (!mountedRef.current) return

      if (queryError) throw queryError

      const newData = result || []
      setData(newData)
      setCachedData(newData)

      if (showLoading) setLoading(false)
    } catch (err: any) {
      if (!mountedRef.current) return
      
      console.error(`Erro ao carregar dados de ${tableName}:`, err)
      setError(err.message || 'Erro ao carregar dados')
      if (showLoading) setLoading(false)
    }
  }, [tableName, select, filters, orderBy, getCachedData, setCachedData])

  // Função para refresh manual
  const refresh = useCallback(async () => {
    // Limpar cache para esta query
    const key = getCacheKey()
    dataCache.delete(key)
    await fetchData(true)
  }, [fetchData, getCacheKey])

  // Efeito inicial e quando dependências mudam
  useEffect(() => {
    mountedRef.current = true
    fetchData(true)

    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  // Auto-refresh se especificado
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(false) // Refresh silencioso
      }, refreshInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [refreshInterval, fetchData])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      mountedRef.current = false
    }
  }, [])

  return {
    data,
    loading,
    error,
    refresh,
    setData
  }
}

// Hook específico para mutações otimizadas
export function useOptimizedMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (
    operation: () => Promise<any>,
    options?: {
      onSuccess?: (result: any) => void
      onError?: (error: any) => void
      invalidateCache?: string[]
    }
  ) => {
    try {
      setLoading(true)
      setError(null)

      const result = await operation()

      // Invalidar cache específico se fornecido
      if (options?.invalidateCache) {
        options.invalidateCache.forEach(key => {
          dataCache.delete(key)
        })
      }

      if (options?.onSuccess) {
        options.onSuccess(result)
      }

      setLoading(false)
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Erro na operação'
      setError(errorMessage)
      
      if (options?.onError) {
        options.onError(err)
      }
      
      setLoading(false)
      throw err
    }
  }, [])

  return {
    mutate,
    loading,
    error
  }
}