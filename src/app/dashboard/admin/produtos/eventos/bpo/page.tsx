'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BPOMotorEnhanced } from '@/components/bpo/BPOMotorEnhanced'

export default function EventosBPOPage() {
  return (
    <DashboardLayout title="BPO Eventos">
      <BPOMotorEnhanced 
        motorType="evento"
        motorName="Eventos"
        motorColor="#dc2626"
      />
    </DashboardLayout>
  )
}