import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function getPerformanceFlag(conversaoPercent: number, diasCadastro: number): {
  color: string
  text: string
  bgColor: string
} {
  if (diasCadastro <= 30) {
    return {
      color: 'text-gray-600',
      text: 'Novo',
      bgColor: 'bg-white'
    }
  }
  
  if (conversaoPercent >= 15) {
    return {
      color: 'text-green-600',
      text: 'Alta Performance',
      bgColor: 'bg-green-100'
    }
  }
  
  if (conversaoPercent >= 10) {
    return {
      color: 'text-yellow-600',
      text: 'Performance Média',
      bgColor: 'bg-yellow-100'
    }
  }
  
  return {
    color: 'text-red-600',
    text: 'Baixa Performance',
    bgColor: 'bg-red-100'
  }
}

export function getDaysSince(date: string): number {
  const now = new Date()
  const compareDate = new Date(date)
  const diffTime = Math.abs(now.getTime() - compareDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}