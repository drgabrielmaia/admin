'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EditarImovel } from '@/components/real-estate/EditarImovel'

interface EditarImovelPageProps {
  params: {
    id: string
  }
}

export default function EditarImovelPage({ params }: EditarImovelPageProps) {
  return (
    <DashboardLayout title="Editar Imóvel">
      <EditarImovel imovelId={params.id} />
    </DashboardLayout>
  )
}