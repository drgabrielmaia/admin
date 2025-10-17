import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/lib/supabase'

interface UseRoleProtectionOptions {
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export function useRoleProtection(allowedRoles: UserRole[] | UseRoleProtectionOptions, redirectTo = '/auth') {
  // Suporte para chamada direta com array ou com objeto
  const options = Array.isArray(allowedRoles) 
    ? { allowedRoles, redirectTo }
    : { allowedRoles: allowedRoles.allowedRoles || [], redirectTo: allowedRoles.redirectTo || redirectTo }
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      console.log('🚫 Usuário não logado, redirecionando para:', redirectTo)
      router.push(redirectTo)
      return
    }

    if (!user.funcao || !options.allowedRoles.includes(user.funcao)) {
      console.log('🚫 Acesso negado. Função:', user.funcao, 'Permitidas:', options.allowedRoles)
      
      // Redirecionar para o dashboard apropriado
      switch (user.funcao) {
        case 'admin':
          router.push('/dashboard/admin')
          break
        case 'sdr':
          router.push('/dashboard/sdr')
          break
        case 'closer':
          router.push('/dashboard/closer')
          break
        default:
          router.push('/auth')
      }
      return
    }

    console.log('✅ Acesso permitido para função:', user.funcao)
  }, [user, loading, options.allowedRoles, options.redirectTo, router])

  return {
    user,
    loading,
    hasAccess: user && user.funcao && options.allowedRoles.includes(user.funcao)
  }
}