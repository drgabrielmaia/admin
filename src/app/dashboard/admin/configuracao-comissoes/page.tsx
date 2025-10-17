'use client'

import { useRoleProtection } from '@/hooks/useRoleProtection'
import { ConfiguracaoComissoes } from '@/components/admin/ConfiguracaoComissoes'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function ConfiguracaoComissoesPage() {
  const { loading, hasAccess } = useRoleProtection(['admin'])
  
  if (loading) {
    return (
      <DashboardLayout title="Configuração de Comissões">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!hasAccess) {
    return null // useRoleProtection já redireciona
  }

  return (
    <DashboardLayout title="Configuração de Comissões">
      <ConfiguracaoComissoes />
    </DashboardLayout>
  )
}