import { getPerformanceFlag, getDaysSince } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface PerformanceFlagProps {
  conversaoPercent: number
  dataCadastro: string
  className?: string
}

export function PerformanceFlag({ 
  conversaoPercent, 
  dataCadastro, 
  className 
}: PerformanceFlagProps) {
  const diasCadastro = getDaysSince(dataCadastro)
  const flag = getPerformanceFlag(conversaoPercent, diasCadastro)

  return (
    <Badge 
      variant="outline"
      className={`${flag.bgColor} ${flag.color} border-current ${className}`}
    >
      {flag.text}
    </Badge>
  )
}