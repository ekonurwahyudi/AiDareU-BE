'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'

const COMPONENT_TYPES = {
  TEXT: 'text',
  DYNAMIC_TEXT: 'dynamic_text', 
  BUTTON: 'button',
  IMAGE: 'image',
  FULL_WIDTH_IMAGE: 'full_width_image',
  VIDEO: 'video',
  CONTAINER: 'container',
  GRID: 'grid',
  HTML_CODE: 'html_code',
  HERO_HEADER: 'hero_header',
  SPOTLIGHT_TEXT: 'spotlight_text',
  FEATURE_HIGHLIGHT: 'feature_highlight'
}

interface EditableComponentProps {
  component: any
  onUpdate: (data: any) => void
  onDelete: () => void
  onSelect: (component: any) => void
}

const EditableComponent = ({ component, onUpdate, onDelete, onSelect }: EditableComponentProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(component)

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }

  const renderComponent = () => {
    switch (component.type) {
      case COMPONENT_TYPES.TEXT:
        return (
          <Box onClick={() => setIsEditing(true)} sx={{ cursor: 'pointer', p: 1, border: '1px dashed transparent', '&:hover': { border: '1px dashed #2563eb' } }}>
            <Typography variant="body1">{component.content || 'Click to edit text'}</Typography>
          </Box>
        )
      
      case COMPONENT_TYPES.DYNAMIC_TEXT:
        return (
          <Box onClick={() => setIsEditing(true)} sx={{ cursor: 'pointer', p: 1, border: '1px dashed transparent', '&:hover': { border: '1px dashed #2563eb' } }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{component.content || 'Dynamic Title'}</Typography>
          </Box>
        )
      
      case COMPONENT_TYPES.BUTTON:
        return (
          <Box onClick={() => setIsEditing(true)} sx={{ cursor: 'pointer' }}>
            <Button 
              variant="contained" 
              color={component.color || 'primary'}
              size={component.size || 'medium'}
            >
              {component.text || 'Button Text'}
            </Button>
          </Box>
        )
      
      case COMPONENT_TYPES.IMAGE:
        return (
          <Box onClick={() => setIsEditing(true)} sx={{ cursor: 'pointer', border: '1px dashed transparent', '&:hover': { border: '1px dashed #2563eb' } }}>
            <img 
              src={component.src || '/api/placeholder/300/200'} 
              alt={component.alt || 'Image'}
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
            />
          </Box>
        )
      
      case COMPONENT_TYPES.HERO_HEADER:
        return (
          <Box 
            onClick={() => setIsEditing(true)}
            sx={{ 
              cursor: 'pointer',
              background: `linear-gradient(135deg, rgba(0,0,0,0.6), rgba(37,99,235,0.3)), url(${component.backgroundImage || '/api/placeholder/1600/600'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: 'white',
              p: 8,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px dashed transparent',
              '&:hover': { border: '1px dashed #fff' }
            }}
          >
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
              {component.headline || 'Hero Headline'}
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              {component.subheadline || 'Hero subheadline description'}
            </Typography>
            <Button variant="contained" size="large" color="primary">
              {component.ctaText || 'Call to Action'}
            </Button>
          </Box>
        )
      
      case COMPONENT_TYPES.CONTAINER:
        return (
          <Box sx={{ border: '2px dashed #ccc', p: 2, borderRadius: 2, minHeight: '100px' }}>
            <Typography variant="caption" color="textSecondary">Container - Drop components here</Typography>
          </Box>
        )
      
      case 'html_content':
        return (
          <Box 
            onClick={() => setIsEditing(true)}
            sx={{ 
              cursor: 'pointer',
              border: '1px dashed #e0e0e0',
              borderRadius: 1,
              overflow: 'hidden',
              '&:hover': { border: '1px dashed #2563eb' }
            }}
          >
            <iframe 
              title="HTML Content Preview"
              style={{ 
                width: '100%', 
                height: '400px', 
                border: 'none',
                pointerEvents: 'none'
              }}
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <style>
                      body { margin: 0; padding: 16px; font-family: system-ui; }
                      * { max-width: 100%; }
                    </style>
                  </head>
                  <body>
                    ${component.content || 'HTML Content'}
                  </body>
                </html>
              `}
            />
          </Box>
        )
      
      default:
        return <Typography>Unknown component type</Typography>
    }
  }

  if (isEditing) {
    return (
      <Card sx={{ p: 2, border: '2px solid #2563eb' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Edit {component.type}</Typography>
        
        {component.type === COMPONENT_TYPES.TEXT && (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Text Content"
            value={editData.content || ''}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            sx={{ mb: 2 }}
          />
        )}
        
        {component.type === COMPONENT_TYPES.DYNAMIC_TEXT && (
          <TextField
            fullWidth
            label="Title"
            value={editData.content || ''}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            sx={{ mb: 2 }}
          />
        )}
        
        {component.type === COMPONENT_TYPES.BUTTON && (
          <>
            <TextField
              fullWidth
              label="Button Text"
              value={editData.text || ''}
              onChange={(e) => setEditData({ ...editData, text: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Link URL"
              value={editData.url || ''}
              onChange={(e) => setEditData({ ...editData, url: e.target.value })}
              sx={{ mb: 2 }}
            />
          </>
        )}
        
        {component.type === COMPONENT_TYPES.IMAGE && (
          <>
            <TextField
              fullWidth
              label="Image URL"
              value={editData.src || ''}
              onChange={(e) => setEditData({ ...editData, src: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Alt Text"
              value={editData.alt || ''}
              onChange={(e) => setEditData({ ...editData, alt: e.target.value })}
              sx={{ mb: 2 }}
            />
          </>
        )}
        
        {component.type === COMPONENT_TYPES.HERO_HEADER && (
          <>
            <TextField
              fullWidth
              label="Headline"
              value={editData.headline || ''}
              onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Subheadline"
              value={editData.subheadline || ''}
              onChange={(e) => setEditData({ ...editData, subheadline: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="CTA Text"
              value={editData.ctaText || ''}
              onChange={(e) => setEditData({ ...editData, ctaText: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Background Image URL"
              value={editData.backgroundImage || ''}
              onChange={(e) => setEditData({ ...editData, backgroundImage: e.target.value })}
              sx={{ mb: 2 }}
            />
          </>
        )}

        {component.type === 'html_content' && (
          <TextField
            fullWidth
            multiline
            rows={8}
            label="HTML Content"
            value={editData.content || ''}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            sx={{ mb: 2, fontFamily: 'monospace' }}
            helperText="Edit the HTML content directly. Changes will be reflected in the preview."
          />
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={handleSave}>Save</Button>
          <Button variant="outlined" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button variant="outlined" color="error" onClick={onDelete}>Delete</Button>
        </Box>
      </Card>
    )
  }

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        cursor: 'pointer',
        '&:hover .component-actions': { opacity: 1 },
        '&:hover': { 
          '& > *': { 
            border: '2px dashed var(--mui-palette-primary-main) !important' 
          } 
        }
      }}
      onClick={() => onSelect(component)}
    >
      {renderComponent()}
      <Box 
        className="component-actions"
        sx={{ 
          position: 'relative', 
          mt: 1,
          ml: 'auto',
          width: 'fit-content',
          opacity: 0, 
          transition: 'opacity 0.2s',
          display: 'flex',
          gap: 1
        }}
      >
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation()
            onSelect(component)
          }}
          sx={{ bgcolor: 'white', boxShadow: 1 }}
        >
          🎯
        </IconButton>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          sx={{ bgcolor: 'white', boxShadow: 1 }}
        >
          ✏️
        </IconButton>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          sx={{ bgcolor: 'white', boxShadow: 1 }}
        >
          🗑️
        </IconButton>
      </Box>
    </Box>
  )
}

export default EditableComponent