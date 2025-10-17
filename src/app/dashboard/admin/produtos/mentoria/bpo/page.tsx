'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BPOMotorEnhanced } from '@/components/bpo/BPOMotorEnhanced'

export default function MentoriaBPOPage() {
  return (
    <DashboardLayout title="BPO Mentoria - Sistema Completo">
      <BPOMotorEnhanced
        motorType="mentoria"
        motorName="Mentoria"
        motorColor="#10b981"
      />
    </DashboardLayout>
  )
}