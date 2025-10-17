import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProdutosManager } from '@/components/admin/ProdutosManager'

export default function AdminProdutosPage() {
  return (
    <DashboardLayout title="Gestão de Produtos">
      <ProdutosManager />
    </DashboardLayout>
  )
}