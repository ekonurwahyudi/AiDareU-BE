import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  
  console.log('Test login called with:', { email })
  
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:8000/api'
    const url = `${apiUrl}/auth/login`
    console.log('Making request to:', url)
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    console.log('Response status:', res.status)
    const data = await res.json()
    console.log('Response data:', data)

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      data: data
    })
  } catch (error) {
    console.error('Test login error:', error)
    return NextResponse.json({ error: 'Failed to test login' }, { status: 500 })
  }
}