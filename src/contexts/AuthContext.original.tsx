'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User, UserRole } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, nome: string, funcao: UserRole) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar cache primeiro
    const cachedUser = localStorage.getItem('fluxo_user')
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser)
        console.log('🔄 Usuário encontrado no cache:', userData.nome)
        setUser(userData)
        setLoading(false)
        return
      } catch (e) {
        localStorage.removeItem('fluxo_user')
      }
    }

    // Verificar sessão atual
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('Sessão encontrada, buscando perfil...')
          setSupabaseUser(session.user)
          await fetchUserProfile(session.user.id, session.user.email || undefined)
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user)
        await fetchUserProfile(session.user.id, session.user.email || undefined)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setSupabaseUser(null)
        localStorage.removeItem('fluxo_user')
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    try {
      console.log('🔍 Buscando perfil para:', { userId, userEmail })

      // Tentar primeiro por email (mais provável de funcionar)
      let query = supabase
        .from('users')
        .select('id, email, nome, funcao, data_cadastro, primeiro_login, created_at, updated_at')

      if (userEmail) {
        console.log('📧 Buscando por email:', userEmail)
        query = query.eq('email', userEmail)
      } else {
        console.log('🆔 Buscando por ID:', userId)
        query = query.eq('id', userId)
      }

      const { data, error } = await query

      console.log('📋 Resultado da query:', { data, error })

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error.message)
        console.error('Código do erro:', error.code)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        console.error('❌ Nenhum usuário encontrado com ID:', userId)
        setLoading(false)
        return
      }

      const userProfile = data[0] // Pegar o primeiro resultado
      console.log('✅ Perfil encontrado!')
      console.log('👤 Nome:', userProfile.nome)
      console.log('📧 Email:', userProfile.email)
      console.log('🎯 Função:', userProfile.funcao)
      
      setUser(userProfile)
      localStorage.setItem('fluxo_user', JSON.stringify(userProfile))
      setLoading(false)

    } catch (error) {
      console.error('💥 Erro fatal ao buscar perfil:', error)
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    
    try {
      console.log('🚀 Iniciando login para:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('🔐 Resposta do Auth:', { data: !!data, error: error?.message })

      if (error) {
        console.error('❌ Erro no Auth Supabase:', error.message)
        throw error
      }

      if (!data.user) {
        console.error('❌ Nenhum usuário retornado do Auth')
        throw new Error('Login falhou - nenhum usuário retornado')
      }

      console.log('✅ Auth bem-sucedido!')
      console.log('👤 User ID:', data.user.id)
      console.log('📧 Email:', data.user.email)
      
      setSupabaseUser(data.user)
      
      console.log('🔍 Buscando perfil do usuário...')
      await fetchUserProfile(data.user.id, data.user.email || undefined)
      
    } catch (error: any) {
      console.error('💥 Erro completo no login:', error)
      setLoading(false)
      throw new Error(error.message || 'Erro no login')
    }
  }

  const register = async (email: string, password: string, nome: string, funcao: UserRole) => {
    setLoading(true)
    
    try {
      console.log('Registrando usuário...', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        console.log('Criando perfil...')
        
        // Criar perfil
        const { data: profiles, error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            nome,
            funcao,
            data_cadastro: new Date().toISOString()
          })
          .select()

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
          throw new Error('Erro ao criar perfil')
        }

        if (!profiles || profiles.length === 0) {
          throw new Error('Perfil não foi criado')
        }

        const profile = profiles[0]
        console.log('✅ Perfil criado:', profile.nome)
        setUser(profile)
        setSupabaseUser(data.user)
        localStorage.setItem('fluxo_user', JSON.stringify(profile))
      }
      
    } catch (error: any) {
      setLoading(false)
      throw new Error(error.message || 'Erro no cadastro')
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSupabaseUser(null)
    localStorage.removeItem('fluxo_user')
  }

  const value = {
    user,
    supabaseUser,
    loading,
    login,
    logout,
    register
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}