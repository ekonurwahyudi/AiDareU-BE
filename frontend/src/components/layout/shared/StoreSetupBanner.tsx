'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import Box from '@mui/material/Box'

// Component Imports
import StoreSetupModal from '@/components/store-setup/StoreSetupModal'

const StoreSetupBanner = () => {
  // States
  const [showBanner, setShowBanner] = useState(false)
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
          setShowBanner(false)
          return
        }

        const user = JSON.parse(userData)

        // If user already has store info locally, don't show banner
        // Backend returns 'store' object (not has_store or store_id)
        if (user.store && user.store.uuid) {
          setIsChecking(false)
          setShowBanner(false)
          return
        }

        // Check with backend to make sure
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

        const response = await fetch(`${backendUrl}/api/user/store-status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })

        if (response.ok) {
          const data = await response.json()

          if (data.has_store && data.store_uuid) {
            // Update localStorage with store info
            user.store = {
              uuid: data.store_uuid,
              id: data.store_id
            }
            localStorage.setItem('user_data', JSON.stringify(user))
            setShowBanner(false)
          } else {
            // No store found, show setup banner
            setShowBanner(true)
          }
        } else {
          // If API fails, assume no store and show banner
          setShowBanner(true)
        }
      } catch (error) {
        console.error('Error checking store status:', error)
        // On error, show banner to be safe
        setShowBanner(true)
      }

      setIsChecking(false)
    }

    checkStoreStatus()
  }, [])

  const handleSetupClick = () => {
    setShowModal(true)
  }

  const handleStoreSetupComplete = () => {
    setShowModal(false)
    setShowBanner(false)

    // Refresh the page to show updated dashboard
    window.location.reload()
  }

  const handleModalClose = () => {
    setShowModal(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
  }

  // Don't render anything while checking or if banner shouldn't be shown
  if (isChecking || !showBanner) {
    return null
  }

  return (
    <>
      <Collapse in={showBanner}>
        <Alert
          severity="warning"
          sx={{
            borderRadius: 0,
            '& .MuiAlert-message': {
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2
            }
          }}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                color="warning"
                onClick={handleSetupClick}
                sx={{
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                  px: 2
                }}
              >
                Setup Toko
              </Button>
              <IconButton
                size="small"
                onClick={handleDismiss}
                sx={{ ml: 1 }}
              >
                <i className="tabler-x" />
              </IconButton>
            </Box>
          }
        >
          <strong>Kamu belum memiliki Toko.</strong> Ayo Setup Tokomu Sekarang untuk mulai berjualan!
        </Alert>
      </Collapse>

      <StoreSetupModal
        open={showModal}
        onClose={handleModalClose}
        onComplete={handleStoreSetupComplete}
      />
    </>
  )
}

export default StoreSetupBanner
