import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ComissoesDashboard } from '@/components/comissoes/ComissoesDashboard'

export default function CloserComissoesPage() {
  return (
    <DashboardLayout title="Minhas Comissões">
      <ComissoesDashboard />
    </DashboardLayout>
  )
}