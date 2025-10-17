'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NovoImovelForm } from '@/components/real-estate/NovoImovelForm'

export default function NovoImovelPage() {
  return (
    <DashboardLayout title="Novo Imóvel">
      <NovoImovelForm />
    </DashboardLayout>
  )
}