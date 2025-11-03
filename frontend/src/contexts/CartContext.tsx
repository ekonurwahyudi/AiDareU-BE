'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMediaQuery, useTheme } from '@mui/material'

// Types
// di dalam file CartContext.tsx
export interface CartItem {
  id: string
  uuid?: string // UUID produk untuk database
  name: string
  price: number
  salePrice?: number
  image: string
  quantity: number
  brand?: string
  storeUuid?: string // simpan UUID Store
  jenis_produk?: string // jenis produk: digital atau fisik
}

interface CartContextType {
  cartItems: CartItem[]
  cartDrawerOpen: boolean
  setCartDrawerOpen: (open: boolean) => void
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  handleCartClick: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

// Cart Provider Component
interface CartProviderProps {
  children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        const savedCart = localStorage.getItem('store_cart_items')
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          if (Array.isArray(parsedCart)) {
            setCartItems(parsedCart)
            console.log('Cart loaded from localStorage:', parsedCart)
          }
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        // Clear corrupted data
        localStorage.removeItem('store_cart_items')
      }
    }

    loadCartFromStorage()
  }, [])

  // Save cart to localStorage whenever cartItems changes
  useEffect(() => {
    try {
      localStorage.setItem('store_cart_items', JSON.stringify(cartItems))
      console.log('Cart saved to localStorage:', cartItems)
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [cartItems])

  // Add item to cart
  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setCartItems(prev => {
      // Use UUID as unique identifier, fallback to id if uuid is not available
      const productIdentifier = product.uuid || product.id
      const existingItem = prev.find(item => (item.uuid || item.id) === productIdentifier)

      if (existingItem) {
        // Update quantity if item already exists
        return prev.map(item =>
          (item.uuid || item.id) === productIdentifier
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        // Add new item
        return [...prev, { ...product, quantity }]
      }
    })

    // Auto-open cart drawer for mobile, let CartDropdown handle desktop
    if (isMobile) {
      setCartDrawerOpen(true)
    }
  }

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => (item.uuid || item.id) !== productId))
  }

  // Update item quantity
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCartItems(prev =>
      prev.map(item =>
        (item.uuid || item.id) === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  // Clear entire cart
  const clearCart = () => {
    setCartItems([])
  }

  // Get total number of items
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  // Get total price
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.salePrice || item.price
      return total + (price * item.quantity)
    }, 0)
  }

  // Handle cart button click
  const handleCartClick = () => {
    setCartDrawerOpen(true)
  }

  const value: CartContextType = {
    cartItems,
    cartDrawerOpen,
    setCartDrawerOpen,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    handleCartClick
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}