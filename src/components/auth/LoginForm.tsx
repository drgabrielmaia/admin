'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, LogIn } from 'lucide-react'

interface LoginFormProps {
  onToggleRegister: () => void
}

export function LoginForm({ onToggleRegister }: LoginFormProps) {
  const { login, user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      console.log('✅ Login bem-sucedido!')
      
      // Aguardar um pouquinho e usar o contexto user diretamente
      setTimeout(() => {
        const currentUser = JSON.parse(localStorage.getItem('fluxo_user') || '{}')
        console.log('🔍 DEBUG - Usuário completo:', currentUser)
        console.log('🔍 DEBUG - Função do usuário:', currentUser.funcao)
        console.log('🔍 DEBUG - Tipo da função:', typeof currentUser.funcao)
        
        const funcao = currentUser.funcao
        
        if (funcao == 'sdr') {
          console.log('➡️ Redirecionando para SDR')
          router.push('/dashboard/sdr')
        } else if (funcao == 'closer') {
          console.log('➡️ Redirecionando para Closer')  
          router.push('/dashboard/closer')
        } else if (funcao == 'mentorado') {
          console.log('➡️ Redirecionando para Mentorado')
          router.push('/dashboard/mentorado')
        } else if (funcao == 'admin') {
          console.log('➡️ Redirecionando para Admin')
          router.push('/dashboard/admin')
        } else {
          console.log('❌ Função não reconhecida:', funcao, '- Redirecionando para Admin')
          router.push('/dashboard/admin')
        }
      }, 500)
      
    } catch (err: any) {
      setError(err.message || 'Erro no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Fluxo Lucrativo
        </CardTitle>
        <CardDescription className="text-center">
          Faça login na sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </>
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Não tem conta? </span>
            <button
              type="button"
              onClick={onToggleRegister}
              className="text-primary hover:underline font-medium"
            >
              Cadastre-se aqui
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}