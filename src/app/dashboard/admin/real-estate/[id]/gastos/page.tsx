'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GastosImovel } from '@/components/real-estate/GastosImovel'

interface GastosPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function GastosPage({ params }: GastosPageProps) {
  const { id } = await params
  return (
    <DashboardLayout title="Gastos do Imóvel">
      <GastosImovel imovelId={id} />
    </DashboardLayout>
  )
}