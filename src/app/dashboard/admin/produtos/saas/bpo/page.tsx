'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BPOMotorEnhanced } from '@/components/bpo/BPOMotorEnhanced'

export default function SaaSBPOPage() {
  return (
    <DashboardLayout title="BPO SaaS">
      <BPOMotorEnhanced 
        motorType="saas"
        motorName="SaaS"
        motorColor="#8b5cf6"
      />
    </DashboardLayout>
  )
}