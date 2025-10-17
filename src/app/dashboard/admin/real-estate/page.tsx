'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ImoveisLista } from '@/components/real-estate/ImoveisLista'

export default function RealEstatePage() {
  return (
    <DashboardLayout title="Real Estate">
      <ImoveisLista />
    </DashboardLayout>
  )
}