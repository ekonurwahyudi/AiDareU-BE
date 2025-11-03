'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useRouter, useParams, usePathname } from 'next/navigation'

// MUI Imports
import {
  Box,
  Typography,
  Button,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material'

// Icon Imports
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import DeleteIcon from '@mui/icons-material/Delete'
import RemoveIcon from '@mui/icons-material/Remove'
import AddIcon from '@mui/icons-material/Add'

// Helper function to format currency in Rupiah
const formatRupiah = (amount: number): string => {
  return `Rp. ${Math.round(amount).toLocaleString('id-ID')}`
}

interface CartItem {
  id: string
  name: string
  price: number
  salePrice?: number
  image: string
  quantity: number
}

interface CartDropdownProps {
  cartItems: CartItem[]
  onRemoveItem: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onAddToCart: (productId: string, event: React.MouseEvent) => void
  autoOpen?: boolean
  primaryColor?: string
}

const CartDropdown = ({
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  onAddToCart,
  autoOpen = false,
  primaryColor = '#E91E63'
}: CartDropdownProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  // Detect if we're in subdomain route or store route
  const subdomain = params?.subdomain as string | undefined
  const isSubdomainRoute = pathname?.startsWith('/s/')

  const totalPrice = cartItems.reduce((total, item) => {
    const price = item.salePrice || item.price
    return total + (price * item.quantity)
  }, 0)

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0)

  // Auto-open dropdown when items are added (desktop only)
  useEffect(() => {
    if (autoOpen && !isMobile && totalItems > 0) {
      const buttonElement = document.querySelector('[data-cart-button]') as HTMLButtonElement
      if (buttonElement) {
        setAnchorEl(buttonElement)
        // Auto-close after 2 seconds
        const timeout = setTimeout(() => {
          setAnchorEl(null)
        }, 2000)

        return () => clearTimeout(timeout)
      }
    }
  }, [totalItems, autoOpen, isMobile])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleCheckout = () => {
    console.log('CartDropdown handleCheckout called')
    handleClose()
    console.log('Navigating to checkout from dropdown...')

    // Route based on current path
    if (isSubdomainRoute && subdomain) {
      router.push(`/s/${subdomain}/checkout`)
    } else {
      router.push('/store/checkout')
    }
  }

  const open = Boolean(anchorEl)

  return (
    <>
      {/* Cart Button */}
      <Box sx={{ position: 'relative' }}>
        <Button
          data-cart-button
          onClick={handleClick}
          sx={{
            backgroundColor: primaryColor,
            color: 'white',
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: '8px',
            padding: '8px 20px',
            minWidth: { xs: 'auto', md: '120px' },
            '&:hover': {
              backgroundColor: '#C2185B'
            }
          }}
          startIcon={<ShoppingCartIcon />}
        >
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            Keranjang
          </Box>
        </Button>
        {totalItems > 0 && (
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
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {totalItems}
          </Box>
        )}
      </Box>

      {/* Cart Dropdown */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid #E2E8F0',
            mt: 1,
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCartIcon sx={{ color: primaryColor }} />
              Keranjang Belanja
            <Badge sx={{ ml: 3, '& .MuiBadge-badge': { backgroundColor: primaryColor } }} badgeContent={totalItems} />
            </Typography>
            
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Cart Items or Empty State */}
          {cartItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ShoppingCartIcon sx={{ fontSize: 48, color: '#CBD5E0', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#4A5568' }}>
                Keranjang kosong
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096', mb: 3 }}>
                Belum ada produk di keranjang Anda
              </Typography>
              <Button
                variant="contained"
                onClick={handleClose}
                sx={{
                  backgroundColor: primaryColor,
                  '&:hover': { backgroundColor: '#C2185B' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Belanja Sekarang
              </Button>
            </Box>
          ) : (
            <>
              {/* Cart Items List */}
              <Box sx={{ maxHeight: 280, overflow: 'auto', mb: 2 }}>
                {cartItems.map((item, index) => (
                  <Box key={item.id}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 2 }}>
                      {/* Product Image */}
                      <Avatar
                        src={item.image}
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '8px',
                          bgcolor: '#F7FAFC'
                        }}
                        variant="rounded"
                      >
                        📦
                      </Avatar>

                      {/* Product Details */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: '600',
                            lineHeight: 1.3,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {item.name}
                        </Typography>

                        {/* Price */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {item.salePrice ? (
                            <>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: primaryColor }}>
                                {formatRupiah(item.salePrice)}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: 'line-through',
                                  color: '#A0AEC0'
                                }}
                              >
                                {formatRupiah(item.price)}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: primaryColor }}>
                              {formatRupiah(item.price)}
                            </Typography>
                          )}
                        </Box>

                        {/* Quantity Controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => onUpdateQuantity(item.uuid || item.id, Math.max(1, item.quantity - 1))}
                              sx={{
                                width: 28,
                                height: 28,
                                border: '1px solid #E2E8F0',
                                borderRadius: '6px',
                                '&:hover': {
                                  backgroundColor: '#F7FAFC',
                                  borderColor: '#CBD5E0'
                                }
                              }}
                            >
                              <RemoveIcon sx={{ fontSize: 14 }} />
                            </IconButton>

                            <Typography
                              variant="body2"
                              sx={{
                                minWidth: 24,
                                textAlign: 'center',
                                fontWeight: '600',
                                backgroundColor: '#F7FAFC',
                                borderRadius: '4px',
                                px: 1,
                                py: 0.25
                              }}
                            >
                              {item.quantity}
                            </Typography>

                            <IconButton
                              size="small"
                              onClick={() => onUpdateQuantity(item.uuid || item.id, item.quantity + 1)}
                              sx={{
                                width: 28,
                                height: 28,
                                border: '1px solid #E2E8F0',
                                borderRadius: '6px',
                                '&:hover': {
                                  backgroundColor: '#F7FAFC',
                                  borderColor: '#CBD5E0'
                                }
                              }}
                            >
                              <AddIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>

                          <IconButton
                            size="small"
                            onClick={() => onRemoveItem(item.uuid || item.id)}
                            sx={{
                              color: '#E53E3E',
                              '&:hover': {
                                backgroundColor: '#FED7D7'
                              }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                    {index < cartItems.length - 1 && <Divider />}
                  </Box>
                ))}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Total and Checkout */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Total:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: primaryColor }}>
                    {formatRupiah(totalPrice)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleCheckout}
                  sx={{
                    backgroundColor: primaryColor,
                    '&:hover': { backgroundColor: '#C2185B' },
                    borderRadius: '8px',
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                >
                  Checkout ({totalItems} item{totalItems > 1 ? 's' : ''})
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </>
  )
}

export default CartDropdown