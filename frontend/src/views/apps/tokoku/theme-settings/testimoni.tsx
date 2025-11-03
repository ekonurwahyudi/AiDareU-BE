'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Rating from '@mui/material/Rating'
import Chip from '@mui/material/Chip'

// Component Imports
import { toast } from 'react-hot-toast'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

interface TestimoniItem {
  uuid: string
  nama: string
  testimoni: string
  rating: number
  lokasi: string
  paket: string
}

const Testimoni = () => {
  // RBAC Context
  const { currentStore } = useRBAC()

  const [testimonials, setTestimonials] = useState<TestimoniItem[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingTestimoni, setEditingTestimoni] = useState<TestimoniItem | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    testimoni: '',
    rating: 5,
    lokasi: '',
    paket: ''
  })
  const [loading, setLoading] = useState(false)

  const storeUuid = currentStore?.uuid || currentStore?.id

  useEffect(() => {
    if (storeUuid) {
      fetchTestimonials(storeUuid)
    }
  }, [storeUuid])

  const fetchTestimonials = async (uuid: string) => {
    try {
      // Add cache busting parameter to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`http://localhost:8000/api/theme-settings?store_uuid=${uuid}&_t=${timestamp}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      console.log('Fetched testimonials data:', data)

      if (data.success && data.data.testimonials) {
        console.log('Testimonials array:', data.data.testimonials)
        setTestimonials(data.data.testimonials)
      } else {
        console.log('No testimonials found')
        setTestimonials([])
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error)
    }
  }

  const handleOpenDialog = (testimoni?: TestimoniItem) => {
    if (testimoni) {
      setEditingTestimoni(testimoni)
      setFormData({
        nama: testimoni.nama,
        testimoni: testimoni.testimoni,
        rating: testimoni.rating,
        lokasi: testimoni.lokasi,
        paket: testimoni.paket
      })
    } else {
      setEditingTestimoni(null)
      setFormData({
        nama: '',
        testimoni: '',
        rating: 5,
        lokasi: '',
        paket: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingTestimoni(null)
    setFormData({
      nama: '',
      testimoni: '',
      rating: 5,
      lokasi: '',
      paket: ''
    })
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!storeUuid) {
      toast.error('Store UUID not found')
      return
    }

    if (!formData.nama || !formData.testimoni) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const url = editingTestimoni
        ? `http://localhost:8000/api/theme-settings/testimonial/${editingTestimoni.uuid}`
        : 'http://localhost:8000/api/theme-settings/testimonial'

      const method = editingTestimoni ? 'PUT' : 'POST'

      const body = editingTestimoni
        ? formData
        : { ...formData, uuid_store: storeUuid }

      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token')

      console.log('Submitting testimonial:', { url, method, body, authToken: authToken?.substring(0, 20) + '...' })

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(body)
      })

      console.log('Response status:', response.status)

      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      if (data.success) {
        toast.success(editingTestimoni ? 'Testimonial updated successfully' : 'Testimonial created successfully')
        fetchTestimonials(storeUuid)
        handleCloseDialog()
      } else {
        toast.error(data.message || 'Failed to save testimonial')
      }
    } catch (error) {
      console.error('Error saving testimonial:', error)
      toast.error('An error occurred while saving testimonial')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) {
      return
    }

    setLoading(true)

    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token')

      const response = await fetch(`http://localhost:8000/api/theme-settings/testimonial/${uuid}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast.success('Testimonial deleted successfully')
        if (storeUuid) {
          fetchTestimonials(storeUuid)
        }
      } else {
        toast.error(data.message || 'Failed to delete testimonial')
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      toast.error('An error occurred while deleting testimonial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Testimonial Management'
          subheader='Manage customer testimonials for your store'
          action={
            <Button variant='contained' onClick={() => handleOpenDialog()} startIcon={<i className='tabler-plus' />}>
              Add Testimonial
            </Button>
          }
        />
        <CardContent>
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Testimonial</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testimonials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <Typography variant='body2' color='text.secondary' className='py-8'>
                        No testimonials found. Click "Add Testimonial" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  testimonials.map((testimoni, index) => (
                    <TableRow key={testimoni.uuid}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{testimoni.nama}</TableCell>
                      <TableCell>
                        <Typography
                          variant='body2'
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            maxWidth: 300
                          }}
                        >
                          {testimoni.testimoni}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Rating value={testimoni.rating} readOnly size='small' />
                      </TableCell>
                      <TableCell>{testimoni.lokasi}</TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' onClick={() => handleOpenDialog(testimoni)} color='primary'>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton size='small' onClick={() => handleDelete(testimoni.uuid)} color='error'>
                          <i className='tabler-trash' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editingTestimoni ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mbs-4'>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Name'
                placeholder='Customer name'
                value={formData.nama}
                onChange={(e) => handleInputChange('nama', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Testimonial'
                placeholder='Customer testimonial'
                value={formData.testimoni}
                onChange={(e) => handleInputChange('testimoni', e.target.value)}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='Location'
                placeholder='e.g. Jakarta'
                value={formData.lokasi}
                onChange={(e) => handleInputChange('lokasi', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant='body2' className='mbe-2'>
                Rating
              </Typography>
              <Rating
                value={formData.rating}
                onChange={(event, newValue) => handleInputChange('rating', newValue || 5)}
                size='large'
              />
            </Grid>
            {/* <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='Package'
                placeholder='e.g. Paket Premium'
                value={formData.paket}
                onChange={(e) => handleInputChange('paket', e.target.value)}
              />
            </Grid> */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color='secondary'>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant='contained' disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Testimoni
