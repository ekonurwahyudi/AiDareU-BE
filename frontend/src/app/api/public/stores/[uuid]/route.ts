import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await params
    const body = await request.json()
    const {
      nama_toko,
      subdomain,
      no_hp_toko,
      kategori_toko,
      deskripsi_toko,
      provinsi,
      kota,
      kecamatan
    } = body

    console.log('Frontend API - Update store:', {
      uuid: uuid,
      body: body
    })

    // Call Laravel backend API directly
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/public/stores/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        nama_toko,
        subdomain,
        no_hp_toko,
        kategori_toko,
        deskripsi_toko,
        provinsi,
        kota,
        kecamatan
      })
    })

    const data = await response.json()

    console.log('Backend response:', {
      status: response.status,
      data: data
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Gagal mengupdate toko' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      message: data.message || 'Toko berhasil diupdate!',
      data: data.data || data.store
    })

  } catch (error) {
    console.error('Store update API error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await params
    // Call Laravel backend API directly
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/public/stores/${uuid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store'
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Gagal mengambil data toko' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Get store API error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}