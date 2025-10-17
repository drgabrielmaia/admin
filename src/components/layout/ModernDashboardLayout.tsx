'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
  Menu,
  X,
  Bell,
  Search,
  Moon,
  Sun,
  BarChart3,
  Percent,
  Stethoscope,
  Send,
  FileText,
  UserCheck
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { OptimizedLink, NavLink } from '@/components/ui/optimized-link'

interface ModernDashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function ModernDashboardLayout({ children, title }: ModernDashboardLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showProdutos, setShowProdutos] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  // Manter o estado do submenu produtos persistente mesmo durante navegação
  useEffect(() => {
    // Log para debug - pode remover depois
    console.log('ModernDashboardLayout - user:', user?.funcao, 'pathname:', pathname)
  }, [user, pathname])

  const handleLogout = async () => {
    try {
      console.log('🚪 Fazendo logout...')
      await logout()
      localStorage.removeItem('fluxo_user')
      window.location.href = '/auth'
    } catch (error) {
      console.error('Erro no logout:', error)
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
          { href: '/dashboard/admin/metas', icon: Target, label: 'Metas' },
          { href: '/dashboard/admin/metas-pessoais', icon: BarChart3, label: 'Metas Pessoais' },
          { href: '/dashboard/admin/vendas-aprovacao', icon: ShieldCheck, label: 'Aprovação de Vendas' },
          { href: '/dashboard/admin/comissoes', icon: DollarSign, label: 'Comissões' },
          { href: '/dashboard/admin/comissoes-personalizadas', icon: Percent, label: 'Comissões Personalizadas' },
          { href: '/dashboard/admin/indicacoes', icon: Send, label: 'Indicações' },
          { href: '/dashboard/admin/configuracao-comissoes', icon: UserCheck, label: 'Config. Comissões' },
          { href: '/dashboard/admin/relatorio-comissoes', icon: FileText, label: 'Relatório Comissões' },
          { href: '/dashboard/admin/configuracoes', icon: Settings, label: 'Configurações' }
        ]
      case 'sdr':
        return [
          ...commonItems,
          { href: '/dashboard/sdr/leads', icon: Users, label: 'Leads' },
          { href: '/dashboard/sdr/pipeline', icon: TrendingUp, label: 'Pipeline' },
          { href: '/dashboard/sdr/comissoes', icon: DollarSign, label: 'Comissões' }
        ]
      case 'closer':
        return [
          ...commonItems,
          { href: '/dashboard/closer/chamadas', icon: Phone, label: 'Chamadas' },
          { href: '/dashboard/closer/performance', icon: TrendingUp, label: 'Performance' },
          { href: '/dashboard/closer/comissoes', icon: DollarSign, label: 'Comissões' }
        ]
      case 'mentorado':
        return [
          ...commonItems,
          { href: '/dashboard/mentorado', icon: Send, label: 'Minhas Indicações' }
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
        return <Send className="h-4 w-4" />
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

  const getRoleColor = () => {
    switch (user?.funcao) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'sdr':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'closer':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'mentorado':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  if (!user) return null

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.08]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Fluxo Lucrativo</h1>
            <p className="text-xs text-white/60">Sistema High-Ticket</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          // Menu especial para produtos (apenas admin)
          if (item.label === 'Produtos' && user?.funcao === 'admin') {
            return (
              <div key={item.href} className="space-y-1">
                <button
                  onClick={() => setShowProdutos(!showProdutos)}
                  className="group flex items-center justify-between w-full px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] transition-all duration-200 ease-in-out"
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5 text-white/50 group-hover:text-emerald-400 transition-colors duration-200" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {showProdutos ? (
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                  )}
                </button>
                
                {/* Submenu de produtos */}
                <div className={`transition-all duration-300 ease-in-out ${showProdutos ? 'max-h-screen opacity-100 mt-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="ml-4 pl-4 border-l border-white/[0.08] space-y-1">
                    {[
                      { href: '/dashboard/admin/produtos/mentoria', icon: BookOpen, label: 'Mentoria', color: 'text-green-400' },
                      { href: '/dashboard/admin/produtos/infoprodutos', icon: Monitor, label: 'Infoprodutos', color: 'text-blue-400' },
                      { href: '/dashboard/admin/produtos/fisicos', icon: Package, label: 'Produtos Físicos', color: 'text-orange-400' },
                      { href: '/dashboard/admin/real-estate', icon: Package, label: 'Real Estate', color: 'text-emerald-400' },
                      { href: '/dashboard/admin/produtos/saas', icon: Cloud, label: 'SaaS', color: 'text-purple-400' },
                      { href: '/dashboard/admin/produtos/eventos', icon: Calendar, label: 'Eventos', color: 'text-yellow-400' },
                      { href: '/dashboard/admin/produtos/clinicas', icon: Stethoscope, label: 'Clínica', color: 'text-rose-400' },
                      { href: '/dashboard/admin/produtos/parcerias', icon: Handshake, label: 'Parcerias', color: 'text-cyan-400' }
                    ].map((subItem) => (
                      <OptimizedLink
                        key={subItem.href}
                        href={subItem.href}
                        className="group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.05] transition-all duration-200 ease-in-out"
                      >
                        <subItem.icon className={`h-4 w-4 ${subItem.color} group-hover:scale-110 transition-transform duration-200`} />
                        <span className="text-sm font-medium">{subItem.label}</span>
                      </OptimizedLink>
                    ))}
                  </div>
                </div>
              </div>
            )
          }
          
          // Menu normal para outros itens
          return (
            <NavLink
              key={item.href}
              href={item.href}
              isActive={pathname === item.href}
              className="group flex items-center space-x-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] transition-all duration-200 ease-in-out"
            >
              <item.icon className="h-5 w-5 text-white/50 group-hover:text-emerald-400 transition-colors duration-200" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/[0.08]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-0 h-auto hover:bg-white/[0.05] rounded-xl">
              <div className="flex items-center space-x-3 p-3 w-full">
                <Avatar className="h-10 w-10 ring-2 ring-white/[0.15] ring-offset-2 ring-offset-transparent">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-400 text-white font-bold text-sm">
                    {user.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">{user.nome}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={`text-xs px-2 py-0.5 ${getRoleColor()}`}>
                      <span className="flex items-center space-x-1">
                        {getRoleIcon()}
                        <span>{getRoleLabel()}</span>
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900/95 border-white/[0.08] backdrop-blur-xl">
            <DropdownMenuLabel className="text-white">Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/[0.08] cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/[0.08] cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 bg-black/40 backdrop-blur-xl border-r border-white/[0.08] flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-72 bg-black/90 backdrop-blur-xl border-r border-white/[0.08] flex flex-col">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Modern Header */}
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/[0.08] px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-white/70 hover:text-white hover:bg-white/[0.08]"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {title || 'Dashboard'}
                </h1>
                <p className="text-white/60 text-sm mt-1">
                  Bem-vindo de volta, <span className="font-semibold text-white/80">{user.nome}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Button (placeholder) */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/70 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
              >
                <Search className="h-4 w-4" />
              </Button>
              
              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/70 hover:text-white hover:bg-white/[0.08] transition-all duration-200 relative"
              >
                <Bell className="h-4 w-4" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </Button>

              {/* User Info Badge */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                <div className="text-right">
                  <p className="text-xs text-white font-semibold">{user.email}</p>
                  <div className="flex items-center justify-end space-x-1">
                    {getRoleIcon()}
                    <p className="text-xs text-white/60">{getRoleLabel()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content with improved styling */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}