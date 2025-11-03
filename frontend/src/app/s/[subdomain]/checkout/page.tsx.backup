'use client'

// React Imports
import { Box, Container } from '@mui/material'

// Component Imports
import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import CartDrawer from '@/components/store/CartDrawer'
import CheckoutWizard from '@views/pages/wizard-examples/checkout/index'

// Cart Context
import { useCart } from '@/contexts/CartContext'

const CheckoutPage = () => {
  // Use cart context
  const {
    cartItems,
    cartDrawerOpen,
    setCartDrawerOpen,
    removeFromCart,
    updateCartQuantity,
    handleCartClick
  } = useCart()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <StoreHeader
        cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)}
        onCartClick={handleCartClick}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
      />

      <Box sx={{ flex: 1, py: { xs: 3, md: 6 }, bgcolor: '#FAFBFC' }}>
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 2, sm: 3, md: 4, lg: 6 },
            maxWidth: { xs: '100%', sm: '100%', md: '95%', lg: '90%', xl: '1200px' }
          }}
        >
          <CheckoutWizard />
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
