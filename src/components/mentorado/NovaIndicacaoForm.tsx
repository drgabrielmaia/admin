'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { AlertCircle, CheckCircle2, Send } from 'lucide-react'

interface NovaIndicacaoFormProps {
  onSuccess?: () => void
}

export function NovaIndicacaoForm({ onSuccess }: NovaIndicacaoFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    observacao: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Usuário não encontrado')
      return
    }

    if (user.funcao !== 'mentorado') {
      setError('Apenas mentorados podem enviar indicações')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error: insertError } = await supabase
        .from('indicacoes')
        .insert({
          mentorado_id: user.id,
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          observacao: formData.observacao || null,
          status: 'pendente',
          data_envio: new Date().toISOString(),
          data_atualizacao: new Date().toISOString()
        })

      if (insertError) {
        throw new Error(insertError.message)
      }

      setSuccess(true)
      setFormData({ nome: '', email: '', telefone: '', observacao: '' })
      
      if (onSuccess) {
        onSuccess()
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)

    } catch (error: any) {
      console.error('Erro ao enviar indicação:', error)
      setError(error.message || 'Erro ao enviar indicação')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Nova Indicação
        </CardTitle>
        <CardDescription>
          Envie uma nova indicação e ganhe comissão quando ela converter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Indicação enviada com sucesso! Agora é só aguardar a análise.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Nome da pessoa indicada"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@exemplo.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              placeholder="(11) 99999-9999"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observações</Label>
            <Textarea
              id="observacao"
              value={formData.observacao}
              onChange={(e) => handleInputChange('observacao', e.target.value)}
              placeholder="Informações adicionais sobre a indicação (opcional)"
              rows={3}
              disabled={loading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !formData.nome || !formData.email || !formData.telefone}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Indicação
              </>
            )}
          </Button>
        </form>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💰 Como funciona a comissão?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>5%</strong> se um closer fechar a venda</li>
            <li>• <strong>10%</strong> se você mesmo fechar a venda</li>
            <li>• Comissão calculada sobre o valor total da mentoria</li>
            <li>• Pagamento após confirmação da venda</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}