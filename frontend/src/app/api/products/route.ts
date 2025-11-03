import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeUuid = searchParams.get('store_uuid')
    const categoryId = searchParams.get('category_id')
    const status = searchParams.get('status')
    const jenisproduk = searchParams.get('jenis_produk')
    const search = searchParams.get('search')
    const perPage = searchParams.get('per_page') || '10'

    // Build query parameters
    const queryParams = new URLSearchParams()
    if (storeUuid) queryParams.append('store_uuid', storeUuid)
    if (categoryId) queryParams.append('category_id', categoryId)
    if (status) queryParams.append('status', status)
    if (jenisproduk) queryParams.append('jenis_produk', jenisproduk)
    if (search) queryParams.append('search', search)
    queryParams.append('per_page', perPage)

    // Make request to Laravel backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/public/products?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Transform Laravel API response to match frontend expectations
    if (data.status === 'success' && data.data) {
      const transformedProducts = data.data.data?.map((product: any) => ({
        id: product.uuid || product.id.toString(),
        uuid: product.uuid,
        name: product.nama_produk,
        brand: product.store?.name || 'Premium Collection',
        price: product.harga_produk,
        salePrice: product.harga_diskon || null,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 100) + 10,
        image: Array.isArray(product.upload_gambar_produk) && product.upload_gambar_produk.length > 0
          ? `${backendUrl}/storage/${product.upload_gambar_produk[0]}`
          : '/placeholder.jpg',
        colors: null,
        isNew: product.status_produk === 'active' && new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        inStock: product.jenis_produk === 'digital' || (product.stock && product.stock > 0),
        slug: product.nama_produk.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        category: product.category?.judul_kategori,
        description: product.deskripsi,
        jenis_produk: product.jenis_produk,
        status_produk: product.status_produk,
        stock: product.stock,
        url_produk: product.url_produk,
        storeUuid: product.store?.uuid || product.uuid_store || null // map UUID toko
      })) || []

      return NextResponse.json({
        success: true,
        data: transformedProducts,
        pagination: {
          current_page: data.data.current_page || 1,
          per_page: data.data.per_page || 10,
          total: data.data.total || transformedProducts.length,
          last_page: data.data.last_page || 1
        }
      })
    }

    return NextResponse.json({
      success: false,
      data: [],
      message: 'No products found'
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        data: []
      },
      { status: 500 }
    )
  }
}