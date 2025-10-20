'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EditarImovel } from '@/components/real-estate/EditarImovel'

interface EditarImovelPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditarImovelPage({ params }: EditarImovelPageProps) {
  return (
    <DashboardLayout title="Editar Imóvel">
      <EditarImovelWrapper params={params} />
    </DashboardLayout>
  )
}

function EditarImovelWrapper({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = React.useState<string | null>(null)

  React.useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  if (!id) return <div>Carregando...</div>

  return <EditarImovel imovelId={id} />
}