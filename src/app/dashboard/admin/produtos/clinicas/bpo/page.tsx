'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BPOMotorEnhanced } from '@/components/bpo/BPOMotorEnhanced'

export default function ClinicasBPOPage() {
  return (
    <DashboardLayout title="BPO Clínicas">
      <BPOMotorEnhanced 
        motorType="clinica"
        motorName="Clínicas"
        motorColor="#ef4444"
      />
    </DashboardLayout>
  )
}