'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
// Material-UI Icons will be added later when package is available
// import VisibilityIcon from '@mui/icons-material/Visibility'
// import PublishIcon from '@mui/icons-material/Publish'
// import EditIcon from '@mui/icons-material/Edit'
import dynamic from 'next/dynamic'

const VisualEditor = dynamic(() => import('@components/editor/VisualEditor'), { ssr: false })

export default function DashboardEditorPage() {
  const params = useParams<{ id: string }>()
  const [json, setJson] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [editorMode, setEditorMode] = useState(0) // Single Visual Builder Mode
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])
  const [originalJson, setOriginalJson] = useState<any>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)

  useEffect(() => {
    // Load auth token from localStorage
    const token = localStorage.getItem('auth_token')
    setAuthToken(token)
  }, [])

  const apiHeaders = useMemo(() => {
    const headers: any = { 'Accept': 'application/json' }
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`
    return headers
  }, [authToken])

  useEffect(() => {
    const load = async () => {
      // Coba ambil by UUID dulu
      let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing/uuid/${params.id}`, { credentials: 'include', headers: apiHeaders })
      if (!res.ok) {
        // Fallback ke ID lama jika belum tersedia
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing/${params.id}`, { credentials: 'include', headers: apiHeaders })
      }
      if (res.status === 401) return // wait for session then retry
      const data = await res.json()
      const loadedData = data.data || data
      setJson(loadedData)
      setOriginalJson(loadedData)
      setUndoStack([loadedData])
    }
    if (params?.id && authToken) load()
  }, [params?.id, apiHeaders, authToken])

  // Undo functionality
  const handleUndo = () => {
    if (undoStack.length > 1) {
      const newUndoStack = [...undoStack]
      const currentState = newUndoStack.pop()
      const previousState = newUndoStack[newUndoStack.length - 1]
      
      setRedoStack(prev => [...prev, currentState])
      setUndoStack(newUndoStack)
      setJson(previousState)
    }
  }

  // Redo functionality
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const newRedoStack = [...redoStack]
      const nextState = newRedoStack.pop()
      
      setUndoStack(prev => [...prev, nextState])
      setRedoStack(newRedoStack)
      setJson(nextState)
    }
  }

  // Reset to original
  const handleReset = () => {
    if (originalJson && confirm('Are you sure you want to reset to the original version? All changes will be lost.')) {
      setJson(originalJson)
      setUndoStack([originalJson])
      setRedoStack([])
    }
  }

  // Add to undo stack when JSON changes
  const updateJsonWithUndo = (newJson: any) => {
    setUndoStack(prev => [...prev, newJson])
    setRedoStack([]) // Clear redo stack when new changes are made
    setJson(newJson)
  }

  // View page in new tab
  const handleViewPage = () => {
    if (json?.html) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <title>Landing Page Preview</title>
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
              ${json.css || ''}
            </style>
          </head>
          <body>
            ${json.html}
          </body>
        </html>
      `
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    }
  }

  // Publish functionality (placeholder)
  const handlePublish = () => {
    alert('Publishing functionality will be implemented soon!')
  }

  const handleSave = async (dataToSave?: any) => {
    setSaving(true)
    const headers: any = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`
    
    const saveData = dataToSave || json
    
    try {
      // Coba update by UUID dulu
      let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing/uuid/${params.id}/update`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ data: saveData })
      })
      
      // Fallback ke ID lama jika UUID belum tersedia
      if (!response.ok) {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing/${params.id}/update`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ data: saveData })
        })
      }
      
      if (response.ok) {
        console.log('Save successful')
        setLastSaved(new Date())
      } else {
        console.error('Save failed:', response.status, response.statusText)
        alert('Failed to save changes. Please try again.')
      }
    } catch (error) {
      console.error('Save error:', error)
    }
    
    setSaving(false)
  }

  const updateSection = (idx: number, newSection: any) => {
    setJson((prev: any) => {
      const next = { ...(prev || {}), sections: [...(prev?.sections || [])] }
      next.sections[idx] = newSection
      return next
    })
  }

  const updateTextContent = (newText: string) => {
    // Update HTML content in json
    setJson((prev: any) => {
      const updatedHtml = prev?.html?.replace(/(<h[1-6][^>]*>)[^<]*(<\/h[1-6]>)/gi, `$1${newText}$2`)
                                    .replace(/(<p[^>]*>)[^<]*(<\/p>)/gi, `$1${newText}$2`)
      return { ...prev, html: updatedHtml }
    })
  }

  const addFeatureItem = (idx: number) => {
    const s = json.sections[idx]
    updateSection(idx, { ...s, items: [...(s.items || []), 'New feature'] })
  }

  const removeFeatureItem = (idx: number, itemIdx: number) => {
    const s = json.sections[idx]
    const items = [...(s.items || [])]
    items.splice(itemIdx, 1)
    updateSection(idx, { ...s, items })
  }

  // Drag sort handlers for right sidebar
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', String(index))
  }
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }
  const onDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = Number(e.dataTransfer.getData('text/plain'))
    if (isNaN(dragIndex)) return
    setJson((prev: any) => {
      const sections = [...(prev?.sections || [])]
      const [moved] = sections.splice(dragIndex, 1)
      sections.splice(dropIndex, 0, moved)
      return { ...(prev || {}), sections }
    })
  }

  const handleVisualEditorSave = async (visualData: any) => {
    console.log('Saving visual editor data:', visualData)
    // Convert visual editor data back to our JSON format
    const updatedJson = {
      ...json,
      visualComponents: visualData.components,
      // Use HTML from visual editor (includes inline edits)
      html: visualData.html || json.html,
      css: visualData.css || json.css,
      sections: visualData.sections || json.sections
    }
    console.log('Updated JSON:', updatedJson)
    
    // Call save with the updated data immediately
    await handleSave(updatedJson)
    
    // Update local state after successful save
    setJson(updatedJson)
  }

  const generateHTMLFromComponents = (components: any[]) => {
    return components.map(comp => {
      switch (comp.type) {
        case 'hero_header':
          return `<section class="hero-section relative min-h-screen flex items-center justify-center text-white" style="background: linear-gradient(135deg, rgba(0,0,0,0.6), rgba(37,99,235,0.3)), url(${comp.backgroundImage}) center/cover;"><div class="container mx-auto px-4 text-center"><h1 class="text-5xl md:text-6xl font-bold mb-6">${comp.headline}</h1><p class="text-xl md:text-2xl mb-8">${comp.subheadline}</p><a href="#contact" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg">${comp.ctaText}</a></div></section>`
        case 'text':
          return `<div class="py-4"><p class="text-lg text-gray-600">${comp.content}</p></div>`
        case 'dynamic_text':
          return `<div class="py-4"><h2 class="text-3xl font-bold text-gray-800">${comp.content}</h2></div>`
        case 'button':
          return `<div class="py-4"><a href="${comp.url}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg">${comp.text}</a></div>`
        case 'image':
          return `<div class="py-4"><img src="${comp.src}" alt="${comp.alt}" class="w-full h-auto rounded-lg shadow-lg"/></div>`
        default:
          return `<div class="py-4"><!-- ${comp.type} component --></div>`
      }
    }).join('')
  }

  return (
          <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Main Content */}
        <Container maxWidth="xl" sx={{ p: 2 }}>
          {/* Enhanced Header */}
          <Box sx={{ 
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3
          }}>
                     <CardHeader
             title="Landing Page Editor"
             sx={{
               pb: 2,
               display: 'flex',
               alignItems: 'center',
               '& .MuiCardHeader-content': {
                 display: 'flex',
                 alignItems: 'center'
               },
               '& .MuiCardHeader-title': {
                 fontSize: '1.25rem',
                 fontWeight: 600,
                 color: 'text.primary',
                 margin: 0
               },
               '& .MuiCardHeader-action': {
                 display: 'flex',
                 alignItems: 'center',
                 margin: 0,
                 alignSelf: 'center'
               }
             }}
             action={
               <Box sx={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: 2
               }}>
                 <Button 
                   startIcon={<i className="tabler-eye" />}
                   onClick={handleViewPage}
                   sx={{ 
                     color: 'text.primary',
                     borderColor: 'divider',
                     '&:hover': { 
                       borderColor: 'primary.main',
                       bgcolor: 'primary.lighterOpacity',
                       color: 'primary.main'
                     },
                     textTransform: 'none',
                     borderRadius: '8px'
                   }}
                   variant="outlined"
                   size="small"
                 >
                   View Page
                 </Button>
                 
                 <Button 
                   startIcon={<i className="tabler-rocket" />}
                   onClick={handlePublish}
                   color="success"
                   variant="contained"
                   size="small"
                   sx={{ 
                     fontWeight: 600,
                     textTransform: 'none',
                     borderRadius: '8px',
                     '&:hover': { 
                       transform: 'translateY(-1px)',
                       boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                     }
                   }}
                 >
                   Publish
                 </Button>
               </Box>
             }
           />
          <CardContent sx={{ pt: 0, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{
                bgcolor: 'warning.lighterOpacity',
                color: 'warning.dark',
                px: 1.5,
                py: 0.5,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: 'warning.lightOpacity',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <i className="tabler-info-circle" style={{ fontSize: '14px' }} />
                                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '11px' }}>
                    Click elements to edit • Drag components to add • ALT+Drag to reorder • DELETE key to remove • Responsive design
                  </Typography>
              </Box>
              {lastSaved && (
                <Chip 
                  label={`Auto-saved: ${lastSaved.toLocaleTimeString()}`}
                  size="small"
                  sx={{ 
                    bgcolor: 'success.lighterOpacity', 
                    color: 'success.main',
                    border: '1px solid',
                    borderColor: 'success.lightOpacity',
                    '& .MuiChip-label': { fontSize: '11px', fontWeight: 500 }
                  }}
                />
              )}
            </Box>
          </CardContent>
        </Box>
        {!json ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                Loading…
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <VisualEditor 
              initialData={{ 
                components: json.visualComponents || [],
                sections: json.sections || [],
                html: json.html || '',
                css: json.css || ''
              }}
              onSave={handleVisualEditorSave}
              onManualSave={handleSave}
              saving={saving}
              lastSaved={lastSaved}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onReset={handleReset}
              canUndo={undoStack.length > 1}
              canRedo={redoStack.length > 0}
            />
          </Card>
        )}
      </Container>
    </Box>
  )
}


