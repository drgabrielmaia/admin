'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LeadsDisponiveis } from '@/components/closer/LeadsDisponiveis'
import { useRoleProtection } from '@/hooks/useRoleProtection'

export default function LeadsDisponiveisPage() {
  // Proteção de acesso - apenas closers
  const { hasAccess, loading } = useRoleProtection({ 
    allowedRoles: ['closer'] 
  })

  if (loading || !hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout title="Leads Disponíveis">
      <LeadsDisponiveis />
    </DashboardLayout>
  )
}