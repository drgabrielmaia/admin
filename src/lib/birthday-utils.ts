/**
 * Utilitários para gerenciar aniversários de usuários
 */

export interface BirthdayInfo {
  isBirthdayToday: boolean
  isBirthdayThisWeek: boolean
  daysUntilBirthday: number
  age?: number
  zodiacSign?: string
}

/**
 * Verifica se hoje é aniversário do usuário
 */
export function isBirthdayToday(birthDate: string | Date | null): boolean {
  if (!birthDate) return false

  const today = new Date()
  const birth = new Date(birthDate)
  
  return (
    today.getMonth() === birth.getMonth() &&
    today.getDate() === birth.getDate()
  )
}

/**
 * Verifica se o aniversário é esta semana
 */
export function isBirthdayThisWeek(birthDate: string | Date | null): boolean {
  if (!birthDate) return false

  const today = new Date()
  const birth = new Date(birthDate)
  
  // Definir o início e fim da semana atual
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  // Criar data de aniversário para este ano
  const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
  
  return thisYearBirthday >= startOfWeek && thisYearBirthday <= endOfWeek
}

/**
 * Calcula quantos dias faltam para o próximo aniversário
 */
export function daysUntilBirthday(birthDate: string | Date | null): number {
  if (!birthDate) return -1

  const today = new Date()
  const birth = new Date(birthDate)
  
  const thisYear = today.getFullYear()
  let nextBirthday = new Date(thisYear, birth.getMonth(), birth.getDate())
  
  // Se o aniversário já passou este ano, calcular para o próximo ano
  if (nextBirthday < today) {
    nextBirthday = new Date(thisYear + 1, birth.getMonth(), birth.getDate())
  }
  
  const timeDiff = nextBirthday.getTime() - today.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

/**
 * Calcula a idade atual
 */
export function calculateAge(birthDate: string | Date | null): number | null {
  if (!birthDate) return null

  const today = new Date()
  const birth = new Date(birthDate)
  
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Retorna o signo zodiacal
 */
export function getZodiacSign(birthDate: string | Date | null): string | null {
  if (!birthDate) return null

  const birth = new Date(birthDate)
  const month = birth.getMonth() + 1
  const day = birth.getDate()

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Áries'
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Touro'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gêmeos'
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Câncer'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leão'
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgem'
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra'
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpião'
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitário'
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricórnio'
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquário'
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Peixes'

  return null
}

/**
 * Retorna todas as informações de aniversário de uma vez
 */
export function getBirthdayInfo(birthDate: string | Date | null): BirthdayInfo {
  return {
    isBirthdayToday: isBirthdayToday(birthDate),
    isBirthdayThisWeek: isBirthdayThisWeek(birthDate),
    daysUntilBirthday: daysUntilBirthday(birthDate),
    age: calculateAge(birthDate),
    zodiacSign: getZodiacSign(birthDate)
  }
}

/**
 * Formata data de nascimento para display
 */
export function formatBirthDate(birthDate: string | Date | null): string {
  if (!birthDate) return ''

  const birth = new Date(birthDate)
  return birth.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  })
}

/**
 * Formata data de nascimento completa
 */
export function formatFullBirthDate(birthDate: string | Date | null): string {
  if (!birthDate) return ''

  const birth = new Date(birthDate)
  return birth.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}