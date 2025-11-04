import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('Authorization') || request.cookies.get('auth_token')?.value

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }

    if (authToken) {
      headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`
    }

    const response = await fetch(`${BACKEND_URL}/api/rbac/roles`, {
      method: 'GET',
      headers,
      credentials: 'include'
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error in /api/rbac/roles:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', data: [] },
      { status: 500 }
    )
  }
}
