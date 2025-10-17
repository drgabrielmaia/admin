'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PersonalGoalsDashboard } from '@/components/metas/PersonalGoalsDashboard'

export default function MetasPessoaisPage() {
  return (
    <DashboardLayout title="Metas Pessoais">
      <PersonalGoalsDashboard />
    </DashboardLayout>
  )
}