import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('Authorization')
    const userUuid = request.headers.get('X-User-UUID')

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authToken
    }

    if (userUuid) {
      headers['X-User-UUID'] = userUuid
    }

    const response = await fetch(`${BACKEND_URL}/api/user/me`, {
      method: 'GET',
      headers,
      credentials: 'include'
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error in /api/users/me:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
