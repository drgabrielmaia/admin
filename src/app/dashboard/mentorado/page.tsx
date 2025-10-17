'use client'

import { useRoleProtection } from '@/hooks/useRoleProtection'
import { MentoradoDashboard } from '@/components/mentorado/MentoradoDashboard'

export default function MentoradoDashboardPage() {
  const { loading, hasAccess } = useRoleProtection({ allowedRoles: ['mentorado'] })
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!hasAccess) {
    return null // useRoleProtection já redireciona
  }

  return <MentoradoDashboard />
}