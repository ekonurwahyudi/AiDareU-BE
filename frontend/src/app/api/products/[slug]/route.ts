import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params
    const { slug } = resolvedParams

    console.log('Fetching product with slug:', slug)

    // Make request to Laravel backend to get all products
    const backendUrl = 'http://localhost:8000'

    console.log('Making request to:', `${backendUrl}/api/public/products?per_page=1000`)

    const response = await fetch(`${backendUrl}/api/public/products?per_page=1000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      cache: 'no-store'
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend response error:', errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const responseText = await response.text()
    console.log('Raw response:', responseText.substring(0, 500))

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response text:', responseText)
      throw new Error('Invalid JSON response from backend')
    }

    if (data.status === 'success' && data.data && data.data.data) {
      // Transform and find product by slug
      const transformedProducts = data.data.data.map((product: any) => ({
        id: product.uuid || product.id.toString(),
        uuid: product.uuid,
        name: product.nama_produk,
        brand: product.store?.name || 'Premium Collection',
        price: parseFloat(product.harga_produk || '0'),
        salePrice: product.harga_diskon ? parseFloat(product.harga_diskon) : null,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 100) + 10,
        image: Array.isArray(product.upload_gambar_produk) && product.upload_gambar_produk.length > 0
          ? `${backendUrl}/storage/${product.upload_gambar_produk[0]}`
          : '/placeholder.jpg',
        images: Array.isArray(product.upload_gambar_produk) && product.upload_gambar_produk.length > 0
          ? product.upload_gambar_produk.map((img: string) => `${backendUrl}/storage/${img}`)
          : ['/placeholder.jpg'],
        colors: null,
        isNew: product.status_produk === 'active' && new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        inStock: product.jenis_produk === 'digital' || (product.stock && product.stock > 0),
        slug: product.nama_produk.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        category: product.category?.judul_kategori || 'Produk',
        description: product.deskripsi || 'No description available for this product.',
        jenis_produk: product.jenis_produk,
        status_produk: product.status_produk,
        stock: product.stock || 0,
        url_produk: product.url_produk,
        storeUuid: product.store?.uuid || product.uuid_store || null // map UUID toko
      }))

      console.log('Transformed products count:', transformedProducts.length)
      console.log('Looking for slug:', slug)

      // Find product by slug
      const foundProduct = transformedProducts.find((product: any) => product.slug === slug)

      if (foundProduct) {
        console.log('Found product:', foundProduct.name)
        return NextResponse.json({
          success: true,
          data: foundProduct
        })
      } else {
        console.log('Product not found for slug:', slug)
        console.log('Available slugs:', transformedProducts.map((p: { slug: string }) => p.slug))
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Product not found',
      data: null
    }, { status: 404 })

  } catch (error) {
    console.error('Error fetching product by slug:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product',
        data: null
      },
      { status: 500 }
    )
  }
}