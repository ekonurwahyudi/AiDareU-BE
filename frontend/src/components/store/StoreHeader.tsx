'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Icon Imports
import MenuIcon from '@mui/icons-material/Menu'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import CloseIcon from '@mui/icons-material/Close'

// Components
import CartDropdown from './CartDropdown'

// Custom Styled Components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'white',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  color: theme.palette.text.primary
}))

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '1.5rem',
  color: '#E91E63',
  cursor: 'pointer',
  textDecoration: 'none',
  '&:hover': {
    opacity: 0.8
  }
}))

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: '500',
  textTransform: 'none',
  fontSize: '1rem',
  padding: '8px 16px',
  marginRight: '8px',
  '&:hover': {
    backgroundColor: 'rgba(233, 30, 99, 0.1)',
    color: '#E91E63'
  }
}))

const CartButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#E91E63',
  color: 'white',
  fontWeight: 'bold',
  textTransform: 'none',
  borderRadius: '8px',
  padding: '8px 20px',
  '&:hover': {
    backgroundColor: '#C2185B'
  }
}))

interface CartItem {
  id: string
  name: string
  price: number
  salePrice?: number
  image: string
  quantity: number
}

interface StoreHeaderProps {
  cartItemCount?: number
  onCartClick?: () => void
  cartItems?: CartItem[]
  onRemoveItem?: (productId: string) => void
  onUpdateQuantity?: (productId: string, quantity: number) => void
  onAddToCart?: (productId: string, event: React.MouseEvent) => void
  storeName?: string
  storeLogo?: string
  primaryColor?: string
}

const StoreHeader = ({
  cartItemCount = 0,
  onCartClick,
  cartItems = [],
  onRemoveItem,
  storeName = 'AiDareU Store',
  storeLogo,
  onUpdateQuantity,
  onAddToCart,
  primaryColor = '#E91E63'
}: StoreHeaderProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    { label: 'Home', href: '#home' },
    { label: 'Produk', href: '#products' },
    { label: 'Testimoni', href: '#testimonial' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Kontak', href: '#contact' }
  ]

  const handleMenuClick = (href: string) => {
    if (href.startsWith('#')) {
      // Smooth scroll to section
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setMobileMenuOpen(false)
  }

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick()
    }
  }

  return (
    <>
      <StyledAppBar position="sticky" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0, sm: 2 } }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {storeLogo ? (
                <Box
                  component="img"
                  src={storeLogo}
                  alt={storeName}
                  sx={{ height: 40, width: 'auto', objectFit: 'contain' }}
                />
              ) : (
                <Logo variant="h6" sx={{ color: primaryColor }}>
                  ❤️ {storeName}
                </Logo>
              )}
            </Box>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {menuItems.map((item) => (
                  <NavButton
                    key={item.label}
                    onClick={() => handleMenuClick(item.href)}
                    sx={{
                      '&:hover': {
                        backgroundColor: `${primaryColor}22`,
                        color: primaryColor
                      }
                    }}
                  >
                    {item.label}
                  </NavButton>
                ))}
              </Box>
            )}

            {/* Cart Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile && (
                <IconButton
                  color="inherit"
                  onClick={() => setMobileMenuOpen(true)}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              {/* Desktop: Use CartDropdown, Mobile: Use CartDrawer button */}
              {!isMobile ? (
                <CartDropdown
                  cartItems={cartItems}
                  onRemoveItem={onRemoveItem || (() => {})}
                  onUpdateQuantity={onUpdateQuantity || (() => {})}
                  onAddToCart={onAddToCart || (() => {})}
                  autoOpen={true}
                  primaryColor={primaryColor}
                />
              ) : (
                <Box sx={{ position: 'relative' }}>
                  <Button
                    onClick={onCartClick}
                    sx={{
                      backgroundColor: primaryColor,
                      color: 'white',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      borderRadius: '8px',
                      padding: '8px 20px',
                      minWidth: 'auto',
                      '&:hover': {
                        backgroundColor: `${primaryColor}dd`
                      }
                    }}
                  >
                    <ShoppingCartIcon />
                  </Button>
                  {cartItemCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: primaryColor,
                        color: 'white',
                        borderRadius: '50%',
                        minWidth: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        border: '2px solid white'
                      }}
                    >
                      {cartItemCount}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: 'white'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {storeLogo ? (
              <Box
                component="img"
                src={storeLogo}
                alt={storeName}
                sx={{ height: 32, width: 'auto', objectFit: 'contain' }}
              />
            ) : (
              <Logo variant="h6">❤️ {storeName}</Logo>
            )}
          </Box>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List sx={{ px: 2 }}>
          {menuItems.map((item) => (
            <ListItem
              key={item.label}
              onClick={() => handleMenuClick(item.href)}
              sx={{
                borderRadius: 2,
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(233, 30, 99, 0.1)'
                }
              }}
            >
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: '500',
                    fontSize: '1rem'
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  )
}

export default StoreHeader