'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Shield,
  Phone,
  Crown,
  Search,
  Filter
} from 'lucide-react'

interface Usuario {
  id: string
  email: string
  nome: string
  funcao: 'admin' | 'sdr' | 'closer'
  data_nascimento?: string
  data_cadastro: string
  primeiro_login?: string
  ativo: boolean
}

export default function UsuariosPage() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    funcao: 'sdr' as 'admin' | 'sdr' | 'closer',
    senha: '',
    data_nascimento: ''
  })

  useEffect(() => {
    if (user?.funcao === 'admin') {
      loadUsuarios()
    }
  }, [user])

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('data_cadastro', { ascending: false })

      if (error) throw error
      
      setUsuarios(data?.map(u => ({
        ...u,
        ativo: true // Por padrão, assumir que todos estão ativos
      })) || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.email || !formData.funcao) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      if (editingUser) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('users')
          .update({
            nome: formData.nome,
            email: formData.email,
            funcao: formData.funcao,
            data_nascimento: formData.data_nascimento || null
          })
          .eq('id', editingUser.id)

        if (error) throw error
        alert('Usuário atualizado com sucesso!')
      } else {
        // Criar novo usuário no Auth do Supabase usando supabaseAdmin
        const { supabaseAdmin } = await import('@/lib/supabase')
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.senha,
          email_confirm: true,
          user_metadata: {
            nome: formData.nome,
            funcao: formData.funcao
          }
        })

        if (authError) throw authError

        // Criar perfil na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            nome: formData.nome,
            funcao: formData.funcao,
            data_nascimento: formData.data_nascimento || null,
            data_cadastro: new Date().toISOString()
          })

        if (profileError) throw profileError
        alert('Usuário criado com sucesso!')
      }

      // Resetar formulário
      setFormData({ nome: '', email: '', funcao: 'sdr', senha: '', data_nascimento: '' })
      setEditingUser(null)
      setShowForm(false)
      await loadUsuarios()

    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      alert('Erro ao salvar usuário: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario)
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      funcao: usuario.funcao,
      senha: '',
      data_nascimento: usuario.data_nascimento || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      // Primeiro remover da tabela users
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (profileError) throw profileError

      // Depois remover do Auth (Admin API)
      const { error: authError } = await supabase.auth.admin.deleteUser(id)
      
      if (authError) {
        console.warn('Erro ao deletar usuário do Auth:', authError)
      }

      alert('Usuário excluído com sucesso!')
      await loadUsuarios()

    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert('Erro ao excluir usuário: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const getRoleIcon = (funcao: string) => {
    switch (funcao) {
      case 'admin': return <Shield className="h-4 w-4" />
      case 'sdr': return <Users className="h-4 w-4" />
      case 'closer': return <Phone className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getRoleColor = (funcao: string) => {
    switch (funcao) {
      case 'admin': return 'bg-purple-900 text-purple-300'
      case 'sdr': return 'bg-blue-900 text-blue-300'
      case 'closer': return 'bg-green-900 text-green-300'
      default: return 'bg-slate-700 text-slate-300'
    }
  }

  const getRoleLabel = (funcao: string) => {
    switch (funcao) {
      case 'admin': return 'Administrador'
      case 'sdr': return 'SDR'
      case 'closer': return 'Closer'
      default: return funcao
    }
  }

  // Filtrar usuários
  const filteredUsers = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || usuario.funcao === filterRole
    return matchesSearch && matchesRole
  })

  if (user?.funcao !== 'admin') {
    return (
      <DashboardLayout title="Usuários">
        <div className="text-center text-slate-400">
          Acesso restrito para administradores
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout title="Usuários">
        <div className="text-center text-slate-400">Carregando usuários...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Usuários">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
            <p className="text-slate-400">Gerencie os usuários do sistema</p>
          </div>
          <Button 
            onClick={() => {
              setShowForm(!showForm)
              setEditingUser(null)
              setFormData({ nome: '', email: '', funcao: 'sdr', senha: '', data_nascimento: '' })
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="sdr">SDR</SelectItem>
              <SelectItem value="closer">Closer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Formulário */}
        {showForm && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Digite o nome completo"
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Digite o e-mail"
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funcao">Função *</Label>
                  <Select value={formData.funcao} onValueChange={(value: "admin" | "sdr" | "closer") => setFormData({...formData, funcao: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="sdr">SDR</SelectItem>
                      <SelectItem value="closer">Closer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="Selecione a data de nascimento"
                  />
                </div>

                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({...formData, senha: e.target.value})}
                      placeholder="Digite a senha"
                      className="bg-slate-800 border-slate-700"
                      required={!editingUser}
                      minLength={6}
                    />
                  </div>
                )}

                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingUser ? 'Atualizar' : 'Criar Usuário'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false)
                      setEditingUser(null)
                      setFormData({ nome: '', email: '', funcao: 'sdr', senha: '', data_nascimento: '' })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Usuários */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Usuários Cadastrados</span>
              </span>
              <Badge variant="secondary">{filteredUsers.length} usuários</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((usuario) => (
                  <div key={usuario.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {usuario.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-white">{usuario.nome}</h3>
                          <Badge className={getRoleColor(usuario.funcao)}>
                            <span className="flex items-center space-x-1">
                              {getRoleIcon(usuario.funcao)}
                              <span>{getRoleLabel(usuario.funcao)}</span>
                            </span>
                          </Badge>
                          {usuario.funcao === 'admin' && (
                            <Crown className="h-4 w-4 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">{usuario.email}</p>
                        <p className="text-slate-500 text-xs">
                          Cadastrado em {new Date(usuario.data_cadastro).toLocaleDateString('pt-BR')}
                          {usuario.primeiro_login && (
                            <span> • Primeiro login: {new Date(usuario.primeiro_login).toLocaleDateString('pt-BR')}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(usuario)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(usuario.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
                <p className="text-sm">
                  {searchTerm || filterRole !== 'all' 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Clique em "Novo Usuário" para começar'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Administradores', count: usuarios.filter(u => u.funcao === 'admin').length, color: 'text-purple-400', icon: Shield },
            { label: 'SDRs', count: usuarios.filter(u => u.funcao === 'sdr').length, color: 'text-blue-400', icon: Users },
            { label: 'Closers', count: usuarios.filter(u => u.funcao === 'closer').length, color: 'text-green-400', icon: Phone }
          ].map((stat, index) => (
            <Card key={index} className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.count}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}