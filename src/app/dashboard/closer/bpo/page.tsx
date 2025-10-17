'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BPOMotorEnhanced } from '@/components/bpo/BPOMotorEnhanced'

export default function CloserBPOPage() {
  return (
    <DashboardLayout title="BPO Closer - Sistema Completo">
      <BPOMotorEnhanced
        motorType="closer"
        motorName="Closer"
        motorColor="#f59e0b"
      />
    </DashboardLayout>
  )
}