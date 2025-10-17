'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EditarImovel } from '@/components/real-estate/EditarImovel'

interface EditarImovelPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditarImovelPage({ params }: EditarImovelPageProps) {
  const { id } = await params
  return (
    <DashboardLayout title="Editar Imóvel">
      <EditarImovel imovelId={id} />
    </DashboardLayout>
  )
}