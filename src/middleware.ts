import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware desabilitado - só deixa tudo passar
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: []
}