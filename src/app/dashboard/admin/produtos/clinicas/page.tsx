'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ClinicaManager } from '@/components/admin/ClinicaManager'

export default function ClinicasPage() {
  return (
    <DashboardLayout title="Gestão de Clínica">
      <ClinicaManager />
    </DashboardLayout>
  )
}