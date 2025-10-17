'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BPOMotorEnhanced } from '@/components/bpo/BPOMotorEnhanced'

export default function InfoprodutosBPOPage() {
  return (
    <DashboardLayout title="BPO Infoprodutos - Sistema Completo">
      <BPOMotorEnhanced 
        motorType="infoproduto"
        motorName="Infoprodutos"
        motorColor="#3b82f6"
      />
    </DashboardLayout>
  )
}