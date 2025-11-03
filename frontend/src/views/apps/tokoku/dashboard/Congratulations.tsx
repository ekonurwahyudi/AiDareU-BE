// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'

interface CongratulationsProps {
  userName?: string | null
  monthlyRevenue?: number | null
  storeName?: string | null
}

const CongratulationsJohn = ({ userName, monthlyRevenue, storeName }: CongratulationsProps) => {
  // Format currency
  const formatCurrency = (value: number | null | undefined) => {
    const safeValue = Number(value) || 0

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(safeValue)
  }

  // Display name (fallback to "Sobat" if no name)
  const displayName = userName || 'Sobat'
  const displayStore = storeName ? ` - ${storeName}` : ''

  return (
    <Card>
      <Grid container>
        <Grid size={{ xs: 8 }}>
          <CardContent>
            <Typography variant='h5' className='mbe-0.5'>
              Selamat Datang {displayName} 🎉
            </Typography>
            <Typography variant='subtitle1' className='mbe-2'>
              Revenue bulan tokomu{displayStore} bulan ini
            </Typography>
            <Typography variant='h4' color='primary.main' className='mbe-1'>
              {formatCurrency(monthlyRevenue)}
            </Typography>
            <Button variant='contained' color='primary' href='/dashboards/ecommerce'>
              Lihat Order
            </Button>
          </CardContent>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <div className='relative bs-full is-full'>
            <img
              alt={`Congratulations ${displayName}`}
              src='/images/illustrations/characters/8.png'
              className='max-bs-[150px] absolute block-end-0 inline-end-6 max-is-full'
            />
          </div>
        </Grid>
      </Grid>
    </Card>
  )
}

export default CongratulationsJohn
