'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GastosImovel } from '@/components/real-estate/GastosImovel'

interface GastosPageProps {
  params: {
    id: string
  }
}

export default function GastosPage({ params }: GastosPageProps) {
  return (
    <DashboardLayout title="Gastos do Imóvel">
      <GastosImovel imovelId={params.id} />
    </DashboardLayout>
  )
}