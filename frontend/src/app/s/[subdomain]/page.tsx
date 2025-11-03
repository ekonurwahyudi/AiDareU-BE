'use client'

// React Imports
import { useState, useEffect, use } from 'react'
import { useRouter, useParams } from 'next/navigation'

// Cart Context
import { useCart } from '@/contexts/CartContext'

// Custom Hook
import { useStoreMetadata } from './useStoreMetadata'

// MUI Imports
import { Box, Container, Grid, Typography, Card, CardContent, Button, IconButton, Chip, Rating, Collapse } from '@mui/material'
import { styled } from '@mui/material/styles'

// Icon Imports
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import StarIcon from '@mui/icons-material/Star'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import VisibilityIcon from '@mui/icons-material/Visibility'

// Store Components
import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import CartDrawer from '@/components/store/CartDrawer'

// Add keyframes for pulse animation
const pulseKeyframes = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`

// Custom Styled Components
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: theme.spacing(4, 0),
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '0 0 50px 50px',
  margin: theme.spacing(0, 2),
  marginTop: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(0, 1),
    borderRadius: '0 0 30px 30px',
    padding: theme.spacing(3, 0)
  }
}))

const PromotionCard = styled(Card)(({ theme }) => ({
  borderRadius: '24px',
  padding: theme.spacing(4),
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8]
  }
}))

const ProductCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[6]
  }
}))

const StepCard = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)'
  }
}))

const TestimonialCard = styled(Card)(({ theme }) => ({
  borderRadius: '20px',
  padding: theme.spacing(4),
  textAlign: 'center',
  height: '100%',
  position: 'relative',
  background: 'linear-gradient(145deg, #f8f9ff 0%, #ffffff 100%)',
  border: '1px solid rgba(0,0,0,0.05)'
}))

// Types
interface Product {
  id: string
  name: string
  brand?: string | null
  price: number
  salePrice?: number | null
  rating: number
  reviews: number
  image: string
  colors?: Array<{ name: string; value: string }> | null
  isNew: boolean
  inStock: boolean
  slug?: string
  uuid?: string
  storeUuid?: string // tambahkan UUID Store di product
  jenis_produk?: string // Tipe produk: 'digital' atau 'fisik'
}

// CartItem interface is now imported from CartContext

// Static Data
const heroSlides = [
  {
    title: 'Dapatkan Penawaran Terbaik',
    subtitle: 'Worksheet Edukatif untuk Si Kecil',
    description: 'Kembangkan kreativitas dan kemampuan belajar anak dengan worksheet berkualitas tinggi',
    discount: '30%',
    image: '/images/slide/slide1.png',
    cta: 'Belanja Sekarang',
    bgColor: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
  },
  {
    title: 'Koleksi Terlengkap',
    subtitle: 'Worksheet Anak Usia 2-9 Tahun',
    description: 'Dari menulis, menggambar hingga berhitung - semua ada di sini',
    discount: '45%',
    image: '/images/slide/slide2.png',
    cta: 'Lihat Koleksi',
    bgColor: 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
  },
  {
    title: 'Belajar Sambil Bermain',
    subtitle: 'Worksheet Interaktif & Menarik',
    description: 'Metode pembelajaran yang fun dan efektif untuk tumbuh kembang optimal',
    discount: '25%',
    image: '/images/slide/slide3.png',
    cta: 'Mulai Belajar',
    bgColor: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
  }
]

const promotions = [
  {
    title: 'Explore new arrivals',
    subtitle: 'Shop the latest from top brands',
    discount: null,
    image: '🏀',
    bgColor: '#FFF5F5',
    textColor: '#2D3748',
    buttonText: 'Show me all'
  },
  {
    title: 'Sale collection',
    subtitle: 'Up to 80% off retail',
    discount: '80%',
    image: '🎒',
    bgColor: '#F0FDF4',
    textColor: '#2D3748',
    buttonText: 'Show me all'
  },
  {
    title: 'Sale collection',
    subtitle: 'Up to 90% off retail',
    discount: '90%',
    image: '🐕',
    bgColor: '#F8FAFC',
    textColor: '#2D3748',
    buttonText: 'Show me all'
  }
]

const steps = [
  {
    number: '1',
    title: 'Cari & Temukan',
    description: 'Gunakan filter pintar untuk menemukan produk yang kamu butuhkan',
    color: '#EF4444',
    image: '/images/step/step1.webp',
    bgColor: '#FEF2F2'
  },
  {
    number: '2',
    title: 'Masukkan Keranjang',
    description: 'Pilih produk yang tepat dan masukkan ke dalam keranjang belanja',
    color: '#8B5CF6',
    image: '/images/step/step2.webp',
    bgColor: '#F5F3FF'
  },
  {
    number: '3',
    title: 'Pengiriman Cepat',
    description: 'Kurir akan mengkonfirmasi dan mengirim produk dengan cepat',
    color: '#F59E0B',
    image: '/images/step/step3.webp',
    bgColor: '#FFFBEB'
  },
  {
    number: '4',
    title: 'Nikmati Produk',
    description: 'Bersenang-senang dan nikmati produk berkualitas tinggi',
    color: '#EC4899',
    image: '/images/step/step4.webp',
    bgColor: '#FDF2F8'
  }
]

const testimonials = [
  {
    name: 'Ibu Sarah',
    location: 'Jakarta',
    text: 'Worksheet-nya sangat membantu anak saya belajar menulis, sekarang dia lebih semangat belajar di rumah!',
    rating: 5,
    avatar: '/images/avatars/sarah.jpg',
    package: 'Paket Lengkap',
  },
  {
    name: 'Bunda Rina',
    location: 'Surabaya',
    text: 'Kualitas gambarnya bagus banget, anak saya suka sekali dengan aktivitas mewarnainya',
    rating: 5,
    avatar: '/images/avatars/rina.jpg',
    package: 'Paket Premium',
  },
  {
    name: 'Ibu Maya',
    location: 'Bandung',
    text: 'Harga terjangkau tapi isinya lengkap. Anak jadi lebih fokus dan tidak main gadget terus',
    rating: 5,
    avatar: '/images/avatars/maya.jpg',
    package: 'Paket Premium',
  }
]

// Helper function to get product icon
const getProductIcon = (productName: string) => {
  const name = productName.toLowerCase()
  if (name.includes('bag') || name.includes('tote')) return '👜'
  if (name.includes('dress')) return '👗'
  if (name.includes('jacket') || name.includes('blazer')) return '🧥'
  if (name.includes('sweater')) return '👕'
  if (name.includes('shoe')) return '👟'
  return '👕' // default
}

// Helper function to format currency in Rupiah
const formatRupiah = (amount: number): string => {
  return `Rp. ${Math.round(amount).toLocaleString('id-ID')}`
}

const DynamicStorePage = () => {
  const router = useRouter()
  const params = useParams()
  const subdomain = params.subdomain as string

  const [currentSlide, setCurrentSlide] = useState(0)
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  // Store data from database
  const [storeData, setStoreData] = useState<any>(null)
  const [storeLoading, setStoreLoading] = useState(true)
  const [dynamicSlides, setDynamicSlides] = useState<any[]>([])
  const [dynamicTestimonials, setDynamicTestimonials] = useState<any[]>([])
  const [dynamicFaqs, setDynamicFaqs] = useState<any[]>([])

  // Use cart context
  const {
    cartItems,
    cartDrawerOpen,
    setCartDrawerOpen,
    addToCart: addToCartContext,
    removeFromCart,
    updateCartQuantity,
    handleCartClick
  } = useCart()

  const addToCart = (productId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const product = products.find(p => p.id === productId)
    if (!product) {
      console.error('Product not found:', productId)
      return
    }

    // Validate product has UUID
    if (!product.uuid) {
      console.error('Product missing UUID:', product)
      alert('Error: Produk tidak memiliki UUID. Silakan refresh halaman dan coba lagi.')
      return
    }

    console.log('Adding to cart - Product:', product)

    const cartItem = {
      id: product.id,
      uuid: product.uuid, // UUID produk untuk database
      name: product.name,
      price: product.price,
      salePrice: product.salePrice ?? undefined,
      image: product.image,
      brand: product.brand ?? undefined,
      storeUuid: product.storeUuid ?? undefined, // UUID Store ke cart
      jenis_produk: product.jenis_produk ?? 'fisik'
    }

    console.log('Cart Item with UUID:', cartItem)
    addToCartContext(cartItem)
  }

  // Fetch store data from API - prioritize this to load first
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setStoreLoading(true)
        setLoading(true)
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/api/store/${subdomain}`, {
          cache: 'no-store' // Prevent caching issues
        })
        const data = await response.json()

        if (data.success && data.data) {
          console.log('Store data fetched from API:', data.data)
          setStoreData(data.data)
          setStoreLoading(false) // Mark store data as loaded

          // Set products
          if (data.data.products) {
            const productsWithoutUuid = data.data.products.filter((p: any) => !p.uuid)
            if (productsWithoutUuid.length > 0) {
              console.warn('Products without UUID:', productsWithoutUuid)
            }
            setProducts(data.data.products)
          }

          // Set slides
          if (data.data.slides && data.data.slides.length > 0) {
            setDynamicSlides(data.data.slides)
          }

          // Set testimonials
          if (data.data.testimonials && data.data.testimonials.length > 0) {
            setDynamicTestimonials(data.data.testimonials)
          }

          // Set FAQs
          if (data.data.faqs && data.data.faqs.length > 0) {
            setDynamicFaqs(data.data.faqs)
          }
        }
      } catch (error) {
        console.error('Error fetching store data:', error)
        setStoreLoading(false)
      } finally {
        setLoading(false)
      }
    }

    if (subdomain) {
      fetchStoreData()
    }
  }, [subdomain])

  // Update metadata untuk halaman utama
  useStoreMetadata({
    title: storeData
      ? (storeData.seo?.meta_title ||
         (storeData.settings?.site_tagline
           ? `${storeData.settings?.site_title || storeData.store?.name} - ${storeData.settings.site_tagline}`
           : (storeData.settings?.site_title || storeData.store?.name || 'AiDareU Store')))
      : 'Loading...',
    description: storeData?.seo?.deskripsi || `Discover amazing products at ${storeData?.settings?.site_title || storeData?.store?.name || 'our store'}`,
    keywords: storeData?.seo?.keyword || '',
    ogTitle: storeData?.seo?.og_title || storeData?.settings?.site_title || storeData?.store?.name,
    ogDescription: storeData?.seo?.og_deskripsi || storeData?.seo?.deskripsi,
    ogImage: storeData?.seo?.og_image || storeData?.settings?.logo,
    favicon: storeData?.settings?.favicon
  })

  const toggleFavorite = (productId: string) => {
    setFavoriteProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleProductClick = (product: Product) => {
    // Use slug for routing with subdomain
    router.push(`/s/${subdomain}/${product.slug}`)
  }

  const handleFaqClick = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  // Use dynamic slides if available, otherwise use static
  const activeSlides = dynamicSlides.length > 0 ? dynamicSlides : heroSlides
  const activeTestimonials = dynamicTestimonials.length > 0 ? dynamicTestimonials : testimonials
  const activeFaqs = dynamicFaqs.length > 0 ? dynamicFaqs : []

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)
  }

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % activeTestimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + activeTestimonials.length) % activeTestimonials.length)
  }

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [currentSlide])

  // Get primary color from store settings
  const primaryColor = storeData?.settings?.primary_color || '#E91E63'

  // Show loading skeleton while store data is loading
  if (storeLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'white' }}>
        <Box sx={{
          height: 80,
          bgcolor: 'white',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          px: 3
        }}>
          <Box sx={{
            width: 150,
            height: 40,
            bgcolor: '#F3F4F6',
            borderRadius: 1,
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        </Box>
        <style jsx global>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style jsx global>{pulseKeyframes}</style>
      {/* Apply dynamic primary color */}
      <style jsx global>{`
        :root {
          --primary-color: ${primaryColor};
          --primary-color-rgb: ${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)};
        }

        /* Override MUI primary color */
        .MuiButton-containedPrimary {
          background-color: ${primaryColor} !important;
        }

        .MuiButton-containedPrimary:hover {
          background-color: ${primaryColor}dd !important;
        }

        .MuiButton-outlinedPrimary {
          color: ${primaryColor} !important;
          border-color: ${primaryColor} !important;
        }

        .MuiButton-outlinedPrimary:hover {
          background-color: ${primaryColor}11 !important;
          border-color: ${primaryColor} !important;
        }

        .MuiChip-colorPrimary {
          background-color: ${primaryColor}22 !important;
          color: ${primaryColor} !important;
        }

        .MuiIconButton-colorPrimary {
          color: ${primaryColor} !important;
        }

        /* Product card shadow with primary color */
        .MuiCard-root:hover {
          box-shadow: 0 8px 24px rgba(var(--primary-color-rgb), 0.25) !important;
        }

        /* Remove all button shadows */
        .MuiButton-root {
          box-shadow: none !important;
        }

        /* Apply to custom styled components */
        .primary-bg {
          background-color: ${primaryColor} !important;
        }

        .primary-text {
          color: ${primaryColor} !important;
        }

        .primary-border {
          border-color: ${primaryColor} !important;
        }

        /* Badge colors */
        .MuiBadge-badge {
          background-color: ${primaryColor} !important;
        }
      `}</style>
      <StoreHeader
        cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)}
        onCartClick={handleCartClick}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        onAddToCart={addToCart}
        storeName={storeData?.store?.name || 'AiDareU Store'}
        storeLogo={storeData?.settings?.logo ? `http://localhost:8000/storage/${storeData.settings.logo}` : undefined}
        primaryColor={primaryColor}
      />

      {/* Hero Section */}
      <Box
        id="home"
        sx={{
          background: 'white',
          // color: 'inherit',
          py: { xs: 3, md: 5 },
          position: 'relative',
          overflow: 'hidden',
          // borderRadius: '0 0 50px 50px',
          // margin: { xs: 1, md: 2 },
          marginTop: { xs: 1, md: 2 }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {/* Banner kiri (gambar saja) */}
            <Grid item xs={12} md={8}>
              <Box sx={{ position: 'relative', height: { xs: 280, md: 420 }, borderRadius: 3, overflow: 'hidden' }}>
                <Box
                  component="img"
                  src={activeSlides.length > 0 ? activeSlides[0].gambar_slide || activeSlides[0].image || '/images/slide/slide1.png' : '/images/slide/slide1.png'}
                  alt="Banner 1"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            </Grid>

            {/* Banner kanan (dua gambar) */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={12}>
                  <Box sx={{ position: 'relative', height: { xs: 180, md: 200 }, borderRadius: 3, overflow: 'hidden' }}>
                    <Box
                      component="img"
                      src={activeSlides.length > 1 ? activeSlides[1].gambar_slide || activeSlides[1].image || '/images/slide/slide2.png' : '/images/slide/slide2.png'}
                      alt="Banner 2"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={12}>
                  <Box sx={{ position: 'relative', height: { xs: 180, md: 200 }, borderRadius: 3, overflow: 'hidden' }}>
                    <Box
                      component="img"
                      src={activeSlides.length > 2 ? activeSlides[2].gambar_slide || activeSlides[2].image || '/images/slide/slide3.png' : '/images/slide/slide3.png'}
                      alt="Banner 3"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Promotions Section
      <Container maxWidth="lg" sx={{ py: 6, px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {promotions.map((promo, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <PromotionCard sx={{ bgcolor: promo.bgColor, color: promo.textColor }}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.7, mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {promo.title}
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 'bold',
                          mb: 2,
                          lineHeight: 1.3,
                          fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
                        }}
                      >
                        {promo.subtitle}
                      </Typography>
                      {promo.discount && (
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 'bold',
                            color: '#22C55E',
                            mb: 2,
                            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                          }}
                        >
                          {promo.discount}
                        </Typography>
                      )}
                      <Button
                        variant="text"
                        sx={{
                          color: promo.textColor,
                          fontWeight: 'bold',
                          textTransform: 'none',
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          p: 0,
                          '&:hover': { bgcolor: 'transparent' }
                        }}
                      >
                        {promo.buttonText} →
                      </Button>
                    </Box>
                    <Box sx={{ fontSize: { xs: '3rem', sm: '4rem' } }}>{promo.image}</Box>
                  </Box>
                </CardContent>
              </PromotionCard>
            </Grid>
          ))}
        </Grid>
      </Container> */}

      {/* Products Section */}
      <Box id="products" sx={{ bgcolor: 'white', py: 8 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 'bold',
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              New Arrivals. <span style={{ color: '#9CA3AF' }}>Daftar Produk</span>
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <IconButton sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <IconButton>
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={{ xs: 3, sm: 4 }}>
          {loading ? (
            // Loading skeleton - responsive columns
            Array.from({ length: 8 }).map((_, index) => (
              <Grid item xs={6} sm={6} md={4} lg={3} key={index}>
                <ProductCard sx={{ bgcolor: '#FAFAFA' }}>
                  <Box sx={{
                    height: { xs: 180, sm: 220, md: 260 },
                    bgcolor: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px 12px 0 0'
                  }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: '#E2E8F0',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                  </Box>
                  <CardContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'white' }}>
                    <Box sx={{ height: 18, bgcolor: '#F1F5F9', mb: 2, borderRadius: '6px' }} />
                    <Box sx={{ height: 14, bgcolor: '#E2E8F0', mb: 2, borderRadius: '4px', width: '70%' }} />
                    <Box sx={{ height: 20, bgcolor: '#F1F5F9', mb: 1, borderRadius: '6px', width: '50%' }} />
                  </CardContent>
                </ProductCard>
              </Grid>
            ))
          ) : (
            products.slice(0, 8).map((product) => (
              <Grid item xs={6} sm={6} md={4} lg={3} key={product.id}>
                <ProductCard
                  onClick={() => handleProductClick(product)}
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid #F1F5F9',
                    '&:hover': {
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                      borderColor: '#E2E8F0'
                    }
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    {product.salePrice && (
                      <Chip
                        label={`${Math.round(((product.price - product.salePrice) / product.price) * 100)}%`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: { xs: 8, sm: 12, md: 16 },
                          left: { xs: 8, sm: 12, md: 16 },
                          bgcolor: '#fdc700',
                          color: '#804b08',
                          fontWeight: 'bold',
                          zIndex: 1,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      />
                    )}
                    {product.isNew && !product.salePrice && (
                      <Chip
                        label="New in"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: { xs: 8, sm: 12, md: 16 },
                          left: { xs: 8, sm: 12, md: 16 },
                          bgcolor: 'white',
                          color: 'text.primary',
                          fontWeight: 'bold',
                          zIndex: 1,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      />
                    )}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: { xs: 8, sm: 12, md: 16 },
                        right: { xs: 8, sm: 12, md: 16 },
                        bgcolor: 'white',
                        color: favoriteProducts.includes(product.id) ? 'error.main' : 'text.secondary',
                        zIndex: 1,
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        '&:hover': { bgcolor: 'grey.100' }
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(product.id)
                      }}
                    >
                      {favoriteProducts.includes(product.id) ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                    </IconButton>

                    <Box
                      sx={{
                        width: '100%',
                        height: { xs: 180, sm: 220, md: 260 },
                        bgcolor: '#FAFBFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderRadius: '12px 12px 0 0',
                        border: '1px solid #F1F5F9',
                        borderBottom: 'none'
                      }}
                    >
                      {product.image && product.image !== '/placeholder.jpg' ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            const imgEl = e.currentTarget as HTMLImageElement
                            imgEl.style.display = 'none'
                            const nextEl = imgEl.nextElementSibling as HTMLElement | null
                            if (nextEl) {
                              nextEl.style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: product.image && product.image !== '/placeholder.jpg' ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '4rem', sm: '6rem', md: '8rem' }
                        }}
                      >
                        {getProductIcon(product.name)}
                      </Box>
                    </Box>
                  </Box>

                  <CardContent sx={{ p: { xs: 3, sm: 4 }, bgcolor: 'white', borderRadius: '0 0 12px 12px' }}>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: '600',
                        mb: 1.5,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        lineHeight: 1.4,
                        color: '#1E293B',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: '#E91E63',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px'
                          }}
                        >
                          🏪
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#64748B',
                            fontSize: { xs: '0.75rem', sm: '0.8rem' },
                            fontWeight: '500'
                          }}
                        >
                          {storeData?.store?.name || 'Premium Collection'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Rating
                          value={1}
                          max={1}
                          readOnly
                          size="small"
                          sx={{
                            color: '#F59E0B',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#64748B',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        >
                          (4.9)
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                      {product.salePrice ? (
                        <>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: '700',
                              color: '#50c878',
                              fontSize: { xs: '1rem', sm: '1.125rem' }
                            }}
                          >
                            {formatRupiah(product.salePrice)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              textDecoration: 'line-through',
                              color: '#94A3B8',
                              fontSize: { xs: '0.8rem', sm: '0.875rem' }
                            }}
                          >
                            {formatRupiah(product.price)}
                          </Typography>
                        </>
                      ) : (
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: '700',
                            color: '#50c878',
                            fontSize: { xs: '1rem', sm: '1.125rem' }
                          }}
                        >
                          {formatRupiah(product.price)}
                        </Typography>
                      )}
                    </Box>


                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button
                        variant="contained"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        sx={{
                          flex: 1,
                          bgcolor: '#E91E63',
                          '&:hover': { bgcolor: '#C2185B' },
                          borderRadius: 2,
                          height: 40,
                          py: 0.5,
                          px: { xs: 1, sm: 1.5 },
                          fontSize: { xs: '0.7rem', sm: '0.875rem' },
                          fontWeight: '500',
                          minHeight: 'auto',
                          whiteSpace: 'nowrap',
                          textTransform: 'none'
                        }}
                        onClick={() => handleProductClick(product)}
                      >
                        Lihat Produk
                      </Button>
                      <IconButton
                        sx={{
                          bgcolor: '#F8F9FA',
                          border: '1px solid #E2E8F0',
                          borderRadius: 2,
                          width: 40,
                          height: 40,
                          '&:hover': {
                            bgcolor: '#E91E63',
                            color: 'white',
                            borderColor: '#E91E63'
                          }
                        }}
                        onClick={(e) => addToCart(product.id, e)}
                      >
                        <ShoppingCartIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </ProductCard>
              </Grid>
            ))
          )}
        </Grid>
        </Container>
      </Box>
      {/* Shopping Steps */}
      <Box
        id="step"
        sx={{
          bgcolor: 'transparent',
          py: 16
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>

          <Box sx={{ position: 'relative', maxWidth: 1200, mx: 'auto' }}>
            {/* Custom SVG connecting line */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 60, sm: 70, md: 90 },
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90%',
                height: 'auto',
                zIndex: 0,
                display: { xs: 'none', md: 'block' }
              }}
            >
              <Box
                component="img"
                src="/images/step/garis.svg"
                alt="connecting line"
                sx={{
                  width: '100%',
                  height: 'auto'
                }}
              />
            </Box>

            <Grid container spacing={{ xs: 4, sm: 6, md: 8 }} justifyContent="center">
              {steps.map((step, index) => (
                <Grid item xs={6} sm={6} md={3} key={index}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      position: 'relative',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 1
                    }}
                  >
                    {/* Step number badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: step.color,
                        color: 'white',
                        borderRadius: '12px',
                        px: 2,
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        zIndex: 2
                      }}
                    >
                      Step {index + 1}
                    </Box>

                    {/* Image container with clean design */}
                    <Box
                      sx={{
                        width: { xs: 120, sm: 140, md: 200 },
                        height: { xs: 120, sm: 140, md: 180 },
                        borderRadius: '24px',
                        bgcolor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid #F1F5F9',
                        position: 'relative'
                      }}
                    >
                      <Box
                        component="img"
                        src={step.image}
                        alt={`${step.title} image`}
                        sx={{
                          width: '70%',
                          height: '70%',
                          objectFit: 'contain'
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        mb: 2,
                        fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                        color: '#1E293B'
                      }}
                    >
                      {step.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: '#64748B',
                        textAlign: 'center',
                        lineHeight: 1.6,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        maxWidth: 200
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box id="testimonial" sx={{ bgcolor: 'white', py: 16 }}>
        
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              Kata <span style={{ color: '#9CA3AF' }}>Mereka</span>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '1rem', sm: '1.125rem' },
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Apa kata mereka tentang manfaat produk kami.
            </Typography>
          </Box>
        

        {/* Desktop View - Show all testimonials */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Grid container spacing={4}>
            {activeTestimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box
                  sx={{
                    position: 'relative',
                    bgcolor: 'white',
                    borderRadius: '20px',
                    p: 4,
                    height: '100%',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      lineHeight: 1.6,
                      fontSize: '1rem',
                      color: '#475569',
                      fontStyle: 'italic'
                    }}
                  >
                    "{testimonial.testimoni || testimonial.text}"
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        bgcolor: '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}
                    >
                      👩
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          color: '#1E293B'
                        }}
                      >
                        {testimonial.nama || testimonial.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating
                          value={testimonial.rating || 5}
                          readOnly
                          size="small"
                          sx={{ color: '#F59E0B' }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      bgcolor: '#FEF3C7',
                      color: '#92400E',
                      px: 2,
                      py: 0.5,
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {testimonial.paket || testimonial.package || 'Paket Lengkap'}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Mobile View - Carousel */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'relative' }}>
          <Box
            sx={{
              overflow: 'hidden',
              borderRadius: '20px'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                transform: `translateX(-${currentTestimonial * 100}%)`,
                transition: 'transform 0.3s ease-in-out'
              }}
            >
              {activeTestimonials.map((testimonial, index) => (
                <Box
                  key={index}
                  sx={{
                    minWidth: '100%',
                    px: 1
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'white',
                      borderRadius: '20px',
                      p: 4,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      position: 'relative'
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        lineHeight: 1.6,
                        fontSize: '0.9rem',
                        color: '#475569',
                        fontStyle: 'italic'
                      }}
                    >
                      "{testimonial.testimoni || testimonial.text}"
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          width: 45,
                          height: 45,
                          borderRadius: '50%',
                          bgcolor: '#F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.3rem'
                        }}
                      >
                        👩
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            color: '#1E293B'
                          }}
                        >
                          {testimonial.nama || testimonial.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating
                            value={testimonial.rating || 5}
                            readOnly
                            size="small"
                            sx={{ color: '#F59E0B' }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        bgcolor: '#FEF3C7',
                        color: '#92400E',
                        px: 2,
                        py: 0.5,
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {testimonial.paket || testimonial.package || 'Paket Lengkap'}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Navigation arrows */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              transform: 'translateY(-50%)',
              px: -2
            }}
          >
            <IconButton
              onClick={prevTestimonial}
              sx={{
                bgcolor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                width: 44,
                height: 44,
                '&:hover': { bgcolor: '#F8FAFC' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <IconButton
              onClick={nextTestimonial}
              sx={{
                bgcolor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                width: 44,
                height: 44,
                '&:hover': { bgcolor: '#F8FAFC' }
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>

          {/* Dots indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
            {activeTestimonials.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: currentTestimonial === index ? '#92400E' : '#E5E7EB',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Box>
        </Box>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box
        id="faq"
        sx={{
          bgcolor: 'transparent',
          mt: 12,
          mb: 8
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              Pertayaan <span style={{ color: '#9CA3AF' }}>Umum</span>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '1rem', sm: '1.125rem' },
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Temukan jawaban untuk pertanyaan umum tentang Produk kami.
            </Typography>
          </Box>
        

        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {(activeFaqs.length > 0 ? activeFaqs : [
            {
              question: "Metode pembayaran apa saja yang tersedia?",
              answer: "Kami menerima kartu kredit/debit, transfer bank, dan e-wallet populer. Semua transaksi diproses secara aman."
            },
            {
              question: "Apakah pembayaran saya aman?",
              answer: "Pembayaran diproses melalui penyedia tepercaya dengan enkripsi SSL. Kami tidak menyimpan informasi kartu Anda."
            },
            {
              question: "Kapan pesanan saya diproses?",
              answer: "Pesanan diproses otomatis setelah pembayaran terkonfirmasi. Untuk produk digital, tautan unduhan akan tersedia dalam hitungan menit."
            },
            {
              question: "Bagaimana cara mengunduh produk setelah pembelian?",
              answer: "Setelah pembayaran berhasil, Anda akan menerima email konfirmasi berisi tautan unduhan. Tautan juga dapat diakses dari halaman riwayat pesanan."
            },
            {
              question: "Bagaimana kebijakan pembatalan dan pengembalian dana?",
              answer: "Kami menyediakan kebijakan pengembalian dana 30 hari jika terjadi masalah kualitas atau kesalahan transaksi."
            }
          ]).map((faq, index) => (
            <Box
              key={index}
              sx={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                mb: 2,
                overflow: 'hidden',
                bgcolor: 'white'
              }}
            >
              <Box
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  '&:hover': { bgcolor: '#F8FAFC' }
                }}
                onClick={() => handleFaqClick(index)}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    color: '#1E293B'
                  }}
                >
                  {faq.pertanyaan || faq.question}
                </Typography>
                <ExpandMoreIcon
                  sx={{
                    color: 'text.secondary',
                    fontSize: '1.5rem',
                    transform: expandedFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                />
              </Box>

              <Collapse in={expandedFaq === index}>
                <Box sx={{ px: 3, pb: 3, borderTop: '1px solid #F1F5F9' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.6,
                      fontSize: '1rem'
                    }}
                  >
                    {faq.jawaban || faq.answer}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          ))}
           <Card
              sx={{
                borderRadius: 3,
                p: { xs: 2, md: 4,},
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                border: '1px solid #E2E8F0',
                bgcolor: 'white'
              }}
            >
              <Grid container alignItems="center" spacing={3}>
                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      position: 'relative',
                      height: { xs: 120, md: 140 },
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      component="img"
                      src="/images/store/cs.png"
                      alt="Customer Service"
                      sx={{ width: '87%', ml:5, height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      mb: 1,
                      textAlign: { xs: 'center', md: 'left' }
                    }}
                  >
                    Ada kendala dalam pemesanan?
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ textAlign: { xs: 'center', md: 'left' } }}
                  >
                    Jangan ragu untuk hubungi kami 😊.
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={3}
                  sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}
                >
                  <Button
                    variant="contained"
                    startIcon={<WhatsAppIcon />}
                    sx={{
                     bgcolor: '#25D366',
                      '&:hover': { bgcolor: '#128C7E' },
                      borderRadius: 999,
                      boxShadow: 'none',
                      filter: 'none',
                      '&:focus': { boxShadow: 'none', filter: 'none' },
                      '&:focus-visible': { boxShadow: 'none', filter: 'none' },
                      '&:active': { boxShadow: 'none', filter: 'none' },
                      '&.MuiButton-root': { boxShadow: 'none' },
                      '&.MuiButton-contained': { boxShadow: 'none' }
                    }}
                    onClick={() => window.open('https://wa.me/628121555423', '_blank')}
                  >
                    Hubungi Kami
                  </Button>
                </Grid>
              </Grid>
            </Card>
        </Box>
        
        </Container>
      </Box>
      
      <Box id="contact">
        <Container sx={{ width: '55%', px: { xs: 2, sm: 3, md: 4 }, mb: 6 }}>
           
          </Container>
      </Box>

      

      <StoreFooter />

      <CartDrawer
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
      />
    </Box>
  )
}

export default DynamicStorePage