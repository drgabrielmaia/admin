'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BPOMotorEnhanced } from '@/components/bpo/BPOMotorEnhanced'

export default function FisicosBPOPage() {
  return (
    <DashboardLayout title="BPO Produtos Físicos">
      <BPOMotorEnhanced
        motorType="fisico"
        motorName="Produtos Físicos"
        motorColor="#059669"
      />
    </DashboardLayout>
  )
}