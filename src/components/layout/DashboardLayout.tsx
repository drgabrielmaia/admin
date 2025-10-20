'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  LogOut, 
  User, 
  Settings,
  TrendingUp,
  Users,
  Phone,
  ShieldCheck,
  Target,
  Calendar,
  DollarSign,
  BookOpen,
  Monitor,
  Package,
  Cloud,
  Handshake,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Stethoscope
} from 'lucide-react'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const [showProdutos, setShowProdutos] = useState(false)

  const handleLogout = async () => {
    try {
      console.log('🚪 Fazendo logout...')
      await logout()
      
      // Limpar cache local
      localStorage.removeItem('fluxo_user')
      
      // Forçar redirecionamento
      window.location.href = '/auth'
    } catch (error) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, limpar cache e redirecionar
      localStorage.removeItem('fluxo_user')
      window.location.href = '/auth'
    }
  }

  const getMenuItems = () => {
    const commonItems = [
      { href: `/dashboard/${user?.funcao}`, icon: TrendingUp, label: 'Dashboard' }
    ]

    switch (user?.funcao) {
      case 'admin':
        return [
          ...commonItems,
          { href: '/dashboard/admin/usuarios', icon: Users, label: 'Usuários' },
          { href: '/dashboard/admin/produtos', icon: DollarSign, label: 'Produtos' },
          { href: '/dashboard/admin/metas', icon: Target, label: 'Metas Empresariais' },
          { href: '/dashboard/admin/comissoes', icon: DollarSign, label: 'Comissões' },
          { href: '/dashboard/admin/indicacoes', icon: Users, label: 'Indicações' },
          { href: '/dashboard/admin/configuracao-comissoes', icon: Settings, label: 'Config. Comissões' },
          { href: '/dashboard/admin/vendas-aprovacao', icon: ShieldCheck, label: 'Aprovar Vendas' },
          { href: '/dashboard/admin/bpo-financeiro', icon: BarChart3, label: 'BPO Financeiro' },
          { href: '/dashboard/admin/configuracoes', icon: Settings, label: 'Configurações' }
        ]
      case 'sdr':
        return [
          ...commonItems,
          { href: '/dashboard/sdr/leads', icon: Users, label: 'Leads' },
          { href: '/dashboard/sdr/pipeline', icon: TrendingUp, label: 'Pipeline' },
          { href: '/dashboard/sdr/comissoes', icon: DollarSign, label: 'Comissões' },
          { href: '/dashboard/sdr/bpo', icon: BarChart3, label: 'BPO SDR' }
        ]
      case 'closer':
        return [
          ...commonItems,
          { href: '/dashboard/closer/chamadas', icon: Phone, label: 'Chamadas' },
          { href: '/dashboard/closer/performance', icon: TrendingUp, label: 'Performance' },
          { href: '/dashboard/closer/comissoes', icon: DollarSign, label: 'Comissões' },
          { href: '/dashboard/closer/bpo', icon: BarChart3, label: 'BPO Closer' }
        ]
      case 'mentorado':
        return [
          ...commonItems,
          { href: '/dashboard/mentorado/indicacoes', icon: Users, label: 'Minhas Indicações' },
          { href: '/dashboard/mentorado/comissoes', icon: DollarSign, label: 'Comissões' }
        ]
      default:
        return commonItems
    }
  }

  const menuItems = getMenuItems()

  const getRoleIcon = () => {
    switch (user?.funcao) {
      case 'admin':
        return <ShieldCheck className="h-4 w-4" />
      case 'sdr':
        return <Users className="h-4 w-4" />
      case 'closer':
        return <Phone className="h-4 w-4" />
      case 'mentorado':
        return <BookOpen className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleLabel = () => {
    switch (user?.funcao) {
      case 'admin':
        return 'Administrador'
      case 'sdr':
        return 'SDR'
      case 'closer':
        return 'Closer'
      case 'mentorado':
        return 'Mentorado'
      default:
        return user?.funcao
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0E0E10] flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#1A1C20] border-r border-[#2E3138] flex flex-col shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-[#2E3138]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F1F5F9]">Fluxo Lucrativo</h1>
              <p className="text-xs text-[#94A3B8]">Sistema High-Ticket</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              // Menu especial para produtos (apenas admin)
              if (item.label === 'Produtos' && user?.funcao === 'admin') {
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => setShowProdutos(!showProdutos)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#2E3138] transition-all duration-200 hover:scale-[1.01]"
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5 text-blue-400 transition-colors duration-200" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {showProdutos ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {/* Submenu de produtos */}
                    {showProdutos && (
                      <ul className="mt-2 ml-6 space-y-1">
                        <li>
                          <Link
                            href="/dashboard/admin/produtos/mentoria"
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[#94A3B8] hover:bg-[#2E3138] hover:text-[#F1F5F9] transition-colors text-sm hover:scale-[1.01]"
                          >
                            <BookOpen className="h-4 w-4 text-green-400" />
                            <span>Mentoria</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/dashboard/admin/produtos/infoprodutos"
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[#94A3B8] hover:bg-[#2E3138] hover:text-[#F1F5F9] transition-colors text-sm hover:scale-[1.01]"
                          >
                            <Monitor className="h-4 w-4 text-blue-400" />
                            <span>Infoprodutos</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/dashboard/admin/produtos/fisicos"
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[#94A3B8] hover:bg-[#2E3138] hover:text-[#F1F5F9] transition-colors text-sm hover:scale-[1.01]"
                          >
                            <Package className="h-4 w-4 text-orange-400" />
                            <span>Produtos Físicos</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/dashboard/admin/produtos/saas"
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[#94A3B8] hover:bg-[#2E3138] hover:text-[#F1F5F9] transition-colors text-sm hover:scale-[1.01]"
                          >
                            <Cloud className="h-4 w-4 text-purple-400" />
                            <span>SaaS</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/dashboard/admin/produtos/eventos"
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[#94A3B8] hover:bg-[#2E3138] hover:text-[#F1F5F9] transition-colors text-sm hover:scale-[1.01]"
                          >
                            <Calendar className="h-4 w-4 text-yellow-400" />
                            <span>Eventos</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/dashboard/admin/produtos/parcerias"
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[#94A3B8] hover:bg-[#2E3138] hover:text-[#F1F5F9] transition-colors text-sm hover:scale-[1.01]"
                          >
                            <Handshake className="h-4 w-4 text-cyan-400" />
                            <span>Parcerias</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/dashboard/admin/produtos/clinica"
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[#94A3B8] hover:bg-[#2E3138] hover:text-[#F1F5F9] transition-colors text-sm hover:scale-[1.01]"
                          >
                            <Stethoscope className="h-4 w-4 text-rose-400" />
                            <span>Clínica</span>
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                )
              }
              
              // Menu normal para outros itens
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-[#94A3B8] hover:bg-[#2E3138] hover:text-[#F1F5F9] transition-all duration-200 hover:scale-[1.01]"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-[#2E3138]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold">
                      {user.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#F1F5F9]">{user.nome}</p>
                    <div className="flex items-center space-x-1">
                      {getRoleIcon()}
                      <p className="text-xs text-[#94A3B8]">{getRoleLabel()}</p>
                    </div>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#1A1C20] border-b border-[#2E3138] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#F1F5F9]">{title || 'Dashboard'}</h1>
              <p className="text-[#94A3B8] mt-1">
                Bem-vindo, {user.nome}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-[#F1F5F9]">{user.email}</p>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  {getRoleIcon()}
                  <p className="text-xs text-[#94A3B8]">{getRoleLabel()}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto bg-[#0E0E10]">
          {children}
        </main>
      </div>
    </div>
  )
}