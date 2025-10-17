'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Se usuário já está logado, redirecionar para o dashboard apropriado
    if (!loading && user) {
      console.log('👤 Usuário já logado, redirecionando...')
      console.log('🔍 DEBUG - User completo:', user)
      console.log('🔍 DEBUG - User.funcao:', user.funcao)
      console.log('🔍 DEBUG - Tipo user.funcao:', typeof user.funcao)
      
      if (user.funcao == 'sdr') {
        console.log('➡️ Redirecionando para SDR')
        router.push('/dashboard/sdr')
      } else if (user.funcao == 'closer') {
        console.log('➡️ Redirecionando para Closer')
        router.push('/dashboard/closer')
      } else if (user.funcao == 'mentorado') {
        console.log('➡️ Redirecionando para Mentorado')
        router.push('/dashboard/mentorado')
      } else {
        console.log('➡️ Redirecionando para Admin')
        router.push('/dashboard/admin')
      }
    }
  }, [user, loading, router])

  // Se ainda carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  // Se usuário já logado, não mostrar form de login
  if (user) {
    return (
      <div className="min-h-screen bg-[#0E0E10] flex items-center justify-center">
        <div className="text-[#F1F5F9]">Redirecionando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0E0E10] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onToggleRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}