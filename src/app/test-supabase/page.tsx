'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestSupabase() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testando...')
  interface TableStatus {
    table: string
    status: string
    count?: number
    error?: string
  }

  const [tablesStatus, setTablesStatus] = useState<TableStatus[]>([])
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = useCallback((message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }, [])

  const testConnection = useCallback(async () => {
    try {
      addResult('Testando conexão com Supabase...')

      // Teste 1: Verificar se o Supabase responde
      const { error } = await supabase.from('users').select('count').limit(1)

      if (error) {
        setConnectionStatus(`❌ Erro: ${error.message}`)
        addResult(`Erro na conexão: ${error.message}`)

        if (error.message.includes('relation "users" does not exist')) {
          addResult('❌ PROBLEMA: Tabela "users" não existe! Execute o script SQL no Supabase.')
        }
      } else {
        setConnectionStatus('✅ Conectado com sucesso!')
        addResult('✅ Conexão com Supabase funcionando')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setConnectionStatus(`❌ Erro de conexão: ${errorMessage}`)
      addResult(`Erro fatal: ${errorMessage}`)
    }
  }, [addResult])

  const testTables = useCallback(async () => {
    const tables = ['users', 'produtos', 'leads', 'chamadas', 'conversoes', 'metas']
    const results: TableStatus[] = []

    for (const table of tables) {
      try {
        addResult(`Testando tabela ${table}...`)
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })

        if (error) {
          results.push({ table, status: '❌', error: error.message })
          addResult(`❌ Tabela ${table}: ${error.message}`)
        } else {
          results.push({ table, status: '✅', count: count ?? 0 })
          addResult(`✅ Tabela ${table}: ${count} registros`)
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        results.push({ table, status: '❌', error: errorMessage })
        addResult(`❌ Tabela ${table}: ${errorMessage}`)
      }
    }

    setTablesStatus(results)
  }, [addResult])

  const testAuth = useCallback(async () => {
    try {
      addResult('Testando autenticação...')

      // Tentar fazer login com credenciais inexistentes para testar se o auth funciona
      const { error } = await supabase.auth.signInWithPassword({
        email: 'teste@teste.com',
        password: '123456'
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          addResult('✅ Sistema de autenticação funcionando (credenciais inválidas como esperado)')
        } else {
          addResult(`❌ Erro na autenticação: ${error.message}`)
        }
      } else {
        addResult('❌ Login deveria ter falhado com credenciais de teste')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      addResult(`❌ Erro no teste de auth: ${errorMessage}`)
    }
  }, [addResult])

  const runAllTests = useCallback(async () => {
    setTestResults([])
    await testConnection()
    await testTables()
    await testAuth()
    addResult('=== TESTES CONCLUÍDOS ===')
  }, [testConnection, testTables, testAuth, addResult])

  useEffect(() => {
    runAllTests()
  }, [runAllTests])

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">🔧 Teste do Supabase - Fluxo Lucrativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Status da Conexão:</h3>
              <p className="text-lg">{connectionStatus}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Status das Tabelas:</h3>
              {tablesStatus.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {tablesStatus.map((table) => (
                    <div key={table.table} className="bg-slate-800 p-3 rounded">
                      <div className="text-white font-medium">{table.table}</div>
                      <div className="text-sm">
                        {table.status} {table.count !== undefined ? `(${table.count})` : ''}
                      </div>
                      {table.error && (
                        <div className="text-xs text-red-400 mt-1">{table.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">Executando testes...</p>
              )}
            </div>

            <Button onClick={runAllTests} className="w-full">
              🔄 Executar Testes Novamente
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">📋 Log de Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-800 p-4 rounded max-h-96 overflow-y-auto">
              {testResults.length > 0 ? (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm text-slate-300 font-mono mb-1">
                    {result}
                  </div>
                ))
              ) : (
                <p className="text-slate-400">Nenhum teste executado ainda...</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">🚨 Problemas Comuns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <div>
              <h4 className="text-yellow-400 font-semibold">❌ Se as tabelas não existem:</h4>
              <p>Execute o arquivo <code className="bg-slate-800 px-2 py-1 rounded">supabase-schema.sql</code> no SQL Editor do Supabase</p>
            </div>
            
            <div>
              <h4 className="text-yellow-400 font-semibold">❌ Se o RLS está bloqueando:</h4>
              <p>Execute o arquivo <code className="bg-slate-800 px-2 py-1 rounded">supabase-disable-rls-temp.sql</code> no SQL Editor</p>
            </div>
            
            <div>
              <h4 className="text-yellow-400 font-semibold">❌ Se a conexão falha:</h4>
              <p>Verifique se as variáveis de ambiente no <code className="bg-slate-800 px-2 py-1 rounded">.env.local</code> estão corretas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}