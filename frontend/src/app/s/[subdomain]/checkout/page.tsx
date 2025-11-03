'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Box, Container } from '@mui/material'

// Component Imports
import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import CartDrawer from '@/components/store/CartDrawer'
import CheckoutWizard from '@views/pages/wizard-examples/checkout/index'

// Cart Context
import { useCart } from '@/contexts/CartContext'

// Custom Hook
import { useStoreMetadata } from '../useStoreMetadata'

const CheckoutPage = () => {
  const params = useParams()
  const subdomain = params.subdomain as string

  // Use cart context
  const {
    cartItems,
    cartDrawerOpen,
    setCartDrawerOpen,
    removeFromCart,
    updateCartQuantity,
    handleCartClick
  } = useCart()

  // Store data state
  const [storeData, setStoreData] = useState<any>(null)
  const [storeLoading, setStoreLoading] = useState(true)

  // Fetch store data from API
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setStoreLoading(true)
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/api/store/${subdomain}`, {
          cache: 'no-store' // Prevent caching issues
        })
        const data = await response.json()

        if (data.success && data.data) {
          setStoreData(data.data)
        }
      } catch (error) {
        console.error('Error fetching store data:', error)
      } finally {
        setStoreLoading(false)
      }
    }

    if (subdomain) {
      fetchStoreData()
    }
  }, [subdomain])

  // Update metadata untuk halaman checkout
  useStoreMetadata({
    title: storeData
      ? `${storeData.settings?.site_title || storeData.store?.name} - Checkout`
      : 'Checkout',
    description: `Selesaikan pembelian Anda di ${storeData?.settings?.site_title || storeData?.store?.name || 'toko kami'}`,
    keywords: 'checkout, pembayaran, belanja online',
    ogTitle: storeData
      ? `Checkout - ${storeData.settings?.site_title || storeData.store?.name}`
      : 'Checkout',
    ogDescription: `Selesaikan pembelian Anda dengan aman dan mudah`,
    ogImage: storeData?.settings?.logo,
    favicon: storeData?.settings?.favicon
  })

  // Show loading skeleton while store data is loading
  if (storeLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#FAFBFC' }}>
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

  // Get primary color from store settings
  const primaryColor = storeData?.settings?.primary_color || '#E91E63'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Apply dynamic primary color */}
      <style jsx global>{`
        :root,
        body,
        #__next {
          --primary-color: ${primaryColor};
          --primary-color-rgb: ${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)};
        }

        /* Remove all button shadows */
        .MuiButton-root {
          box-shadow: none !important;
        }

        /* Buttons */
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

        /* Stepper */
        .MuiStepper .Mui-active, .MuiStepper .Mui-completed {
          color: ${primaryColor} !important;
        }
        .MuiStepIcon-root.Mui-active, .MuiStepIcon-root.Mui-completed {
          color: ${primaryColor} !important;
        }
        .MuiStepConnector-line {
          border-color: ${primaryColor}33 !important;
        }

        /* Override all pink colors (RGB 233, 30, 99 = E91E63) */
        [style*="233, 30, 99"],
        [style*="rgb(233, 30, 99)"],
        [style*="E91E63"],
        [style*="#E91E63"] {
          color: ${primaryColor} !important;
        }

        button[style*="233, 30, 99"],
        button[style*="E91E63"],
        .MuiButton-root[style*="E91E63"] {
          background-color: ${primaryColor} !important;
        }

        button[style*="233, 30, 99"]:hover,
        button[style*="E91E63"]:hover {
          background-color: ${primaryColor}dd !important;
        }

        /* Override darker pink (C2185B) for hover states */
        [style*="C2185B"],
        [style*="#C2185B"],
        button:hover[style*="C2185B"] {
          background-color: ${primaryColor}dd !important;
          border-color: ${primaryColor}dd !important;
        }

        /* Override borders with pink */
        [style*="border-color: rgb(233, 30, 99)"],
        [style*="borderColor: rgb(233, 30, 99)"],
        [style*="border-color: #E91E63"],
        [style*="borderColor: #E91E63"],
        div[style*="borderColor"][style*="E91E63"],
        button[style*="borderColor"][style*="E91E63"] {
          border-color: ${primaryColor} !important;
        }

        /* Override red badge/counter colors */
        .MuiBadge-colorError .MuiBadge-badge,
        .MuiBadge-badge {
          background-color: ${primaryColor} !important;
        }

        /* Override specific inline styles - more aggressive */
        div[style*="E91E63"],
        span[style*="E91E63"],
        p[style*="E91E63"] {
          color: ${primaryColor} !important;
        }
      `}</style>
      <StoreHeader
        cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)}
        onCartClick={handleCartClick}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        storeName={storeData?.store?.name || 'AiDareU Store'}
        storeLogo={storeData?.settings?.logo ? `http://localhost:8000/storage/${storeData.settings.logo}` : undefined}
        primaryColor={primaryColor}
      />

      <Box sx={{ flex: 1, py: { xs: 3, md: 6 }, bgcolor: '#FAFBFC' }}>
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 2, sm: 3, md: 4, lg: 6 },
            maxWidth: { xs: '100%', sm: '100%', md: '95%', lg: '90%', xl: '1200px' }
          }}
        >
          <CheckoutWizard primaryColor={primaryColor} />
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

export default CheckoutPage
