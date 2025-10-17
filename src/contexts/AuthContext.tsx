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
  register: (email: string, password: string, nome: string, funcao: UserRole, dataNascimento?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      try {
        // Verificar cache primeiro
        const cachedUser = localStorage.getItem('fluxo_user')
        if (cachedUser) {
          const userData = JSON.parse(cachedUser)
          console.log('🔄 Usuário encontrado no cache:', userData.nome, userData.funcao)
          setUser(userData)
        } else {
          console.log('❌ Nenhum usuário no cache')
        }
      } catch (e) {
        console.error('Erro ao ler cache:', e)
        localStorage.removeItem('fluxo_user')
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const loginBypass = async (email: string) => {
    try {
      console.log('🔓 LOGIN BYPASS - Buscando usuário por email:', email)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)

      console.log('📋 Resultado da busca:', { data, error })

      if (error) {
        throw new Error(`Erro ao buscar usuário: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error(`Usuário não encontrado: ${email}`)
      }

      const userData = data[0]
      console.log('✅ Usuário encontrado:', userData.nome, userData.funcao)
      
      setUser(userData)
      localStorage.setItem('fluxo_user', JSON.stringify(userData))
      setLoading(false)

    } catch (error: any) {
      console.error('❌ Erro no login bypass:', error)
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    
    try {
      console.log('🚀 Tentando login normal primeiro...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.log('❌ Auth falhou, usando bypass...')
        await loginBypass(email)
        return
      }

      if (data.user) {
        console.log('✅ Auth funcionou, buscando perfil...')
        setSupabaseUser(data.user)
        await loginBypass(data.user.email!)
      }
      
    } catch (error: any) {
      setLoading(false)
      throw new Error(error.message || 'Erro no login')
    }
  }

  const register = async (email: string, password: string, nome: string, funcao: UserRole, dataNascimento?: string) => {
    setLoading(true)
    
    try {
      console.log('📝 Criando usuário direto na tabela...')
      
      // Criar direto na tabela users
      const { data: profiles, error: profileError } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(), // Gerar ID aleatório
          email,
          nome,
          funcao,
          data_nascimento: dataNascimento || null,
          data_cadastro: new Date().toISOString()
        })
        .select()

      if (profileError) {
        throw new Error(`Erro ao criar usuário: ${profileError.message}`)
      }

      if (!profiles || profiles.length === 0) {
        throw new Error('Usuário não foi criado')
      }

      const profile = profiles[0]
      console.log('✅ Usuário criado:', profile.nome)
      
      setUser(profile)
      localStorage.setItem('fluxo_user', JSON.stringify(profile))
      setLoading(false)
      
    } catch (error: any) {
      setLoading(false)
      throw new Error(error.message || 'Erro no cadastro')
    }
  }

  const logout = async () => {
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