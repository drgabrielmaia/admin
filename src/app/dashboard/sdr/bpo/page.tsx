'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BPOMotorEnhanced } from '@/components/bpo/BPOMotorEnhanced'

export default function SDRBPOPage() {
  return (
    <DashboardLayout title="BPO SDR - Sistema Completo">
      <BPOMotorEnhanced
        motorType="sdr"
        motorName="SDR"
        motorColor="#10b981"
      />
    </DashboardLayout>
  )
}