'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GastosImovel } from '@/components/real-estate/GastosImovel'

interface GastosPageProps {
  params: Promise<{
    id: string
  }>
}

export default function GastosPage({ params }: GastosPageProps) {
  return (
    <DashboardLayout title="Gastos do Imóvel">
      <GastosImovelWrapper params={params} />
    </DashboardLayout>
  )
}

function GastosImovelWrapper({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = React.useState<string | null>(null)

  React.useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  if (!id) return <div>Carregando...</div>

  return <GastosImovel imovelId={id} />
}