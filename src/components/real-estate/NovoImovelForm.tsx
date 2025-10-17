'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Package, 
  Save,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface NovoImovelData {
  nome: string
  tipo: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  metragem: string
  quartos: string
  banheiros: string
  vagas_garagem: string
  descricao: string
  valor_compra: string
  valor_venda_pretendido: string
  data_compra: string
  status: string
}

export function NovoImovelForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<NovoImovelData>({
    nome: '',
    tipo: 'casa',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    metragem: '',
    quartos: '',
    banheiros: '',
    vagas_garagem: '',
    descricao: '',
    valor_compra: '',
    valor_venda_pretendido: '',
    data_compra: new Date().toISOString().split('T')[0],
    status: 'disponivel'
  })

  const handleInputChange = (field: keyof NovoImovelData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.endereco || !formData.cidade || !formData.valor_compra || !formData.valor_venda_pretendido) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    try {
      setLoading(true)

      const imovelData = {
        nome: formData.nome,
        tipo: formData.tipo,
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep || null,
        metragem: formData.metragem ? parseFloat(formData.metragem) : null,
        quartos: formData.quartos ? parseInt(formData.quartos) : null,
        banheiros: formData.banheiros ? parseInt(formData.banheiros) : null,
        vagas_garagem: formData.vagas_garagem ? parseInt(formData.vagas_garagem) : null,
        descricao: formData.descricao || null,
        valor_compra: parseFloat(formData.valor_compra),
        valor_venda_pretendido: parseFloat(formData.valor_venda_pretendido),
        data_compra: formData.data_compra,
        status: formData.status
      }

      const { error } = await supabase
        .from('imoveis')
        .insert([imovelData])

      if (error) {
        console.error('Erro ao cadastrar imóvel:', error)
        alert('Erro ao cadastrar imóvel. Verifique o console.')
        return
      }

      alert('Imóvel cadastrado com sucesso!')
      router.push('/dashboard/admin/real-estate')
    } catch (error) {
      console.error('Erro ao cadastrar imóvel:', error)
      alert('Erro interno. Verifique o console.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/admin/real-estate">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
            Novo Imóvel
          </h2>
          <p className="text-muted-foreground mt-1">
            Cadastre um novo imóvel no seu portfólio
          </p>
        </div>
      </div>

      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-primary" />
            <span>Informações do Imóvel</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Imóvel *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Ex: Casa Centro - Lote 01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="terreno">Terreno</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="consultorio">Consultório</option>
                  <option value="sala_comercial">Sala Comercial</option>
                  <option value="loja">Loja</option>
                  <option value="galpao">Galpão</option>
                  <option value="predio">Prédio</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    placeholder="SP"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metragem">Metragem (m²)</Label>
                <Input
                  id="metragem"
                  type="number"
                  step="0.01"
                  value={formData.metragem}
                  onChange={(e) => handleInputChange('metragem', e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quartos">Quartos</Label>
                <Input
                  id="quartos"
                  type="number"
                  value={formData.quartos}
                  onChange={(e) => handleInputChange('quartos', e.target.value)}
                  placeholder="3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banheiros">Banheiros</Label>
                <Input
                  id="banheiros"
                  type="number"
                  value={formData.banheiros}
                  onChange={(e) => handleInputChange('banheiros', e.target.value)}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vagas_garagem">Vagas de Garagem</Label>
                <Input
                  id="vagas_garagem"
                  type="number"
                  value={formData.vagas_garagem}
                  onChange={(e) => handleInputChange('vagas_garagem', e.target.value)}
                  placeholder="2"
                />
              </div>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_compra">Valor de Compra *</Label>
                <Input
                  id="valor_compra"
                  type="number"
                  step="0.01"
                  value={formData.valor_compra}
                  onChange={(e) => handleInputChange('valor_compra', e.target.value)}
                  placeholder="150000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_venda_pretendido">Valor de Venda Pretendido *</Label>
                <Input
                  id="valor_venda_pretendido"
                  type="number"
                  step="0.01"
                  value={formData.valor_venda_pretendido}
                  onChange={(e) => handleInputChange('valor_venda_pretendido', e.target.value)}
                  placeholder="220000"
                  required
                />
              </div>
            </div>

            {/* Data e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_compra">Data de Compra *</Label>
                <Input
                  id="data_compra"
                  type="date"
                  value={formData.data_compra}
                  onChange={(e) => handleInputChange('data_compra', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="em_negociacao">Em Negociação</option>
                  <option value="indisponivel">Indisponível</option>
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descrição detalhada do imóvel..."
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3">
              <Link href="/dashboard/admin/real-estate">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Cadastrar Imóvel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}