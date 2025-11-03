'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

// Helper function to format currency in Rupiah
const formatRupiah = (amount: number): string => {
  return `Rp. ${Math.round(amount).toLocaleString('id-ID')}`
}

// Helper function to format estimated delivery date
const formatEstimatedDelivery = (dateString: string): string => {
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  const formattedDate = date.toLocaleDateString('id-ID', options)

  if (diffDays === 0) {
    return `Hari ini - ${formattedDate}`
  } else if (diffDays === 1) {
    return `Besok - ${formattedDate}`
  } else {
    return `${diffDays} hari - ${formattedDate}`
  }
}

// Types
interface ShippingOption {
  courier: string
  service: string
  service_name: string
  description: string
  cost: number
  estimated_delivery: string
  delivery_days: number
}

interface ShippingResponse {
  success: boolean
  data: {
    origin: {
      province: string
      city: string
      district: string
    }
    destination: {
      province: string
      city: string
      district: string
    }
    weight: number
    shipping_options: ShippingOption[]
  }
}

interface ShippingOptionsProps {
  storeUuid: string
  destinationProvince: string
  destinationCity: string
  destinationDistrict: string
  weight?: number
  onShippingSelect?: (option: ShippingOption) => void
  selectedShipping?: ShippingOption | null
}

const ShippingOptions = ({
  storeUuid,
  destinationProvince,
  destinationCity,
  destinationDistrict,
  weight = 1000,
  onShippingSelect,
  selectedShipping
}: ShippingOptionsProps) => {
  // States
  const [loading, setLoading] = useState<boolean>(false)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [error, setError] = useState<string>('')
  const [originAddress, setOriginAddress] = useState<{province: string, city: string, district: string} | null>(null)

  // Fetch shipping options
  const fetchShippingOptions = async () => {
    if (!storeUuid || !destinationProvince || !destinationCity || !destinationDistrict) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeUuid,
          destinationProvince,
          destinationCity,
          destinationDistrict,
          weight
        })
      })

      const data: ShippingResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghitung biaya pengiriman')
      }

      if (data.success && data.data.shipping_options) {
        setShippingOptions(data.data.shipping_options)
        setOriginAddress(data.data.origin)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setShippingOptions([])
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch shipping options when parameters change
  useEffect(() => {
    fetchShippingOptions()
  }, [storeUuid, destinationProvince, destinationCity, destinationDistrict, weight])

  // Handle shipping option selection
  const handleOptionSelect = (option: ShippingOption) => {
    if (onShippingSelect) {
      onShippingSelect(option)
    }
  }

  // Don't render if no destination is provided
  if (!destinationProvince || !destinationCity || !destinationDistrict) {
    return null
  }

  return (
    <Card sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', mt: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3, color: '#1E293B' }}>
          🚚 Pilihan Pengiriman
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: '#E91E63' }} />
            <Typography sx={{ ml: 2, color: '#64748B' }}>
              Menghitung biaya pengiriman...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && shippingOptions.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Pilihan pengiriman tidak tersedia untuk alamat ini
          </Alert>
        )}

        {!loading && !error && shippingOptions.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {shippingOptions.map((option, index) => (
              <Box
                key={`${option.courier}-${option.service}-${index}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 3,
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: selectedShipping?.courier === option.courier && selectedShipping?.service === option.service
                    ? '#FFF1F5'
                    : 'transparent',
                  borderColor: selectedShipping?.courier === option.courier && selectedShipping?.service === option.service
                    ? '#E91E63'
                    : '#E2E8F0',
                  '&:hover': {
                    bgcolor: '#F8F9FA',
                    borderColor: '#E91E63'
                  }
                }}
                onClick={() => handleOptionSelect(option)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
                  {/* Courier Logo/Icon */}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: option.courier === 'JNE' ? '#1e3a8a' : '#E91E63',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    {option.courier}
                  </Box>

                  {/* Service Info */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontWeight: '600', color: '#1E293B', fontSize: '16px' }}>
                        {option.courier} - {option.service_name}
                      </Typography>
                      {option.service === 'YES' || option.service === 'EXPRESS' ? (
                        <Chip
                          size='small'
                          label='Express'
                          sx={{
                            bgcolor: '#FEF3C7',
                            color: '#92400E',
                            fontSize: '10px',
                            height: '20px'
                          }}
                        />
                      ) : (
                        <Chip
                          size='small'
                          label='Reguler'
                          sx={{
                            bgcolor: '#DBEAFE',
                            color: '#1E40AF',
                            fontSize: '10px',
                            height: '20px'
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant='body2' sx={{ color: '#64748B', mb: 1 }}>
                      {option.description}
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#059669', fontWeight: '500' }}>
                      Estimasi tiba: {formatEstimatedDelivery(option.estimated_delivery)}
                    </Typography>
                  </Box>
                </Box>

                {/* Price */}
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontWeight: 'bold', color: '#E91E63', fontSize: '18px' }}>
                    {formatRupiah(option.cost)}
                  </Typography>
                  <Typography variant='caption' sx={{ color: '#64748B' }}>
                    {option.delivery_days} hari kerja
                  </Typography>
                </Box>

                {/* Selection Indicator */}
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: '2px solid #E91E63',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: selectedShipping?.courier === option.courier && selectedShipping?.service === option.service
                      ? '#E91E63'
                      : 'transparent',
                    ml: 2
                  }}
                >
                  {selectedShipping?.courier === option.courier && selectedShipping?.service === option.service && (
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {!loading && !error && shippingOptions.length > 0 && originAddress && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant='body2' sx={{ color: '#64748B' }}>
                📦 Berat: {(weight / 1000).toFixed(1)} kg
              </Typography>
              <Typography variant='body2' sx={{ color: '#64748B' }}>
                •
              </Typography>
              <Typography variant='body2' sx={{ color: '#64748B' }}>
                📍 Dikirim dari {originAddress.district}, {originAddress.city}, {originAddress.province}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ShippingOptions