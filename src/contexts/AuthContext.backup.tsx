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

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    const cachedUser = localStorage.getItem('fluxo_user')
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser)
        console.log('🔄 Carregando usuário do cache:', userData.nome)
        setUser(userData)
        setLoading(false) // Parar loading se encontrou no cache
      } catch (e) {
        localStorage.removeItem('fluxo_user')
      }
    }
  }, [])

  // Parar loading quando user for definido
  useEffect(() => {
    if (user) {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    let isMounted = true
    
    // Verificar sessão inicial
    const getInitialSession = async () => {
      try {
        console.log('Verificando sessão inicial...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.error('Erro ao verificar sessão:', error)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('Sessão encontrada para:', session.user.email)
          setSupabaseUser(session.user)
          
          // Buscar perfil uma única vez
          const success = await fetchUserProfile(session.user.id)
          if (success && isMounted) {
            console.log('✅ Perfil carregado com sucesso, parando busca')
            setLoading(false)
          }
        } else {
          console.log('Nenhuma sessão encontrada')
          if (isMounted) setLoading(false)
        }
      } catch (error) {
        console.error('Erro fatal na verificação de sessão:', error)
        if (isMounted) setLoading(false)
      }
    }

    getInitialSession()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (!isMounted) return
      
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user)
        const success = await fetchUserProfile(session.user.id)
        if (success) {
          console.log('✅ Login completo, perfil carregado')
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuário deslogado')
        setUser(null)
        setSupabaseUser(null)
        localStorage.removeItem('fluxo_user') // Limpar cache local
      }
      
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string): Promise<boolean> => {
    try {
      console.log(`Buscando perfil para usuário ${userId}...`)
      
      // Verificar cache primeiro
      const cachedUser = localStorage.getItem('fluxo_user')
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser)
          if (userData.id === userId) {
            console.log('✅ Perfil encontrado no cache')
            setUser(userData)
            return true
          }
        } catch (e) {
          localStorage.removeItem('fluxo_user')
        }
      }
      
      // BYPASS RLS: usar função RPC que ignora RLS
      const { data, error } = await supabase.rpc('get_user_profile', {
        user_id: userId
      })

      if (error) {
        console.error('Erro ao buscar perfil via RPC:', error)
        
        // Fallback: tentar busca direta (pode falhar por RLS)
        const { data: directData, error: directError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
          
        if (directError) {
          console.error('Erro na busca direta também:', directError)
          return false
        }
        
        if (directData) {
          console.log('✅ Perfil encontrado via busca direta:', directData.nome)
          setUser(directData)
          localStorage.setItem('fluxo_user', JSON.stringify(directData))
          return true
        }
        
        return false
      }

      if (!data || data.length === 0) {
        console.error('Nenhum perfil encontrado para userId:', userId)
        return false
      }

      const userProfile = Array.isArray(data) ? data[0] : data
      console.log('✅ Perfil encontrado via RPC:', userProfile.nome, userProfile.funcao)
      
      // Salvar e finalizar
      setUser(userProfile)
      localStorage.setItem('fluxo_user', JSON.stringify(userProfile))
      
      return true
    } catch (error) {
      console.error('Erro fatal ao buscar perfil:', error)
      return false
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('Tentando fazer login com:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Erro no Supabase Auth:', error)
        throw error
      }

      if (!data.user) {
        throw new Error('Nenhum usuário retornado do login')
      }

      console.log('Login bem-sucedido no Auth, buscando perfil...')
      setSupabaseUser(data.user)
      
      const profileFound = await fetchUserProfile(data.user.id)
      
      if (!profileFound) {
        console.error('Perfil não encontrado para o usuário logado')
        throw new Error('Perfil do usuário não encontrado')
      }
      
      console.log('✅ Login completo com sucesso!')
      
    } catch (error: any) {
      console.error('Erro completo no login:', error)
      setLoading(false) // Importante: parar loading em caso de erro
      throw new Error(error.message || 'Erro no login')
    }
    
    // Loading será parado automaticamente quando user for definido
  }

  const register = async (email: string, password: string, nome: string, funcao: UserRole) => {
    setLoading(true)
    try {
      console.log('Iniciando cadastro para:', email, funcao)
      
      // Configurar para não exigir confirmação por email
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Não redirecionar por email
        }
      })

      if (error) {
        console.error('Erro no signUp:', error)
        throw error
      }

      console.log('SignUp response:', data)

      if (data.user) {
        console.log('Usuário criado no Auth:', data.user.id, 'Email confirmed?', data.user.email_confirmed_at)
        
        // Aguardar um pouco para garantir que o usuário foi processado
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        try {
          console.log('Verificando se perfil já existe...')
          
          // Primeiro verificar se o usuário já existe via RPC
          const { data: existingUsers } = await supabase.rpc('get_user_profile', {
            user_id: data.user.id
          })

          if (existingUsers && existingUsers.length > 0) {
            const existingUser = existingUsers[0]
            console.log('✅ Perfil já existe, fazendo login direto:', existingUser.nome)
            setUser(existingUser)
            setSupabaseUser(data.user)
            localStorage.setItem('fluxo_user', JSON.stringify(existingUser))
            return existingUser
          }

          console.log('Perfil não existe, criando novo...')
          
          // Criar perfil do usuário
          const profilePayload = {
            id: data.user.id,
            email: data.user.email!,
            nome,
            funcao,
            data_cadastro: new Date().toISOString(),
            primeiro_login: new Date().toISOString()
          }
          
          console.log('Payload do perfil:', profilePayload)
          
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert(profilePayload)
            .select()
            .single()

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError)
            console.error('Código do erro:', profileError.code)
            console.error('Mensagem:', profileError.message)
            
            // Se ainda assim der duplicate, tentar buscar o usuário existente via RPC
            if (profileError.message?.includes('duplicate key value')) {
              console.log('Usuário foi criado por outro processo, buscando via RPC...')
              const { data: existingProfiles } = await supabase.rpc('get_user_profile', {
                user_id: data.user.id
              })
                
              if (existingProfiles && existingProfiles.length > 0) {
                const existingProfile = existingProfiles[0]
                setUser(existingProfile)
                setSupabaseUser(data.user)
                localStorage.setItem('fluxo_user', JSON.stringify(existingProfile))
                return existingProfile
              }
            }
            
            throw new Error(`Erro ao criar perfil: ${profileError.message}`)
          }

          console.log('✅ Perfil criado com sucesso:', profileData)
          
          // Definir o usuário diretamente e salvar no localStorage
          setUser(profileData)
          setSupabaseUser(data.user)
          localStorage.setItem('fluxo_user', JSON.stringify(profileData))
          
          return profileData

        } catch (profileError) {
          console.error('Erro fatal ao criar perfil:', profileError)
          
          // Tentar deletar o usuário do Auth se não conseguiu criar o perfil
          try {
            await supabase.auth.admin.deleteUser(data.user.id)
            console.log('Usuário removido do Auth após erro no perfil')
          } catch (deleteError) {
            console.error('Não conseguiu remover usuário do Auth:', deleteError)
          }
          
          throw profileError
        }
      } else {
        throw new Error('Nenhum usuário retornado do signup')
      }
    } catch (error: any) {
      console.error('Erro completo no cadastro:', error)
      throw new Error(error.message || 'Erro no cadastro')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSupabaseUser(null)
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      setLoading(false)
    }
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