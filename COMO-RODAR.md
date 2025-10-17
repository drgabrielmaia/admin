# 🚀 Como Rodar o Sistema Fluxo Lucrativo

## ⚡ Método Rápido (Recomendado)

### 1. Resolver problema do npm
```bash
# Limpar cache do npm
rm -rf ~/.npm/_cacache

# OU usar yarn (mais rápido)
npm install -g yarn
```

### 2. Instalar dependências
```bash
# Com npm
npm install --legacy-peer-deps

# OU com yarn (recomendado)
yarn install
```

### 3. Configurar Supabase
1. Vá em https://supabase.com
2. Crie um novo projeto
3. No SQL Editor, execute o arquivo `supabase-schema.sql`
4. Copie a URL e a chave anônima
5. Cole no arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 4. Rodar o sistema
```bash
# Com npm
npm run dev

# OU com yarn
yarn dev
```

### 5. Abrir no navegador
- Vá em http://localhost:3000
- Clique em "Cadastre-se aqui"
- Crie uma conta como Admin, SDR ou Closer
- Explore os dashboards!

## 🎯 Primeiros Passos

### Criar Usuários de Teste
1. **Admin**: Para visão geral
2. **SDR**: Para testar cadastro de leads
3. **Closer**: Para testar chamadas

### Testar Funcionalidades
1. **Como SDR**: Cadastre alguns leads
2. **Como Closer**: Registre algumas chamadas
3. **Como Admin**: Veja os relatórios

## 🔧 Solução de Problemas

### Se der erro de dependências:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Se der erro de permissão:
```bash
sudo chown -R $(whoami) ~/.npm
```

### Se der erro do Tailwind:
- O sistema funciona mesmo com warnings do Tailwind
- Os estilos estão configurados no globals.css

## 📞 Precisa de Ajuda?
- Verifique se o Node.js está atualizado (v18+)
- Certifique-se que o Supabase está configurado
- Os dados de exemplo são criados automaticamente