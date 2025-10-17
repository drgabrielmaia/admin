'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BPOMotorEnhanced } from '@/components/bpo/BPOMotorEnhanced'

export default function ParceriasBPOPage() {
  return (
    <DashboardLayout title="BPO Parcerias">
      <BPOMotorEnhanced 
        motorType="parceria"
        motorName="Parcerias"
        motorColor="#f59e0b"
      />
    </DashboardLayout>
  )
}