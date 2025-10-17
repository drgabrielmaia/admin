// Script para debug das configurações de comissão
// Execute no console do navegador na página de comissões

console.log('=== DEBUG CONFIGURAÇÕES DE COMISSÃO ===')

// Verificar se a tabela existe
fetch('/api/debug', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'test_table',
    table: 'configuracoes_comissao'
  })
}).then(r => r.json()).then(data => {
  console.log('Tabela configuracoes_comissao:', data)
})

// Testar insert manual
const testData = {
  tipo: 'cargo',
  cargo: 'mentorado',
  percentual_closer: 7,
  percentual_proprio: 12,
  ativo: true
}

// Simular o que está sendo enviado
console.log('Dados de teste que serão enviados:', testData)

// Verificar se o Supabase consegue fazer insert
import { supabase } from '/src/lib/supabase.js'

supabase
  .from('configuracoes_comissao')
  .insert(testData)
  .then(result => {
    console.log('Resultado do insert:', result)
  })
  .catch(error => {
    console.error('Erro no insert:', error)
  })