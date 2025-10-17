import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ComissoesDashboard } from '@/components/comissoes/ComissoesDashboard'

export default function AdminComissoesPage() {
  return (
    <DashboardLayout title="Gerenciar Comissões">
      <ComissoesDashboard />
    </DashboardLayout>
  )
}