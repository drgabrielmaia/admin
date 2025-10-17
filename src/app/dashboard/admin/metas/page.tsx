import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MetasManager } from '@/components/metas/MetasManager'

export default function AdminMetasPage() {
  return (
    <DashboardLayout title="Metas Empresariais">
      <MetasManager />
    </DashboardLayout>
  )
}