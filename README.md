# 🚀 Fluxo Lucrativo - Sistema de Gestão High-Ticket

Sistema web completo para gestão de mentorias, infoprodutos, clínica e operações comerciais com foco em performance de SDR e Closers.

## ✨ Funcionalidades

### 🔐 Sistema de Autenticação
- Login seguro com Supabase Auth
- 3 perfis distintos: **Admin**, **SDR** e **Closer**
- Controle de acesso baseado em roles

### 📊 Dashboard Interativo
- **KPIs em tempo real**: conversões, ticket médio, leads, faturamento
- **Sistema de bandeiras de performance**:
  - 🔴 Vermelha: conversão < 10%
  - 🟡 Amarela: 10% a 15%
  - 🟢 Verde: acima de 15%
  - ⚪ Branca: novos usuários (até 30 dias)
- **Ranking com coroa** para o melhor performer

### 👑 Painel Admin
- Visão geral completa do ecossistema
- Gerenciamento de usuários e produtos
- Controle de metas por usuário e função
- Ativação/desativação de motores (clínica, eventos, parcerias)
- Dashboard consolidado de todas as métricas

### 👤 Painel SDR
- Cadastro e qualificação de leads
- Pipeline visual por etapa
- Indicadores de meta batida e percentual
- Conversão calculada automaticamente
- Gerenciamento de agendamentos

### 📞 Painel Closer
- Registro de chamadas e resultados
- Controle de valores fechados
- Motivos de perda estruturados
- Ranking de conversão (diário, semanal, mensal)
- Análise de performance temporal

## 🛠 Tecnologias Utilizadas

### Frontend
- **Next.js 15** com App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilização
- **Radix UI** para componentes acessíveis
- **Lucide React** para ícones
- **Recharts** para gráficos (preparado)

### Backend
- **Supabase** como Backend-as-a-Service
- **PostgreSQL** como banco de dados
- **Row Level Security (RLS)** para segurança
- **Triggers** automáticos para cálculos

### Design System
- **Dark Theme** com verde neon para destaques
- **Responsivo** para desktop e mobile
- **Animações** suaves e modernas
- **Componentes reutilizáveis**

## 🚀 Como Executar

### 1. Pré-requisitos
```bash
Node.js 18+
npm ou yarn
Conta no Supabase
```

### 2. Instalação
```bash
# Clone o repositório
git clone <seu-repo>
cd fluxo-lucrativo

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.local.example .env.local
```

### 3. Configuração do Supabase

1. **Crie um projeto no Supabase**
2. **Execute o script SQL** em `supabase-schema.sql` no SQL Editor
3. **Configure as variáveis** no `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 4. Executar o projeto
```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build
npm start
```

## 📋 Estrutura do Banco de Dados

### Tabelas Principais
- `users` - Perfis de usuários (Admin, SDR, Closer)
- `leads` - Leads gerados pelos SDRs
- `chamadas` - Chamadas realizadas pelos Closers
- `produtos` - Catálogo de produtos/serviços
- `metas` - Metas individuais por usuário
- `conversoes` - Dados consolidados de performance
- `eventos` - Eventos e mentorias
- `configuracoes` - Configurações do sistema

### Recursos Avançados
- **Triggers automáticos** para cálculo de conversões
- **Funções SQL** para relatórios complexos
- **Indexes** otimizados para performance
- **RLS** configurado para segurança

## 🎯 Fluxo de Uso

### Para SDRs
1. **Login** no sistema
2. **Cadastro de leads** com origem e qualificação
3. **Acompanhamento** do pipeline por status
4. **Agendamento** de chamadas para closers
5. **Monitoramento** de metas e performance

### Para Closers
1. **Login** no sistema  
2. **Registro de chamadas** com resultados
3. **Controle de valores** e motivos de perda
4. **Acompanhamento** de taxa de fechamento
5. **Análise** de performance temporal

### Para Admins
1. **Visão 360°** de todo o ecossistema
2. **Gerenciamento** de usuários e produtos
3. **Definição de metas** individuais
4. **Monitoramento** de performance geral
5. **Controle** de configurações do sistema

## 🔧 Dados de Exemplo

Para testar o sistema, execute:

```typescript
import { createFullSampleData } from '@/lib/sampleData'

// Criar dados básicos
await createFullSampleData()
```

## 🎨 Sistema de Cores

### Palette Principal
- **Background**: `slate-950` (#020617)
- **Cards**: `slate-900` (#0f172a)
- **Primary**: Verde neon `#00ff88`
- **Text**: Branco e tons de cinza
- **Accent**: Verde para destaques

### Bandeiras de Performance
- 🔴 **Vermelha**: `bg-red-100 text-red-600`
- 🟡 **Amarela**: `bg-yellow-100 text-yellow-600`
- 🟢 **Verde**: `bg-green-100 text-green-600`
- ⚪ **Branca**: `bg-white text-gray-600`

## 📱 Responsividade

O sistema é totalmente responsivo com breakpoints:
- **Mobile**: < 640px (1 coluna)
- **Tablet**: 641px - 1024px (2 colunas)
- **Desktop**: > 1025px (4 colunas)

## 🔒 Segurança

### Row Level Security (RLS)
- Usuários veem apenas seus próprios dados
- Admins têm acesso completo
- Políticas configuradas por tabela

### Autenticação
- JWT tokens do Supabase
- Refresh automático de sessões
- Logout seguro com limpeza de estado

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Deploy automático
npx vercel

# Configure as variáveis de ambiente no dashboard
```

### Outros Provedores
- Configure `NEXT_PUBLIC_SUPABASE_URL`
- Configure `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Execute `npm run build`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙋‍♂️ Suporte

Para dúvidas ou suporte:
- Abra uma **Issue** no GitHub
- Consulte a **documentação** do Supabase
- Verifique os **logs** no console

---

**Desenvolvido com 💚 para o ecossistema high-ticket**