'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

// Context Imports
import { useProductForm } from '@/contexts/ProductFormContext'

const ProductAddHeader = () => {
  const router = useRouter()
  const { submitForm, isSubmitting, setFormData, errors } = useProductForm()

  const handleBack = () => {
    router.push('/apps/tokoku/products')
  }

  const handleSaveDraft = async () => {
    setFormData({ status_produk: 'draft' })
    await submitForm()
  }

  const handlePublish = async () => {
    setFormData({ status_produk: 'active' })
    await submitForm()
  }

  return (
    <div className='flex flex-wrap sm:items-center justify-between max-sm:flex-col gap-6'>
      <div>
        <Typography variant='h4' className='mbe-1'>
          Tambah Produk
        </Typography>
        <Typography>Tambahkan produk kamu disini</Typography>
      </div>
      
      {errors.submit && (
        <Alert severity="error" className="w-full">
          {errors.submit}
        </Alert>
      )}
      
      <div className='flex flex-wrap max-sm:flex-col gap-4'>
        <Button 
          variant='outlined' 
          color='primary' 
          startIcon={<i className="tabler-chevrons-left" />}
          onClick={handleBack}
          disabled={isSubmitting}
        >
          Kembali
        </Button>
        <Button 
          variant='outlined' 
          color='warning' 
          startIcon={isSubmitting ? <i className="tabler-loader animate-spin" /> : <i className="tabler-file-plus" />}
          onClick={handleSaveDraft}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Draft'}
        </Button>
        <Button 
          variant='contained' 
          color='success' 
          startIcon={isSubmitting ? <i className="tabler-loader animate-spin" /> : <i className="tabler-rocket" />}
          onClick={handlePublish}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Mempublish...' : 'Publish Product'}
        </Button>
      </div>
    </div>
  )
}

export default ProductAddHeader
