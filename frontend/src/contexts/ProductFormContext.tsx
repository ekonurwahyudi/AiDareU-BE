'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Editor } from '@tiptap/core'

export interface ProductFormData {
  nama_produk: string
  deskripsi: string
  jenis_produk: 'digital' | 'fisik'
  url_produk?: string
  harga_produk: number | ''
  harga_diskon: number | ''
  category_id: number | ''
  status_produk: 'active' | 'inactive' | 'draft'
  images: File[]
  existingImages: string[] // Add support for existing images
  stock?: number | ''
}

interface ProductFormContextType {
  formData: ProductFormData
  setFormData: (data: Partial<ProductFormData>) => void
  resetForm: () => void
  errors: Record<string, string>
  setErrors: (errors: Record<string, string>) => void
  isSubmitting: boolean
  setIsSubmitting: (value: boolean) => void
  isLoading: boolean
  editor: Editor | null
  setEditor: (editor: Editor | null) => void
  submitForm: () => Promise<void>
  isEdit: boolean
  productUuid?: string
}

const initialFormData: ProductFormData = {
  nama_produk: '',
  deskripsi: '',
  jenis_produk: 'digital',
  url_produk: '',
  harga_produk: '',
  harga_diskon: '',
  category_id: '',
  status_produk: 'draft',
  images: [],
  existingImages: [],
  stock: 0
}

const ProductFormContext = createContext<ProductFormContextType | undefined>(undefined)

interface ProductFormProviderProps {
  children: ReactNode
  productUuid?: string
  isEdit?: boolean
}

export const ProductFormProvider = ({ children, productUuid, isEdit = false }: ProductFormProviderProps) => {
  const router = useRouter()
  const [formData, setFormDataState] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const setFormData = (data: Partial<ProductFormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }))
    // Clear errors for fields that are being updated
    const newErrors = { ...errors }
    Object.keys(data).forEach(key => {
      delete newErrors[key]
    })
    setErrors(newErrors)
  }

  const resetForm = () => {
    setFormDataState(initialFormData)
    setErrors({})
    setIsSubmitting(false)
    if (editor) {
      editor.commands.setContent('<p>Deskripsi produk singkat dan jelas tentang produk yang dijual.</p>')
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nama_produk.trim()) {
      newErrors.nama_produk = 'Nama produk wajib diisi'
    }

    if (!formData.harga_produk || Number(formData.harga_produk) <= 0) {
      newErrors.harga_produk = 'Harga produk harus lebih dari 0'
    }

    if (formData.harga_diskon && Number(formData.harga_diskon) >= Number(formData.harga_produk)) {
      newErrors.harga_diskon = 'Harga diskon harus lebih kecil dari harga produk'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Kategori wajib dipilih'
    }

    if (formData.jenis_produk === 'digital' && !formData.url_produk?.trim()) {
      newErrors.url_produk = 'URL produk wajib diisi untuk produk digital'
    }

    if (formData.jenis_produk === 'fisik' && (!formData.stock || formData.stock < 0)) {
      newErrors.stock = 'Stock harus diisi untuk produk fisik'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submitForm = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // First try to get store data from API
      let storeUuid = null
      
      try {
        const storeResponse = await fetch('/api/public/stores', {
          credentials: 'include'
        })
        
        if (storeResponse.ok) {
          const storeResult = await storeResponse.json()
          console.log('Store API response:', storeResult)
          const stores = storeResult.data || storeResult.stores || []
          if (stores.length > 0) {
            // Use the UUID from the store object
            storeUuid = stores[0].uuid
            console.log('Found store UUID:', storeUuid)
          } else {
            console.warn('No stores found in API response')
          }
        }
      } catch (storeError) {
        console.warn('Failed to fetch stores from API:', storeError)
      }
      
      // Fallback to localStorage if API fails
      if (!storeUuid) {
        const userData = localStorage.getItem('user_data')
        if (userData) {
          const user = JSON.parse(userData)
          if (user.stores && user.stores.length > 0) {
            storeUuid = user.stores[0].uuid || user.stores[0].id
          }
        }
      }

      if (!storeUuid) {
        throw new Error('Store not found. Please ensure you have a store set up.')
      }

      console.log('Using store UUID:', storeUuid)

      // Prepare form data
      const submitData = new FormData()
      submitData.append('uuid_store', storeUuid)
      submitData.append('nama_produk', formData.nama_produk)
      
      // Get content from editor
      if (editor) {
        submitData.append('deskripsi', editor.getHTML())
      } else if (isEdit) {
        submitData.append('deskripsi', '') // Send empty string for updates
      }
      
      submitData.append('jenis_produk', formData.jenis_produk)
      
      // Always send URL produk in edit mode, for create only if digital
      if (formData.url_produk || isEdit) {
        submitData.append('url_produk', formData.url_produk || '')
      }
      
      submitData.append('harga_produk', formData.harga_produk.toString())
      
      // Always send discount price in edit mode, including empty values
      if (formData.harga_diskon || isEdit) {
        submitData.append('harga_diskon', formData.harga_diskon ? formData.harga_diskon.toString() : '')
      }
      
      submitData.append('category_id', formData.category_id.toString())
      submitData.append('status_produk', formData.status_produk)
      
      // Always send stock for physical products or in edit mode
      if (formData.jenis_produk === 'fisik' || isEdit) {
        submitData.append('stock', formData.stock ? formData.stock.toString() : '0')
      }

      // Add images
      formData.images.forEach((file, index) => {
        submitData.append(`images[${index}]`, file)
      })

      // For Laravel compatibility with FormData PUT requests
      if (isEdit) {
        submitData.append('_method', 'PUT')
      }
      
      const url = isEdit && productUuid ? `/api/public/products/${productUuid}` : '/api/public/products'
      const method = 'POST' // Always POST for FormData, Laravel will handle _method
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const fullUrl = url.startsWith('/api/') ? `${apiUrl.replace('/api', '')}${url}` : url
      
      const response = await fetch(fullUrl, {
        method,
        body: submitData,
        credentials: 'include'
      })

      let result
      try {
        const responseText = await response.text()
        console.log('Raw response:', responseText)
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('Invalid response from server. Please try again.')
      }

      if (result.status === 'success') {
        // Success - redirect using Next.js router
        if (isEdit) {
          // For edit, add refresh parameter to force fresh data fetch
          router.push('/apps/tokoku/products?refresh=true')
        } else {
          // For create, redirect to list page
          router.push('/apps/tokoku/products')
        }
      } else {
        throw new Error(result.message || (isEdit ? 'Failed to update product' : 'Failed to create product'))
      }
    } catch (error) {
      console.error('Error submitting product:', error)
      setErrors({ submit: error instanceof Error ? error.message : (isEdit ? 'Failed to update product' : 'Failed to create product') })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load product data for edit mode
  useEffect(() => {
    if (isEdit && productUuid) {
      const loadProductData = async () => {
        setIsLoading(true)
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
          const response = await fetch(`${apiUrl}/public/products/${productUuid}`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.status === 'success' && result.data) {
              const product = result.data
              
              // Process existing images
              let existingImages: string[] = []
              if (product.upload_gambar_produk) {
                if (typeof product.upload_gambar_produk === 'string') {
                  try {
                    const parsed = JSON.parse(product.upload_gambar_produk)
                    existingImages = Array.isArray(parsed) ? parsed : []
                  } catch {
                    existingImages = [product.upload_gambar_produk]
                  }
                } else if (Array.isArray(product.upload_gambar_produk)) {
                  existingImages = product.upload_gambar_produk
                }
              }
              
              setFormDataState({
                nama_produk: product.nama_produk || '',
                deskripsi: product.deskripsi || '',
                jenis_produk: product.jenis_produk || 'digital',
                url_produk: product.url_produk || '',
                harga_produk: product.harga_produk || '',
                harga_diskon: product.harga_diskon || '',
                category_id: product.category_id || '',
                status_produk: product.status_produk || 'draft',
                images: [], // New uploaded images
                existingImages: existingImages, // Existing images from database
                stock: product.stock || 0
              })
              
              // Set editor content if available - this will be handled by the component
              // when the editor is ready and formData.deskripsi is available
            }
          }
        } catch (error) {
          console.error('Error loading product data:', error)
          setErrors({ submit: 'Failed to load product data' })
        } finally {
          setIsLoading(false)
        }
      }
      
      loadProductData()
    }
  }, [isEdit, productUuid, editor])

  const contextValue: ProductFormContextType = {
    formData,
    setFormData,
    resetForm,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    isLoading,
    editor,
    setEditor,
    submitForm,
    isEdit,
    productUuid
  }

  return (
    <ProductFormContext.Provider value={contextValue}>
      {children}
    </ProductFormContext.Provider>
  )
}

export const useProductForm = (): ProductFormContextType => {
  const context = useContext(ProductFormContext)
  if (!context) {
    throw new Error('useProductForm must be used within ProductFormProvider')
  }
  return context
}