'use client'

import { Cake, PartyPopper, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBirthdayInfo } from '@/lib/birthday-utils'

interface BirthdayIconProps {
  birthDate: string | Date | null
  userName?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}

export function BirthdayIcon({ 
  birthDate, 
  userName = 'usuário',
  size = 'md',
  className,
  showTooltip = true 
}: BirthdayIconProps) {
  const birthdayInfo = getBirthdayInfo(birthDate)

  if (!birthdayInfo.isBirthdayToday && !birthdayInfo.isBirthdayThisWeek) {
    return null
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const getIcon = () => {
    if (birthdayInfo.isBirthdayToday) {
      return <Cake className={cn(sizeClasses[size], 'text-pink-400')} />
    }
    if (birthdayInfo.isBirthdayThisWeek) {
      return <PartyPopper className={cn(sizeClasses[size], 'text-yellow-400')} />
    }
    return <Gift className={cn(sizeClasses[size], 'text-blue-400')} />
  }

  const getMessage = () => {
    if (birthdayInfo.isBirthdayToday) {
      return `🎉 Hoje é aniversário de ${userName}! ${birthdayInfo.age ? `${birthdayInfo.age} anos` : ''}`
    }
    if (birthdayInfo.isBirthdayThisWeek) {
      return `🎂 Aniversário de ${userName} esta semana! Em ${birthdayInfo.daysUntilBirthday} dias`
    }
    return ''
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      {showTooltip ? (
        <div className="group relative">
          <div className="animate-bounce">
            {getIcon()}
          </div>
          
          {/* Tooltip */}
          <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10 border border-slate-700">
            {getMessage()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      ) : (
        <div className="animate-bounce">
          {getIcon()}
        </div>
      )}
    </div>
  )
}

// Componente para badge de aniversário mais elaborado
export function BirthdayBadge({
  birthDate,
  className
}: Omit<BirthdayIconProps, 'size'>) {
  const birthdayInfo = getBirthdayInfo(birthDate)

  if (!birthdayInfo.isBirthdayToday && !birthdayInfo.isBirthdayThisWeek) {
    return null
  }

  return (
    <div className={cn(
      'inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium animate-pulse',
      birthdayInfo.isBirthdayToday 
        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      className
    )}>
      {birthdayInfo.isBirthdayToday ? (
        <>
          <Cake className="h-3 w-3" />
          <span>Aniversário!</span>
        </>
      ) : (
        <>
          <PartyPopper className="h-3 w-3" />
          <span>Esta semana</span>
        </>
      )}
    </div>
  )
}

// Hook para usar informações de aniversário
export function useBirthdayInfo(birthDate: string | Date | null) {
  return getBirthdayInfo(birthDate)
}