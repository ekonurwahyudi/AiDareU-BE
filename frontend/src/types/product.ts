// Product Types matching our API structure
export interface Product {
  id: number
  uuid: string
  uuid_store: string
  nama_produk: string
  deskripsi?: string
  jenis_produk: 'digital' | 'fisik'
  url_produk?: string
  upload_gambar_produk?: string[]
  harga_produk: number
  harga_diskon?: number
  category_id: number
  status_produk: 'active' | 'inactive' | 'draft'
  slug: string
  stock: number
  sku: string
  meta_description?: string
  meta_keywords?: string
  created_at: string
  updated_at: string
  
  // Relationships
  category?: Category
  store?: {
    uuid: string
    nama_toko: string
  }
  
  // Computed attributes
  formatted_price?: string
  formatted_discount_price?: string
  discount_percentage?: number
  main_image?: string
  has_discount?: boolean
  effective_price?: number
  in_stock?: boolean
}

export interface Category {
  id: number
  uuid: string
  judul_kategori: string
  deskripsi_kategori?: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
  products_count?: number
}

export interface ProductFilters {
  search?: string
  status?: 'active' | 'inactive' | 'draft' | 'all'
  category_id?: number | 'all'
  jenis_produk?: 'digital' | 'fisik' | 'all'
  store_uuid?: string
  per_page?: number
  page?: number
}

export interface ProductFormData {
  nama_produk: string
  deskripsi?: string
  jenis_produk: 'digital' | 'fisik'
  url_produk?: string
  images?: File[]
  harga_produk: number
  harga_diskon?: number
  category_id: number
  status_produk: 'active' | 'inactive' | 'draft'
  stock?: number
  meta_description?: string
  meta_keywords?: string
}

export interface PaginatedProducts {
  data: Product[]
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  message: string
  data: T
  errors?: Record<string, string[]>
}