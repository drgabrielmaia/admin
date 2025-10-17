'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CommissionManager } from '@/components/comissoes/CommissionManager'

export default function ComissoesPersonalizadasPage() {
  return (
    <DashboardLayout title="Comissões Personalizadas">
      <CommissionManager />
    </DashboardLayout>
  )
}