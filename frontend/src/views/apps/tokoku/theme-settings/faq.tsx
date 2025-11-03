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

// Component Imports
import { toast } from 'react-hot-toast'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

interface FaqItem {
  uuid: string
  pertanyaan: string
  jawaban: string
  urutan: number
}

const Faq = () => {
  // RBAC Context
  const { currentStore } = useRBAC()

  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null)
  const [formData, setFormData] = useState({
    pertanyaan: '',
    jawaban: '',
    urutan: 0
  })
  const [loading, setLoading] = useState(false)

  const storeUuid = currentStore?.uuid || currentStore?.id

  useEffect(() => {
    if (storeUuid) {
      fetchFaqs(storeUuid)
    }
  }, [storeUuid])

  const fetchFaqs = async (uuid: string) => {
    try {
      // Add cache busting parameter to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`http://localhost:8000/api/theme-settings?store_uuid=${uuid}&_t=${timestamp}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      console.log('Fetched FAQs data:', data)

      if (data.success && data.data.faqs) {
        console.log('FAQs array:', data.data.faqs)
        setFaqs(data.data.faqs)
      } else {
        console.log('No FAQs found')
        setFaqs([])
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    }
  }

  const handleOpenDialog = (faq?: FaqItem) => {
    if (faq) {
      setEditingFaq(faq)
      setFormData({
        pertanyaan: faq.pertanyaan,
        jawaban: faq.jawaban,
        urutan: faq.urutan
      })
    } else {
      setEditingFaq(null)
      setFormData({
        pertanyaan: '',
        jawaban: '',
        urutan: faqs.length
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingFaq(null)
    setFormData({
      pertanyaan: '',
      jawaban: '',
      urutan: 0
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

    if (!formData.pertanyaan || !formData.jawaban) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const url = editingFaq
        ? `http://localhost:8000/api/theme-settings/faq/${editingFaq.uuid}`
        : 'http://localhost:8000/api/theme-settings/faq'

      const method = editingFaq ? 'PUT' : 'POST'

      const body = editingFaq
        ? formData
        : { ...formData, uuid_store: storeUuid }

      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token')

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast.success(editingFaq ? 'FAQ updated successfully' : 'FAQ created successfully')
        fetchFaqs(storeUuid)
        handleCloseDialog()
      } else {
        toast.error(data.message || 'Failed to save FAQ')
      }
    } catch (error) {
      console.error('Error saving FAQ:', error)
      toast.error('An error occurred while saving FAQ')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
      return
    }

    setLoading(true)

    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token')

      const response = await fetch(`http://localhost:8000/api/theme-settings/faq/${uuid}`, {
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
        toast.success('FAQ deleted successfully')
        if (storeUuid) {
          fetchFaqs(storeUuid)
        }
      } else {
        toast.error(data.message || 'Failed to delete FAQ')
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      toast.error('An error occurred while deleting FAQ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title='FAQ Management'
          subheader='Manage frequently asked questions for your store'
          action={
            <Button variant='contained' onClick={() => handleOpenDialog()} startIcon={<i className='tabler-plus' />}>
              Add FAQ
            </Button>
          }
        />
        <CardContent>
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Answer</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {faqs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Typography variant='body2' color='text.secondary' className='py-8'>
                        No FAQs found. Click "Add FAQ" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  faqs.map((faq, index) => (
                    <TableRow key={faq.uuid}>
                      <TableCell>{faq.urutan}</TableCell>
                      <TableCell>{faq.pertanyaan}</TableCell>
                      <TableCell>
                        <Typography
                          variant='body2'
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {faq.jawaban}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' onClick={() => handleOpenDialog(faq)} color='primary'>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton size='small' onClick={() => handleDelete(faq.uuid)} color='error'>
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
        <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mbs-4'>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Urutan Faq'
                type='number'
                placeholder='0'
                value={formData.urutan}
                onChange={(e) => handleInputChange('urutan', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Question'
                placeholder='Enter your question'
                value={formData.pertanyaan}
                onChange={(e) => handleInputChange('pertanyaan', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Answer'
                placeholder='Enter your answer'
                value={formData.jawaban}
                onChange={(e) => handleInputChange('jawaban', e.target.value)}
                multiline
                rows={4}
                required
              />
            </Grid>
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

export default Faq
