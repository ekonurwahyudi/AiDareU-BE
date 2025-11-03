'use client'

// React Imports
import { useEffect, useState } from 'react'

// Component Imports
import StoreSetupModal from './StoreSetupModal'

interface StoreSetupCheckerProps {
  children: React.ReactNode
}

const StoreSetupChecker = ({ children }: StoreSetupCheckerProps) => {
  // States
  const [showModal, setShowModal] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkStoreStatus = async () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('user_data')
        const authToken = localStorage.getItem('auth_token')
        
        if (!userData || !authToken) {
          setIsChecking(false)
          return
        }

        const user = JSON.parse(userData)
        
        // If user already has store info locally, don't show modal
        if (user.has_store || user.store_id) {
          setIsChecking(false)
          return
        }

        // Check with backend to make sure
        const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
        
        const response = await fetch(`${backendUrl}/api/user/store-status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.has_store) {
            // Update localStorage
            user.has_store = true
            user.store_id = data.store_id
            localStorage.setItem('user_data', JSON.stringify(user))
            setShowModal(false)
          } else {
            // Show setup modal
            setShowModal(true)
          }
        } else {
          // If API fails, assume no store and show modal
          setShowModal(true)
        }
      } catch (error) {
        console.error('Error checking store status:', error)
        // On error, show modal to be safe
        setShowModal(true)
      }
      
      setIsChecking(false)
    }

    // Add small delay to prevent flash
    const timer = setTimeout(() => {
      checkStoreStatus()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleStoreSetupComplete = () => {
    setShowModal(false)
    
    // Refresh the page to show updated dashboard
    window.location.reload()
  }

  const handleModalClose = () => {
    // Allow closing the modal but show it again after delay
    setShowModal(false)
    setTimeout(() => {
      setShowModal(true)
    }, 3000) // Show again after 3 seconds
  }

  // Show loading state while checking
  if (isChecking) {
    return children // Show normal content while checking in background
  }

  return (
    <>
      {children}
      <StoreSetupModal
        open={showModal}
        onClose={handleModalClose}
        onComplete={handleStoreSetupComplete}
      />
    </>
  )
}

export default StoreSetupChecker