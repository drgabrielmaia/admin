'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle2, 
  XCircle, 
  Clock,
  DollarSign,
  User,
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface VendaPendente {
  id: string
  tipo: 'chamada' | 'lead'
  lead_nome: string
  sdr_nome: string
  closer_nome: string
  valor: number
  data_chamada: string
  observacoes: string
  duracao_minutos: number
  produto_id?: string
  produto_nome?: string
  produto_tipo?: string
}

interface Produto {
  id: string
  nome: string
  tipo: string
  preco: number
}

export function VendasAprovacao() {
  const { user } = useAuth()
  const [vendas, setVendas] = useState<VendaPendente[]>([])
  const [, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState<string | null>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState<{ [key: string]: string }>({})
  const [produtoSelecionado, setProdutoSelecionado] = useState<{ [key: string]: string }>({})
  const [vendaSelecionada, setVendaSelecionada] = useState<string | null>(null)
  const [vendaParaAprovar, setVendaParaAprovar] = useState<string | null>(null)

  useEffect(() => {
    loadVendasPendentes()
    loadProdutos()
  }, [])

  const loadProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, tipo, preco')
        .eq('status', 'ativo')
        .order('nome')

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const loadVendasPendentes = async () => {
    try {
      setLoading(true)
      
      // Carregar chamadas com vendas pendentes de aprovação
      const { data: chamadasData, error: chamadasError } = await supabase
        .from('chamadas')
        .select(`
          id,
          valor,
          data_chamada,
          duracao_minutos,
          closer_id,
          lead_id,
          leads!inner(nome, sdr_id)
        `)
        .eq('resultado', 'venda')
        .eq('status_aprovacao', 'pendente')
        .order('created_at', { ascending: false })

      if (chamadasError) {
        console.error('Erro ao carregar chamadas pendentes:', chamadasError)
        return
      }

      console.log('🔍 Buscando leads convertidos...')
      
      // Carregar leads que passaram para vendas mas ainda não foram aprovados 
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          nome,
          valor_estimado,
          created_at,
          produto_id,
          status,
          sdr_id,
          produtos:produto_id(nome, tipo, preco)
        `)
        .eq('status', 'convertido')
        .order('created_at', { ascending: false })

      if (leadsError) {
        console.error('❌ Erro ao carregar leads pendentes:', leadsError)
        console.error('🔍 Detalhes do erro:', leadsError.details)
        console.error('🔍 Código do erro:', leadsError.code)
        console.error('🔍 Hint do erro:', leadsError.hint)
      }

      console.log('📋 Leads convertidos encontrados:', leadsData)
      console.log('🔢 Total de leads convertidos:', leadsData?.length || 0)
      
      // Log detalhado de cada lead
      leadsData?.forEach((lead, index) => {
        console.log(`📝 Lead ${index + 1}:`, {
          id: lead.id,
          nome: lead.nome,
          status: lead.status,
          produto: (lead.produtos as any)?.nome || 'SEM PRODUTO',
          tipo: (lead.produtos as any)?.tipo || 'N/A'
        })
      })

      // Buscar nomes dos closers para as chamadas
      let vendasFormatted: VendaPendente[] = []
      if (chamadasData && chamadasData.length > 0) {
        const closerIds = [...new Set(chamadasData.map(c => c.closer_id))]
        const sdrIds = [...new Set(chamadasData.map(c => (c.leads as any)?.sdr_id).filter(Boolean))]
        
        // Buscar nomes dos closers e SDRs
        const { data: usuarios } = await supabase
          .from('users')
          .select('id, nome')
          .in('id', [...closerIds, ...sdrIds])
        
        const usuariosMap = new Map(usuarios?.map(u => [u.id, u.nome]) || [])
        
        // Formatar chamadas para o formato padrão
        vendasFormatted = chamadasData.map((venda: any) => ({
          id: venda.id,
          tipo: 'chamada',
          lead_nome: venda.leads?.nome || 'N/A',
          closer_nome: usuariosMap.get(venda.closer_id) || 'N/A',
          sdr_nome: usuariosMap.get(venda.leads?.sdr_id) || 'N/A',
          valor: venda.valor || 0,
          data_chamada: venda.data_chamada,
          observacoes: '',
          duracao_minutos: venda.duracao_minutos || 0
        }))
      }

      // Buscar nomes dos SDRs para os leads e formatar
      let leadsFormatted: VendaPendente[] = []
      if (leadsData && leadsData.length > 0) {
        const sdrIds = [...new Set(leadsData.map(l => l.sdr_id).filter(Boolean))]
        
        // Buscar nomes dos SDRs (pode reutilizar usuários já carregados)
        const { data: sdrs } = await supabase
          .from('users')
          .select('id, nome')
          .in('id', sdrIds)
        
        const sdrsMap = new Map(sdrs?.map(u => [u.id, u.nome]) || [])
        
        // Formatar leads para o formato padrão 
        leadsFormatted = leadsData.map((lead: any) => ({
          id: lead.id,
          tipo: 'lead',
          lead_nome: lead.nome || 'N/A',
          closer_nome: 'Lead Direto',  // Leads convertidos não têm closer
          sdr_nome: sdrsMap.get(lead.sdr_id) || 'N/A',
          valor: lead.valor_estimado || 0,
          data_chamada: lead.created_at,
          observacoes: '',
          duracao_minutos: 0,
          produto_id: lead.produto_id, // Incluir produto_id para pré-seleção
          produto_nome: lead.produtos?.nome || 'Produto não identificado',
          produto_tipo: lead.produtos?.tipo || 'N/A'
        }))
      }

      // Combinar e ordenar todas as vendas pendentes
      const todasVendas = [...vendasFormatted, ...leadsFormatted]
        .sort((a, b) => new Date(b.data_chamada).getTime() - new Date(a.data_chamada).getTime())

      setVendas(todasVendas)
      
      // Pré-selecionar produtos para leads que já têm produto definido
      const preSelecoes: Record<string, string> = {}
      todasVendas.forEach(venda => {
        if (venda.tipo === 'lead' && venda.produto_id) {
          preSelecoes[venda.id] = venda.produto_id
        }
      })

      if (Object.keys(preSelecoes).length > 0) {
        setProdutoSelecionado(prev => ({ ...prev, ...preSelecoes }))
        console.log('✅ Produtos pré-selecionados:', preSelecoes)
      }
    } catch (error) {
      console.error('Erro ao buscar vendas pendentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const aprovarVenda = async (vendaId: string) => {
    console.log('🚀 INÍCIO - Aprovando venda:', vendaId)
    
    if (!user) return

    const venda = vendas.find(v => v.id === vendaId)
    if (!venda) {
      alert('Venda não encontrada.')
      return
    }
    
    const { observacoes: _, ...vendaSemObservacoes } = venda
    console.log('📋 Dados da venda:', vendaSemObservacoes)
    
    // Usar produto já selecionado manualmente ou produto da venda/lead
    let produtoId = produtoSelecionado[vendaId] || venda.produto_id

    // Se ainda não tem produto, buscar da chamada ou lead
    if (!produtoId) {
      if (venda.tipo === 'chamada') {
        console.log('🔍 Buscando produto_id da chamada...')
        const { data: chamadaData } = await supabase
          .from('chamadas')
          .select('produto_id')
          .eq('id', vendaId)
          .single()
        produtoId = chamadaData?.produto_id
        console.log('📦 Produto encontrado na chamada:', produtoId)
      }
    }

    console.log('🎯 Produto ID final:', produtoId)

    if (!produtoId) {
      alert('Produto não identificado. Verifique se a venda tem um produto associado.')
      return
    }

    try {
      console.log('⏳ Iniciando processamento...')
      setProcessando(vendaId)
      
      if (venda.tipo === 'chamada') {
        console.log('📞 Processando CHAMADA - Chamando RPC...')
        
        // Aprovar venda de chamada (processo original)
        const { data, error } = await supabase
          .rpc('aprovar_rejeitar_venda', {
            p_chamada_id: vendaId,
            p_admin_id: user.id,
            p_acao: 'aprovar',
            p_produto_id: produtoId
          })

        console.log('🔄 Resultado RPC:', { data, error })

        if (error) {
          console.error('❌ Erro ao aprovar venda de chamada:', error)
          alert('Erro ao aprovar venda: ' + error.message)
          return
        }

        if (!data?.success) {
          console.log('❌ RPC retornou falha:', data)
          alert(data?.message || 'Erro ao aprovar venda')
          return
        }
        
        console.log('✅ Chamada aprovada com sucesso!')
      } else if (venda.tipo === 'lead') {
        console.log('📈 Processando LEAD...')
        // Buscar dados do lead e produto antes de aprovar
        console.log('🔍 Buscando dados do lead...')
        const { data: leadCompleto, error: leadFetchError } = await supabase
          .from('leads')
          .select(`
            *,
            produtos:produto_id(nome, preco, custo)
          `)
          .eq('id', vendaId)
          .single()

        console.log('📊 Dados do lead:', { leadCompleto, leadFetchError })

        if (leadFetchError || !leadCompleto) {
          console.error('❌ Erro ao buscar dados do lead:', leadFetchError)
          alert('Erro ao buscar dados do lead')
          return
        }

        // Aprovar conversão de lead diretamente para venda
        console.log('✏️ Atualizando status do lead para aprovado...')
        const { error: leadError } = await supabase
          .from('leads')
          .update({ 
            status: 'aprovado',
            produto_id: produtoId,
            data_venda: new Date().toISOString(),
            aprovado_por: user.id,
            aprovado_em: new Date().toISOString()
          })
          .eq('id', vendaId)

        console.log('📝 Resultado update lead:', { leadError })

        if (leadError) {
          console.error('❌ Erro ao aprovar lead:', leadError)
          alert('Erro ao aprovar lead: ' + leadError.message)
          return
        }

        // Criar entrada no faturamento/movimentação financeira
        console.log('💰 Iniciando criação de entrada no faturamento...')
        try {
          console.log('🔍 Buscando dados do produto...')
          const produto = leadCompleto.produtos || await supabase
            .from('produtos')
            .select('nome, preco, custo, tipo')
            .eq('id', produtoId)
            .single()
            .then(({ data }) => data)

          console.log('📦 Produto encontrado:', produto)

          if (produto) {
            // Buscar uma conta bancária ativa para registrar a entrada
            console.log('🏦 Buscando conta bancária ativa...')
            const { data: conta } = await supabase
              .from('contas_bancarias')
              .select('id')
              .eq('ativo', true)
              .limit(1)
              .single()

            console.log('💳 Conta encontrada:', conta)

            if (conta) {
              const dadosInsert = {
                conta_id: conta.id,
                tipo: 'entrada',
                categoria: `${produto.tipo || 'Venda'} - ${produto.nome}`,
                subcategoria: 'Venda Aprovada',
                descricao: `Venda aprovada: ${leadCompleto.nome} - Lead #${vendaId}`,
                valor: produto.preco || venda.valor,
                data_movimento: new Date().toISOString().split('T')[0],
                metodo_pagamento: 'pix',
                negocio: produto.tipo || 'mentoria',
                status: 'realizado'
              }

              console.log('💰 Tentando inserir na movimentacoes_financeiras:', dadosInsert)

              const { error: movError } = await supabase
                .from('movimentacoes_financeiras')
                .insert(dadosInsert)
              
              console.log('💾 Resultado insert movimentacoes_financeiras:', { movError })
              
              if (movError) {
                console.error('❌ Erro específico no insert movimentacoes_financeiras:', movError)
                throw movError
              }
              
              console.log('✅ Entrada no faturamento criada para lead aprovado!')
            } else {
              console.log('⚠️ Nenhuma conta bancária ativa encontrada')
            }
          } else {
            console.log('⚠️ Dados do produto não encontrados')
          }
        } catch (faturamentoError) {
          console.error('❌ ERRO CAPTURADO no faturamento:', faturamentoError)
          console.error('❌ Stack trace:', (faturamentoError as Error).stack)
          // Não bloquear a aprovação por causa do faturamento
        }

        // Atualizar metas após aprovação do lead como venda
        try {
          // Importar a função de atualização de metas
          const { forceUpdateLeadsMetas } = await import('@/lib/metas-utils')
          
          if (leadCompleto.sdr_id) {
            await forceUpdateLeadsMetas(leadCompleto.sdr_id)
            console.log('✅ Metas de leads atualizadas após aprovação')
          }
          
          await supabase.rpc('atualizar_metas_com_dados_reais')
          console.log('✅ Metas gerais atualizadas após aprovação de lead')
        } catch (metaError) {
          console.warn('⚠️ Erro ao atualizar metas:', metaError)
        }
      }

      console.log('🧹 Removendo venda da lista após aprovação...')
      // Remover da lista após aprovação bem-sucedida
      setVendas(prev => prev.filter(v => v.id !== vendaId))
      setProdutoSelecionado(prev => {
        const newState = { ...prev }
        delete newState[vendaId]
        return newState
      })
      setVendaParaAprovar(null)
      console.log('🎉 SUCESSO TOTAL - Aprovação finalizada!')
      alert(`${venda.tipo === 'lead' ? 'Lead' : 'Venda'} aprovado com sucesso!`)
      
    } catch (error) {
      console.error('❌ ERRO FINAL capturado:', error)
      console.error('❌ Stack completo:', (error as Error).stack)
      alert('Erro interno. Verifique o console para detalhes: ' + (error as Error).message)
    } finally {
      console.log('🏁 FINALIZANDO processamento...')
      setProcessando(null)
    }
  }

  const rejeitarVenda = async (vendaId: string) => {
    const motivo = motivoRejeicao[vendaId]
    if (!motivo || motivo.trim() === '') {
      alert('Digite um motivo para a rejeição.')
      return
    }

    if (!user) return

    const venda = vendas.find(v => v.id === vendaId)
    if (!venda) {
      alert('Venda não encontrada.')
      return
    }

    try {
      setProcessando(vendaId)
      
      if (venda.tipo === 'chamada') {
        // Rejeitar venda de chamada (processo original)
        const { data, error } = await supabase
          .rpc('aprovar_rejeitar_venda', {
            venda_id: vendaId,
            acao: 'rejeitar',
            admin_id: user.id,
            motivo: motivo
          })

        if (error) {
          console.error('Erro ao rejeitar venda de chamada:', error)
          alert('Erro ao rejeitar venda. Verifique o console.')
          return
        }

        if (!data) {
          alert('Venda não encontrada ou já foi processada.')
          return
        }
      } else if (venda.tipo === 'lead') {
        // Rejeitar conversão de lead
        const { error: leadError } = await supabase
          .from('leads')
          .update({ 
            status: 'rejeitado',
            motivo_rejeicao: motivo,
            rejeitado_por: user.id,
            rejeitado_em: new Date().toISOString()
          })
          .eq('id', vendaId)

        if (leadError) {
          console.error('Erro ao rejeitar lead:', leadError)
          alert('Erro ao rejeitar lead: ' + leadError.message)
          return
        }
      }

      // Remover da lista e limpar motivo após rejeição bem-sucedida
      setVendas(prev => prev.filter(v => v.id !== vendaId))
      setMotivoRejeicao(prev => {
        const newState = { ...prev }
        delete newState[vendaId]
        return newState
      })
      setVendaSelecionada(null)
      alert(`${venda.tipo === 'lead' ? 'Lead' : 'Venda'} rejeitado.`)
      
    } catch (error) {
      console.error('Erro ao rejeitar venda:', error)
      alert('Erro interno. Verifique o console.')
    } finally {
      setProcessando(null)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      maximumFractionDigits: 2 
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold text-foreground tracking-tight">
          Aprovação de Vendas
        </h2>
        <p className="text-muted-foreground mt-1">
          Vendas reportadas pelos SDRs/Closers aguardando aprovação administrativa
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 bg-orange-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-foreground">{vendas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-emerald-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(vendas.reduce((sum, v) => sum + v.valor, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-blue-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Closers</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(vendas.map(v => v.closer_nome)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vendas */}
      {vendas.length > 0 ? (
        <div className="space-y-4">
          {vendas.map((venda) => (
            <Card key={venda.id} className="border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-orange-500/10">
                      <Clock className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {venda.lead_nome}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={
                          venda.tipo === 'lead' 
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                            : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        }>
                          {venda.tipo === 'lead' ? 'Lead Direto' : 'Chamada'}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          {venda.closer_nome}
                        </Badge>
                        {venda.sdr_nome !== 'N/A' && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                            SDR: {venda.sdr_nome}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(venda.data_chamada)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(venda.valor)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {venda.tipo === 'lead' ? 'Conversão Direta' : formatDuration(venda.duracao_minutos)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Produto pré-selecionado para leads */}
                {venda.tipo === 'lead' && venda.produto_nome && venda.produto_nome !== 'Produto não identificado' && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-400">Produto Já Selecionado</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>{venda.produto_nome}</strong> ({venda.produto_tipo})
                        </p>
                      </div>
                    </div>
                  </div>
                )}


                {/* Campo para aprovação - confirmação simplificada */}
                {vendaParaAprovar === venda.id && (
                  <div className="space-y-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <Label className="text-sm font-medium text-green-400">
                        Confirmar aprovação desta venda?
                      </Label>
                    </div>
                    
                    {/* Mostrar produto e valor da venda */}
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-300">
                        <strong>Produto:</strong> {venda.produto_nome || 'Produto da venda'}
                      </p>
                      <p className="text-sm text-green-400">
                        <strong>Valor:</strong> {venda.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => aprovarVenda(venda.id)}
                        disabled={processando === venda.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {processando === venda.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Aprovando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Confirmar Aprovação
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setVendaParaAprovar(null)}
                        disabled={processando === venda.id}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Campo de rejeição */}
                {vendaSelecionada === venda.id && (
                  <div className="space-y-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <Label className="text-sm font-medium text-red-400">
                        Motivo da rejeição (obrigatório)
                      </Label>
                    </div>
                    <Textarea
                      value={motivoRejeicao[venda.id] || ''}
                      onChange={(e) => setMotivoRejeicao(prev => ({
                        ...prev,
                        [venda.id]: e.target.value
                      }))}
                      placeholder="Ex: Dados do lead incompletos, valor inconsistente, etc."
                      className="min-h-[80px]"
                    />
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-end space-x-3">
                  {vendaSelecionada === venda.id ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setVendaSelecionada(null)
                          setMotivoRejeicao(prev => {
                            const newState = { ...prev }
                            delete newState[venda.id]
                            return newState
                          })
                        }}
                        disabled={processando === venda.id}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => rejeitarVenda(venda.id)}
                        disabled={processando === venda.id || !motivoRejeicao[venda.id]?.trim()}
                      >
                        {processando === venda.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Confirmar Rejeição
                      </Button>
                    </>
                  ) : vendaParaAprovar === venda.id ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setVendaParaAprovar(null)
                          setProdutoSelecionado(prev => {
                            const newState = { ...prev }
                            delete newState[venda.id]
                            return newState
                          })
                        }}
                        disabled={processando === venda.id}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => aprovarVenda(venda.id)}
                        disabled={processando === venda.id || !produtoSelecionado[venda.id]}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        {processando === venda.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Confirmar Aprovação
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setVendaSelecionada(venda.id)}
                        disabled={processando === venda.id}
                        className="text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                      <Button
                        onClick={() => setVendaParaAprovar(venda.id)}
                        disabled={processando === venda.id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Aprovar Venda
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Todas as vendas foram processadas
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Não há vendas pendentes de aprovação no momento. As vendas aprovadas aparecerão automaticamente nas metas e dashboards.
          </p>
        </div>
      )}
    </div>
  )
}