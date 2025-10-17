'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BPOMotorEnhanced } from '@/components/bpo/BPOMotorEnhanced'

export default function BPOClinicaPage() {
  return (
    <DashboardLayout title="BPO Clínica">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 bg-rose-600 rounded"></div>
          <h1 className="text-2xl font-bold text-white">BPO - Clínica</h1>
        </div>
        
        <BPOMotorEnhanced 
          motorType="clinica"
          motorName="Clínica"
          motorColor="#f43f5e"
        />
      </div>
    </DashboardLayout>
  )
}