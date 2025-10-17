'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UserPlus, Cake } from 'lucide-react'

interface RegisterFormProps {
  onToggleLogin: () => void
}

export function RegisterForm({ onToggleLogin }: RegisterFormProps) {
  const { register } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [funcao, setFuncao] = useState<UserRole | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!funcao) {
      setError('Selecione uma função')
      return
    }

    setLoading(true)
    setError('')

    try {
      await register(email, password, nome, funcao as UserRole, dataNascimento || undefined)
    } catch (err: any) {
      setError(err.message || 'Erro no cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Criar Conta
        </CardTitle>
        <CardDescription className="text-center">
          Cadastre-se no Fluxo Lucrativo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataNascimento" className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-pink-400" />
              Data de Nascimento
            </Label>
            <Input
              id="dataNascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-400">
              Opcional - para celebrarmos seu aniversário! 🎉
            </p>
          </div>

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
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="funcao">Função</Label>
            <Select value={funcao} onValueChange={(value: string) => setFuncao(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sdr">SDR</SelectItem>
                <SelectItem value="closer">Closer</SelectItem>
                <SelectItem value="mentorado">Mentorado</SelectItem>
              </SelectContent>
            </Select>
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
                Cadastrando...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar
              </>
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Já tem conta? </span>
            <button
              type="button"
              onClick={onToggleLogin}
              className="text-primary hover:underline font-medium"
            >
              Faça login aqui
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}