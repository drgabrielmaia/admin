import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: number
  type?: 'currency' | 'percent' | 'number'
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
}

export function KPICard({ 
  title, 
  value, 
  type = 'number', 
  icon: Icon, 
  trend, 
  subtitle 
}: KPICardProps) {
  const formatValue = (val: number) => {
    switch (type) {
      case 'currency':
        return formatCurrency(val)
      case 'percent':
        return formatPercent(val)
      default:
        return val.toLocaleString()
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">
          {formatValue(value)}
        </div>
        {trend && (
          <p className={`text-xs mt-1 ${
            trend.isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}% em relação ao período anterior
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}