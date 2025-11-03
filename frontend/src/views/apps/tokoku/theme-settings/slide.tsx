'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

// Component Imports
import { toast } from 'react-hot-toast'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

const ImgStyled = styled('img')(({ theme }) => ({
  width: '100%',
  height: 200,
  borderRadius: theme.shape.borderRadius,
  objectFit: 'cover'
}))

const ButtonStyled = styled(Button)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    textAlign: 'center'
  }
}))

const Slide = () => {
  // RBAC Context
  const { currentStore } = useRBAC()

  const [slides, setSlides] = useState<{
    slide_1: File | null
    slide_2: File | null
    slide_3: File | null
  }>({
    slide_1: null,
    slide_2: null,
    slide_3: null
  })

  const [slidePreviews, setSlidePreviews] = useState<{
    slide_1: string
    slide_2: string
    slide_3: string
  }>({
    slide_1: '',
    slide_2: '',
    slide_3: ''
  })

  const [loading, setLoading] = useState(false)

  const storeUuid = currentStore?.uuid || currentStore?.id

  useEffect(() => {
    if (storeUuid) {
      fetchSlides(storeUuid)
    }
  }, [storeUuid])

  const fetchSlides = async (uuid: string) => {
    try {
      // Add cache busting parameter to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`http://localhost:8000/api/theme-settings?store_uuid=${uuid}&_t=${timestamp}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      console.log('Fetched slides data:', data)

      if (data.success && data.data.slides) {
        const slideData = data.data.slides
        console.log('Slides object:', slideData)

        setSlidePreviews({
          slide_1: slideData.slide_1 ? `http://localhost:8000/storage/${slideData.slide_1}` : '',
          slide_2: slideData.slide_2 ? `http://localhost:8000/storage/${slideData.slide_2}` : '',
          slide_3: slideData.slide_3 ? `http://localhost:8000/storage/${slideData.slide_3}` : ''
        })
      } else {
        console.log('No slides found')
      }
    } catch (error) {
      console.error('Error fetching slides:', error)
    }
  }

  const handleSlideChange = (slideNumber: 1 | 2 | 3, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSlides(prev => ({ ...prev, [`slide_${slideNumber}`]: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setSlidePreviews(prev => ({ ...prev, [`slide_${slideNumber}`]: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!storeUuid) {
      toast.error('Store UUID not found')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('uuid_store', storeUuid)

      if (slides.slide_1) formData.append('slide_1', slides.slide_1)
      if (slides.slide_2) formData.append('slide_2', slides.slide_2)
      if (slides.slide_3) formData.append('slide_3', slides.slide_3)

      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token')

      const response = await fetch('http://localhost:8000/api/theme-settings/slides', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast.success('Slides updated successfully')
        fetchSlides(storeUuid)
        // Reset file inputs
        setSlides({ slide_1: null, slide_2: null, slide_3: null })
      } else {
        toast.error(data.message || 'Failed to update slides')
      }
    } catch (error) {
      console.error('Error updating slides:', error)
      toast.error('An error occurred while updating slides')
    } finally {
      setLoading(false)
    }
  }

  const renderSlideUpload = (slideNumber: 1 | 2 | 3) => {
    const slideKey = `slide_${slideNumber}` as keyof typeof slidePreviews

    return (
      <Grid size={{ xs: 12, md: 4 }} key={slideNumber}>
        <Box>
          <Typography variant='body2' className='mbe-2'>
            Slide {slideNumber}
          </Typography>
          <Box className='mbs-4'>
            {slidePreviews[slideKey] ? (
              <ImgStyled src={slidePreviews[slideKey]} alt={`Slide ${slideNumber}`} />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <i className='tabler-photo' style={{ fontSize: '3rem', opacity: 0.5 }} />
                <Typography variant='caption' color='text.secondary'>
                  No image uploaded
                </Typography>
              </Box>
            )}
          </Box>
          <Button
            variant='contained'
            fullWidth
            className='mbs-4'
            component='label'
            htmlFor={`slide-${slideNumber}-upload`}
          >
            Upload Slide {slideNumber}
            <input
              hidden
              type='file'
              id={`slide-${slideNumber}-upload`}
              accept='image/png, image/jpeg, image/jpg, image/gif'
              onChange={(e) => handleSlideChange(slideNumber, e)}
            />
          </Button>
          <Typography variant='caption' color='text.secondary' display='block' textAlign='center'>
            Recommended size: 1200x400px
          </Typography>
        </Box>
      </Grid>
    )
  }

  return (
    <Card>
      <CardHeader title='Slide Settings' subheader='Upload banner images for your store homepage' />
      <CardContent>
        <Grid container spacing={6}>
          {renderSlideUpload(1)}
          {renderSlideUpload(2)}
          {renderSlideUpload(3)}

          {/* Submit Button */}
          <Grid size={{ xs: 12 }}>
            <div className='flex justify-end gap-4'>
              <Button variant='tonal' color='secondary' onClick={() => storeUuid && fetchSlides(storeUuid)}>
                Reset
              </Button>
              <Button variant='contained' onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Slide
