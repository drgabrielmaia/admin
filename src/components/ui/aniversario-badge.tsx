'use client'

import { Badge } from '@/components/ui/badge'
import { Cake } from 'lucide-react'
import { useAniversarios } from '@/hooks/useAniversarios'
import { useEffect, useState } from 'react'

interface AniversarioBadgeProps {
  userId?: string
  userName?: string
  className?: string
  variant?: 'default' | 'small' | 'icon-only'
}

export function AniversarioBadge({ 
  userId, 
  userName, 
  className = '', 
  variant = 'default' 
}: AniversarioBadgeProps) {
  const [isAniversariante, setIsAniversariante] = useState(false)
  const { verificarAniversarioUsuario, aniversariantesHoje } = useAniversarios()

  useEffect(() => {
    if (userId) {
      verificarAniversario()
    } else if (userName) {
      // Verificar por nome se não tiver userId
      const aniversariante = aniversariantesHoje.find(a => 
        a.nome.toLowerCase().includes(userName.toLowerCase())
      )
      setIsAniversariante(!!aniversariante)
    }
  }, [userId, userName, aniversariantesHoje])

  const verificarAniversario = async () => {
    if (!userId) return
    const isAniv = await verificarAniversarioUsuario(userId)
    setIsAniversariante(isAniv)
  }

  if (!isAniversariante) {
    return null
  }

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <Cake className="h-4 w-4 text-yellow-400 animate-pulse" />
      </div>
    )
  }

  if (variant === 'small') {
    return (
      <Badge 
        variant="outline" 
        className={`bg-yellow-900/20 text-yellow-300 border-yellow-600 ${className}`}
      >
        <Cake className="h-3 w-3 mr-1" />
        🎂
      </Badge>
    )
  }

  return (
    <Badge 
      variant="outline" 
      className={`bg-gradient-to-r from-yellow-900/30 to-orange-900/30 text-yellow-200 border-yellow-600 animate-pulse ${className}`}
    >
      <Cake className="h-4 w-4 mr-2" />
      🎂 Aniversário Hoje!
    </Badge>
  )
}

// Componente para mostrar confetes ou celebração
export function CelebracaoAniversario({ className = '' }: { className?: string }) {
  const { temAniversarianteHoje, aniversariantesHoje } = useAniversarios()

  if (!temAniversarianteHoje) {
    return null
  }

  return (
    <div className={`text-center p-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-600 rounded-lg ${className}`}>
      <div className="flex items-center justify-center space-x-2 mb-2">
        <span className="text-2xl">🎉</span>
        <Cake className="h-6 w-6 text-yellow-400 animate-bounce" />
        <span className="text-2xl">🎉</span>
      </div>
      <p className="text-yellow-200 font-medium">
        {aniversariantesHoje.length === 1 
          ? `Hoje é aniversário de ${aniversariantesHoje[0].nome}!`
          : `Hoje temos ${aniversariantesHoje.length} aniversariantes!`
        }
      </p>
      <p className="text-yellow-300 text-sm mt-1">
        {aniversariantesHoje.map(a => a.nome).join(', ')}
      </p>
    </div>
  )
}