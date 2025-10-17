'use client'

import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface ModernKPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  type?: 'default' | 'currency' | 'percent'
  className?: string
}

export function ModernKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  type = 'default',
  className
}: ModernKPICardProps) {
  const formatValue = (val: string | number) => {
    if (type === 'currency') {
      return typeof val === 'number' 
        ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : val
    }
    if (type === 'percent') {
      return typeof val === 'number' ? `${val.toFixed(1)}%` : `${val}%`
    }
    return typeof val === 'number' ? val.toLocaleString('pt-BR') : val
  }

  return (
    <Card className={clsx(
      "group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:bg-card/60",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              {title}
            </p>
            <div className="space-y-1">
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {formatValue(value)}
              </p>
              {trend && (
                <div className="flex items-center space-x-1">
                  <span className={clsx(
                    "text-xs font-medium",
                    trend.isPositive ? "text-emerald-400" : "text-red-400"
                  )}>
                    {trend.isPositive ? "+" : ""}{trend.value.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs mês anterior
                  </span>
                </div>
              )}
              {subtitle && !trend && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className={clsx(
            "rounded-xl p-3 transition-all duration-300 group-hover:scale-110",
            "bg-primary/10 text-primary"
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </CardContent>
    </Card>
  )
}