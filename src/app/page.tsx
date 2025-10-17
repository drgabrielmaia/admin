'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const { user, loading, supabaseUser } = useAuth()
  const router = useRouter()
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    // Redirecionamento imediato se usuário já estiver carregado
    if (user && user.funcao) {
      const dashboardUrl = `/dashboard/${user.funcao}`
      console.log('🚀 Redirecionamento imediato para:', dashboardUrl, user.nome)
      window.location.href = dashboardUrl
      return
    }

    // Timeout de segurança para evitar loading infinito
    const timeout = setTimeout(() => {
      console.log('⏰ Timeout atingido após 3 segundos')
      setTimeoutReached(true)
    }, 3000) // Reduzido para 3 segundos

    if (!loading) {
      clearTimeout(timeout)
      
      if (!user) {
        console.log('👤 Usuário não autenticado, redirecionando para /auth')
        router.push('/auth')
      } else if (user.funcao) {
        console.log('✅ Usuário autenticado:', user.nome, user.funcao)
        const dashboardUrl = `/dashboard/${user.funcao}`
        console.log('🎯 Redirecionando para:', dashboardUrl)
        window.location.href = dashboardUrl
      }
    }

    return () => clearTimeout(timeout)
  }, [user, loading, router])

  // Se o loading demorou muito, mostrar opções
  if (timeoutReached) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Fluxo Lucrativo</h1>
          <p className="text-slate-400 mb-6">
            O sistema demorou para carregar. Escolha uma opção:
          </p>
          
          <div className="space-y-3">
            {user ? (
              <div className="space-y-2">
                <p className="text-green-400 text-sm">Usuário encontrado: {user.nome} ({user.funcao})</p>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/${user.funcao}`}>Ir para Dashboard</Link>
                </Button>
              </div>
            ) : (
              <Button asChild className="w-full">
                <Link href="/auth">Ir para Login</Link>
              </Button>
            )}
            
            <div className="grid grid-cols-3 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin">Admin</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/sdr">SDR</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/closer">Closer</Link>
              </Button>
            </div>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/test-supabase">Testar Supabase</Link>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-slate-400"
              onClick={() => {
                setTimeoutReached(false)
                window.location.reload()
              }}
            >
              Tentar Novamente
            </Button>
          </div>
          
          {supabaseUser && (
            <div className="mt-4 p-3 bg-slate-800 rounded text-xs">
              <p className="text-green-400">Usuário logado no Supabase: {supabaseUser.email}</p>
              <p className="text-slate-400">Problema ao buscar perfil na tabela users</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-slate-400">Carregando Fluxo Lucrativo...</p>
          <p className="text-xs text-slate-500 mt-2">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return null
}