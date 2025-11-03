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
import Radio from '@mui/material/Radio'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

// Types
interface BankAccount {
  uuid: string
  store_uuid: string
  account_name: string
  bank_name: string
  account_number: string
  is_primary: boolean
  is_active: boolean
  bank_code: string
  created_at: string
  updated_at: string
}

interface PaymentMethodsResponse {
  success: boolean
  data: BankAccount[]
}

interface PaymentMethodsProps {
  storeUuid: string
  onPaymentSelect?: (account: BankAccount) => void
  selectedPayment?: BankAccount | null
}

// Bank color mapping
const getBankColor = (bankCode: string): string => {
  const bankColors: Record<string, string> = {
    'BCA': '#003d82', // Navy blue
    'BRI': '#0052cc', // Blue
    'Mandiri': '#ffc107', // Yellow
    'BNI': '#ff5722', // Orange
    'BSI': '#4caf50', // Green
    'Permata': '#9c27b0', // Purple
    'Danamon': '#3f51b5', // Indigo
    'CIMB': '#e91e63', // Pink
    'Maybank': '#795548' // Brown
  }

  return bankColors[bankCode] || '#6c757d' // Default gray
}

const PaymentMethods = ({
  storeUuid,
  onPaymentSelect,
  selectedPayment
}: PaymentMethodsProps) => {
  // States
  const [loading, setLoading] = useState<boolean>(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [error, setError] = useState<string>('')

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    if (!storeUuid) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/stores/${storeUuid}/bank-accounts`)
      const data: PaymentMethodsResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil metode pembayaran')
      }

      if (data.success && data.data) {
        setBankAccounts(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setBankAccounts([])
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch payment methods when store UUID changes
  useEffect(() => {
    fetchPaymentMethods()
  }, [storeUuid])

  // Handle payment method selection
  const handlePaymentSelect = (account: BankAccount) => {
    if (onPaymentSelect) {
      onPaymentSelect(account)
    }
  }

  // Don't render if no store UUID is provided
  if (!storeUuid) {
    return null
  }

  return (
    <Card sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', mt: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3, color: '#1E293B' }}>
          💳 Metode Pembayaran
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: '#E91E63' }} />
            <Typography sx={{ ml: 2, color: '#64748B' }}>
              Memuat metode pembayaran...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && bankAccounts.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Belum ada metode pembayaran yang terdaftar untuk toko ini
          </Alert>
        )}

        {!loading && !error && bankAccounts.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {bankAccounts.map((account) => (
              <Box
                key={account.uuid}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 3,
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: selectedPayment?.uuid === account.uuid
                    ? '#FFF1F5'
                    : 'transparent',
                  borderColor: selectedPayment?.uuid === account.uuid
                    ? '#E91E63'
                    : '#E2E8F0',
                  '&:hover': {
                    bgcolor: '#F8F9FA',
                    borderColor: '#E91E63'
                  }
                }}
                onClick={() => handlePaymentSelect(account)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
                  {/* Bank Logo/Icon */}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: getBankColor(account.bank_code),
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    {account.bank_code}
                  </Box>

                  {/* Bank Info */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontWeight: '600', color: '#1E293B', fontSize: '16px' }}>
                        {account.bank_name}
                      </Typography>
                      {account.is_primary && (
                        <Chip
                          size='small'
                          label='Utama'
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
                      {account.account_name}
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#059669', fontWeight: '500' }}>
                      {account.account_number}
                    </Typography>
                  </Box>
                </Box>

                {/* Selection Radio */}
                <Radio
                  checked={selectedPayment?.uuid === account.uuid}
                  sx={{
                    color: '#E91E63',
                    '&.Mui-checked': {
                      color: '#E91E63'
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

        {!loading && !error && bankAccounts.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant='body2' sx={{ color: '#64748B' }}>
                💡 Silakan transfer ke salah satu rekening yang dipilih
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PaymentMethods