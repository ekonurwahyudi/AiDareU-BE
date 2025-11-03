import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Only proxy requests that start with /api/proxy/ to the Laravel backend
  if (pathname.startsWith('/api/proxy/')) {
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
    const apiPath = pathname.replace('/api/proxy', '')
    const targetUrl = `${backendBase}${apiPath}`

    const url = new URL(targetUrl)
    // Preserve query params
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*'
  ]
}