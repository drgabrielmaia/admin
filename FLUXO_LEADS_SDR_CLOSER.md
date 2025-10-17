# Sistema de Fluxo de Leads SDR → Closer

## Visão Geral

Sistema completo de gestão de leads que permite o fluxo estruturado entre SDRs e Closers, com distribuição automática de comissões e integração com BPO.

## Como Funciona

### 1. Fluxo do SDR

1. **Cadastrar Leads** (`/dashboard/sdr/leads`)
   - SDR cadastra novos leads através do formulário
   - Leads ficam inicialmente com status "novo"

2. **Qualificar Leads**
   - SDR trabalha os leads, alterando status para:
     - `qualificado`: Lead interessado e qualificado
     - `agendado`: Lead com reunião/apresentação agendada
     - `perdido`: Lead sem interesse

3. **Liberar Leads** (Nova funcionalidade)
   - Leads qualificados/agendados aparecem na seção "Leads para Liberação"
   - SDR clica em "Liberar para Closers" 
   - Lead fica com `status_atribuicao = 'disponivel'`

### 2. Fluxo do Closer

1. **Visualizar Leads Disponíveis** (`/dashboard/closer/leads-disponiveis`)
   - Closer vê todos os leads liberados pelos SDRs
   - Informações completas: nome, contato, origem, observações, SDR responsável

2. **Pegar Lead**
   - Closer clica em "Pegar Lead"
   - Lead fica com `status_atribuicao = 'atribuido'` e `closer_id`
   - Lead sai da lista de disponíveis

3. **Trabalhar o Lead**
   - Fazer chamadas usando o formulário "Nova Chamada"
   - Apenas leads atribuídos ao closer aparecem no formulário

### 3. Registro de Vendas e Comissões

Quando o closer registra uma chamada com resultado "venda":

1. **Atualização do Lead**
   - Status do lead → `convertido`

2. **Comissões Automáticas**
   - Sistema calcula comissão do SDR baseado no percentual do produto
   - Sistema calcula comissão do Closer baseado no percentual do produto
   - Cria registros automáticos na tabela `comissoes`

3. **Integração BPO**
   - Entrada automática no motor BPO correspondente ao tipo do produto
   - Valor da venda é registrado como "Vendas"
   - Descrição indica se foi SDR+Closer ou apenas Closer

## Estrutura de Dados

### Novos Campos na Tabela `leads`
```sql
status_atribuicao TEXT     -- 'disponivel', 'atribuido' ou NULL
closer_id UUID            -- ID do closer que pegou o lead  
data_atribuicao TIMESTAMPTZ -- Quando foi atribuído
```

### Tabela `produtos` - Comissões
```sql
comissao_sdr_percent NUMERIC(5,2)    -- Ex: 5.00 = 5%
comissao_closer_percent NUMERIC(5,2) -- Ex: 10.00 = 10%
```

### Tabela `movimentacoes_bpo`
```sql
motor TEXT              -- 'mentoria', 'infoproduto', etc
tipo TEXT              -- 'entrada', 'saida'
categoria TEXT         -- 'Vendas'
valor NUMERIC(10,2)    -- Valor da venda
descricao TEXT         -- Detalhes da venda
origem_venda TEXT      -- 'lead_conversion'
lead_id UUID           -- Link para o lead
produto_id UUID        -- Link para o produto
```

## Componentes Criados

### Para SDRs
- `LeadsParaLiberacao.tsx` - Lista leads qualificados para liberação
- Integrado em `/dashboard/sdr/leads`

### Para Closers  
- `LeadsDisponiveis.tsx` - Lista leads disponíveis para pegar
- Página `/dashboard/closer/leads-disponiveis`
- Link no dashboard principal do closer

### Atualizações
- `RegistrarChamadaForm.tsx` - Sistema de comissões e BPO integrado
- Formulário agora só mostra leads atribuídos ao closer

## Estados do Lead

1. **novo** → SDR trabalha o lead
2. **qualificado/agendado** → SDR pode liberar (`status_atribuicao = 'disponivel'`)
3. **disponivel** → Closer pode pegar (`status_atribuicao = 'atribuido'`)  
4. **atribuido** → Closer trabalha o lead
5. **convertido** → Venda fechada com comissões automáticas

## Benefícios

✅ **Fluxo Estruturado**: Processo claro SDR → Closer  
✅ **Comissões Automáticas**: Distribuição automática baseada nos percentuais do produto  
✅ **Integração BPO**: Vendas aparecem automaticamente no motor correto  
✅ **Rastreabilidade**: Histórico completo de quem trabalhou cada lead  
✅ **Performance**: Métricas separadas para SDR e Closer  

## Próximos Passos

1. **Executar migração** - Aplicar `migration_leads_atribuicao.sql` no Supabase
2. **Configurar produtos** - Definir percentuais de comissão para cada produto
3. **Testar fluxo completo** - SDR → liberação → Closer → venda → comissão
4. **Monitorar BPO** - Verificar se vendas aparecem corretamente nos motores