'use client'

// React Imports
import { useState } from 'react'

// Context Imports
import { useProductForm } from '@/contexts/ProductFormContext'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { styled } from '@mui/material/styles'
import type { BoxProps } from '@mui/material/Box'

// Third-party Imports
import { useDropzone } from 'react-dropzone'

// Component Imports
import Link from '@components/Link'
import CustomAvatar from '@core/components/mui/Avatar'
import { ProductPlaceholder } from '@/components/ProductPlaceholder'

// Styled Component Imports
import AppReactDropzone from '@/libs/styles/AppReactDropzone'

type FileProp = {
  name: string
  type: string
  size: number
}

// Utility function to generate proper image URLs
const getImageUrl = (imagePath: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  return `${baseUrl}/storage/${imagePath}`
}

// Styled Dropzone Component
const Dropzone = styled(AppReactDropzone)<BoxProps>(({ theme }) => ({
  '& .dropzone': {
    minHeight: 'unset',
    padding: theme.spacing(12),
    [theme.breakpoints.down('sm')]: {
      paddingInline: theme.spacing(5)
    },
    '&+.MuiList-root .MuiListItem-root .file-name': {
      fontWeight: theme.typography.body1.fontWeight
    }
  }
}))

const ProductImage = () => {
  const { formData, setFormData } = useProductForm()

  // Calculate total images (existing + new)
  const totalImages = formData.existingImages.length + formData.images.length
  const maxImages = 10
  const remainingSlots = maxImages - totalImages

  // Hooks
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: remainingSlots,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file: File) => Object.assign(file))
      const updatedImages = [...formData.images, ...newFiles].slice(0, remainingSlots)
      setFormData({ images: updatedImages })
    },
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(({ errors }) => {
        errors.forEach(error => {
          console.error('File rejected:', error.message)
        })
      })
    }
  })

  const renderFilePreview = (file: FileProp) => {
    if (file.type.startsWith('image')) {
      return <img width={38} height={38} alt={file.name} src={URL.createObjectURL(file as any)} className="rounded object-cover" />
    } else {
      return <i className='tabler-file-description' />
    }
  }

  const renderExistingImagePreview = (imagePath: string) => {
    const imageUrl = getImageUrl(imagePath)
    const fileName = imagePath.split('/').pop() || imagePath
    
    return (
      <img 
        width={38} 
        height={38} 
        alt={fileName} 
        src={imageUrl} 
        className="rounded object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
        }}
      />
    )
  }

  const handleRemoveFile = (file: FileProp) => {
    const filtered = formData.images.filter((i: FileProp) => i.name !== file.name)
    setFormData({ images: filtered })
  }

  const handleRemoveExistingImage = (imagePath: string) => {
    const filtered = formData.existingImages.filter(path => path !== imagePath)
    setFormData({ existingImages: filtered })
  }

  // Render existing images list
  const existingImagesList = formData.existingImages.map((imagePath: string) => {
    const fileName = imagePath.split('/').pop() || imagePath
    
    return (
      <ListItem key={imagePath} className='pis-4 plb-3'>
        <div className='file-details'>
          <div className='file-preview'>{renderExistingImagePreview(imagePath)}</div>
          <div>
            <div className="flex items-center gap-2">
              <Typography className='file-name font-medium' color='text.primary'>
                {fileName}
              </Typography>
              <Chip label="Existing" size="small" color="primary" variant="outlined" />
            </div>
            <Typography className='file-size' variant='body2' color='text.secondary'>
              Existing image
            </Typography>
          </div>
        </div>
        <IconButton onClick={() => handleRemoveExistingImage(imagePath)}>
          <i className='tabler-x text-xl' />
        </IconButton>
      </ListItem>
    )
  })

  // Render new uploaded files list
  const newFilesList = formData.images.map((file: FileProp) => (
    <ListItem key={file.name} className='pis-4 plb-3'>
      <div className='file-details'>
        <div className='file-preview'>{renderFilePreview(file)}</div>
        <div>
          <div className="flex items-center gap-2">
            <Typography className='file-name font-medium' color='text.primary'>
              {file.name}
            </Typography>
            <Chip label="New" size="small" color="success" variant="outlined" />
          </div>
          <Typography className='file-size' variant='body2'>
            {Math.round(file.size / 100) / 10 > 1000
              ? `${(Math.round(file.size / 100) / 10000).toFixed(1)} mb`
              : `${(Math.round(file.size / 100) / 10).toFixed(1)} kb`}
          </Typography>
        </div>
      </div>
      <IconButton onClick={() => handleRemoveFile(file)}>
        <i className='tabler-x text-xl' />
      </IconButton>
    </ListItem>
  ))

  const handleRemoveAllFiles = () => {
    setFormData({ images: [], existingImages: [] })
  }

  return (
    <Dropzone>
      <Card>
        <CardHeader
          title={`Gambar Produk (${totalImages}/${maxImages})`}
          action={
            <Typography component={Link} color='primary.main' className='font-medium'>
              Add media from URL
            </Typography>
          }
          sx={{ '& .MuiCardHeader-action': { alignSelf: 'center' } }}
        />
        <CardContent>
          {/* Show existing images first */}
          {formData.existingImages.length > 0 && (
            <>
              <Typography variant="subtitle2" className="mb-3">
                Existing Images ({formData.existingImages.length})
              </Typography>
              <List>{existingImagesList}</List>
            </>
          )}
          
          {/* Show new uploaded images */}
          {formData.images.length > 0 && (
            <>
              <Typography variant="subtitle2" className="mb-3">
                New Images ({formData.images.length})
              </Typography>
              <List>{newFilesList}</List>
            </>
          )}
          
          {/* Upload area - only show if we haven't reached the limit */}
          {remainingSlots > 0 && (
            <div {...getRootProps({ className: 'dropzone' })}>
              <input {...getInputProps()} />
              <div className='flex items-center flex-col gap-2 text-center'>
                <CustomAvatar variant='rounded' skin='light' color='secondary'>
                  <i className='tabler-upload' />
                </CustomAvatar>
                <Typography variant='h4'>Drag and Drop Your Image Here.</Typography>
                <Typography color='text.disabled'>or</Typography>
                <Button variant='tonal' size='small'>
                  Browse Image
                </Button>
                <Typography variant='body2' color='text.secondary'>
                  You can add {remainingSlots} more image{remainingSlots !== 1 ? 's' : ''}
                </Typography>
              </div>
            </div>
          )}
          
          {/* Show message when limit is reached */}
          {remainingSlots === 0 && (
            <div className='text-center p-6 border border-dashed border-gray-300 rounded'>
              <CustomAvatar variant='rounded' skin='light' color='warning'>
                <i className='tabler-photo-off' />
              </CustomAvatar>
              <Typography variant='h6' className='mt-2'>
                Maximum images reached
              </Typography>
              <Typography color='text.secondary'>
                You have reached the maximum limit of {maxImages} images.
                Remove some images to add new ones.
              </Typography>
            </div>
          )}
          
          {/* Action buttons */}
          {totalImages > 0 && (
            <div className='buttons mt-4'>
              <Button color='error' variant='tonal' onClick={handleRemoveAllFiles}>
                Remove All
              </Button>
              <Button variant='contained' disabled>
                {totalImages} / {maxImages} Images Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Dropzone>
  )
}

export default ProductImage
