'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { VendasAprovacao } from '@/components/admin/VendasAprovacao'

export default function VendasAprovacaoPage() {
  return (
    <DashboardLayout title="Aprovação de Vendas">
      <VendasAprovacao />
    </DashboardLayout>
  )
}