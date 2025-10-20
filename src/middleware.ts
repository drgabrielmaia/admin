import { NextResponse } from 'next/server'

// Middleware desabilitado - só deixa tudo passar
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: []
}