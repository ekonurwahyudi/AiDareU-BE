'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'

import TextField from '@mui/material/TextField'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Slider from '@mui/material/Slider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Collapse from '@mui/material/Collapse'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { RgbaColorPicker, HexColorInput } from 'react-colorful'

import CustomIconButton from '@core/components/mui/IconButton'
import TiptapEditor from './TiptapEditor'

// Using emoji icons for now - Material-UI icons package needs to be installed
// import EditIcon from '@mui/icons-material/Edit'
// ... other icon imports can be added later when package is available

// TypeScript interfaces for data structures
interface Store {
  uuid: string
  name: string
  subdomain: string
  domain?: string
  is_active: boolean
}

interface Domain {
  id: string
  domain?: string
  subdomain?: string
  store_uuid: string
}

interface PixelStore {
  uuid: string
  pixel_type: string
  nama_pixel: string
  pixel_id: string
  convention_event: string
  is_active: boolean
}

interface PageData {
  nama_halaman: string
  title_tag?: string
  slug: string
  store_uuid: string
  domain?: string
  subdomain?: string
  favicon?: File | null
  logo?: File | null
  meta_description: string
  keywords: string
  meta_image?: File | null
  facebook_pixel_uuid?: string
  tiktok_pixel_uuid?: string
  google_tag_manager_uuid?: string
}

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

// Modern Draggable Component Items
const DraggableComponent = ({ type, label, icon, onAdd }: { type: string; label: string; icon: string; onAdd: (type: string) => void }) => {
  return (
    <Card 
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('component-type', type);
        e.dataTransfer.setData('component-label', label);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => onAdd(type)}
      sx={{ 
        mb: 1.5, 
        cursor: 'grab',
        border: '2px solid transparent',
        borderRadius: 2,
        background: 'background.paper',
        boxShadow: '0 2px 8px rgba(115, 103, 240, 0.08)',
        '&:hover': { 
          boxShadow: '0 8px 25px rgba(115, 103, 240, 0.15)',
          transform: 'translateY(-2px)',
          borderColor: 'primary.main',
          background: 'primary.lighterOpacity'
        },
        '&:active': {
          cursor: 'grabbing',
          transform: 'translateY(-1px)'
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <CardContent sx={{ p: 2, textAlign: 'center' }}>
        <Box sx={{ 
          mb: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'primary.main',
          fontSize: '24px',
          transition: 'all 0.2s ease',
          '&:hover': {
            color: 'primary.dark',
            transform: 'scale(1.1)'
          }
        }}>
          <i className={icon} />
        </Box>
        <Typography variant="body2" sx={{ 
          fontWeight: 600,
          color: 'text.primary',
          fontSize: '11px',
          lineHeight: 1.3
        }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ 
          fontSize: '9px', 
          color: 'text.secondary',
          display: 'block',
          mt: 0.3,
          fontStyle: 'italic'
        }}>
          Click or drag
        </Typography>
      </CardContent>
    </Card>
  )
}

// Canvas Area for Components
const Canvas = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  // Enable pan/drag of the whole canvas like Notion/Elementor (space+drag)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = containerRef.current

    if (!el) return
    let isPanning = false
    let startX = 0, startY = 0
    let scrollLeft = 0, scrollTop = 0

    const down = (e: MouseEvent) => {
      const isSpace = (e as any).buttons === 1 && (e as any).which === 1 && (e as any).shiftKey === false && (e as any).altKey === false && (e as any).ctrlKey === false && (e as any).metaKey === false && (e as any).button === 0 && (e as any)

      if ((e as any).target instanceof HTMLElement && (e as any).target.tagName === 'IFRAME') return

      if ((e as any).buttons === 1 && (e as any).button === 0 && (e as any).shiftKey) { // hold Shift to pan
        isPanning = true
        startX = e.clientX
        startY = e.clientY
        scrollLeft = el.scrollLeft
        scrollTop = el.scrollTop
        el.style.cursor = 'grabbing'
      }
    }

    const move = (e: MouseEvent) => {
      if (!isPanning) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      el.scrollLeft = scrollLeft - dx
      el.scrollTop = scrollTop - dy
    }

    const up = () => { isPanning = false; el.style.cursor = 'default' }

    el.addEventListener('mousedown', down)
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseup', up)

    
return () => {
      el.removeEventListener('mousedown', down)
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseup', up)
    }
  }, [])

  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{ 
        width: '100%',
        minHeight: '80vh',
        border: '2px dashed #e0e0e0',
        borderRadius: 2,
        p: 2,
        position: 'relative',
        background: '#fafafa',
        overflow: 'auto',
        cursor: 'default'
      }}
    >
      {children}
    </Box>
  )
}

// Editable Component
const EditableComponent = ({ component, onUpdate, onDelete, onSelect }: { component: any; onUpdate: (data: any) => void; onDelete: () => void; onSelect: (component: any) => void }) => {
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

interface VisualEditorProps {
  initialData?: {
    components?: any[]
    sections?: any[]
    html?: string
    css?: string
  }
  onSave?: (data: any) => void
  onManualSave?: (data?: any) => void
  saving?: boolean
  lastSaved?: Date | null
  onUndo?: () => void
  onRedo?: () => void
  onReset?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

export default function VisualEditor({ initialData, onSave, onManualSave, saving, lastSaved, onUndo, onRedo, onReset, canUndo, canRedo }: VisualEditorProps) {
  const [components, setComponents] = useState(initialData?.components || [])
  const [sections, setSections] = useState(initialData?.sections || [])
  const [selectedTab, setSelectedTab] = useState(0) // 0: Components, 1: Properties, 2: Outline
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [selectedComponent, setSelectedComponent] = useState<any>(null)
  const [editedHtml, setEditedHtml] = useState(initialData?.html || '<div style="text-align: center; padding: 40px; color: #6b7280; border: 2px dashed #e0e0e0; border-radius: 8px; margin: 20px;"><h2>Welcome to Visual Editor</h2><p>Start by adding components from the sidebar</p></div>')
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const [selectedElementVersion, setSelectedElementVersion] = useState(0)
  const [lastScrollPosition, setLastScrollPosition] = useState({ top: 0, left: 0 })
  const [elementTree, setElementTree] = useState<any[]>([])
  const [draggedElement, setDraggedElement] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop')
  const [isUpdatingContent, setIsUpdatingContent] = useState(false) // Track content updates
  // Local history for Undo/Redo inside the canvas (HTML snapshots)
  const [htmlHistory, setHtmlHistory] = useState<string[]>([initialData?.html || ''])
  const [historyIndex, setHistoryIndex] = useState<number>(0)
  const applyingHistoryRef = useRef<boolean>(false)

  // Original snapshot (first mount) for hard reset
  const originalSnapshotRef = useRef<string>(initialData?.html || '')
  
  // Real-time element outline tracking
  const [elementOutline, setElementOutline] = useState<any[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  
  // Accordion state management for Pengaturan tab
  const [expandedAccordion, setExpandedAccordion] = useState<string>('website') // Default expanded is 'website'
  
  // Page settings state
  const [pageSettings, setPageSettings] = useState({
    pageName: '',
    titleTag: '',
    slugUrl: '',
    selectedStore: '',
    selectedDomain: '',
    favicon: null as File | null,
    logo: null as File | null,
    metaDescription: '',
    keywords: '',
    metaImage: null as File | null,
    facebookPixel: '',
    tiktokPixel: '',
    googleTagManager: ''
  })

  // Data loading states
  const [stores, setStores] = useState<Store[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [pixels, setPixels] = useState<PixelStore[]>([])

  const [loading, setLoading] = useState({
    stores: false,
    domains: false,
    pixels: false,
    pageData: false
  })

  const [errors, setErrors] = useState<string[]>([])

  // Data loading functions
  const loadStores = async () => {
    try {
      setLoading(prev => ({ ...prev, stores: true }))
      setErrors([])
      
      const response = await fetch('/api/public/stores', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load stores')
      }
      
      const data = await response.json()

      // Handle the specific response format from public stores API
      const stores = data.stores || data.data || data || []

      setStores(stores)
    } catch (error) {
      console.error('Error loading stores:', error)
      setErrors(prev => [...prev, 'Failed to load stores'])
    } finally {
      setLoading(prev => ({ ...prev, stores: false }))
    }
  }

  const loadDomains = async (storeUuid: string) => {
    if (!storeUuid) {
      setDomains([])
      
return
    }

    try {
      setLoading(prev => ({ ...prev, domains: true }))
      
      // Find selected store to get domain info
      const selectedStore = stores.find(store => store.uuid === storeUuid)

      if (!selectedStore) return

      const domainList: Domain[] = []
      
      // Prioritize domain - if domain exists, only show that
      if (selectedStore.domain) {
        domainList.push({
          id: `domain-${selectedStore.uuid}`,
          domain: selectedStore.domain,
          store_uuid: selectedStore.uuid
        })
      } else if (selectedStore.subdomain) {
        // Only show subdomain if no domain exists
        domainList.push({
          id: `subdomain-${selectedStore.uuid}`,
          subdomain: selectedStore.subdomain,
          store_uuid: selectedStore.uuid
        })
      }
      
      setDomains(domainList)
    } catch (error) {
      console.error('Error loading domains:', error)
      setErrors(prev => [...prev, 'Failed to load domains'])
    } finally {
      setLoading(prev => ({ ...prev, domains: false }))
    }
  }

  const loadPixels = async (storeUuid: string) => {
    if (!storeUuid) {
      setPixels([])
      
return
    }

    try {
      setLoading(prev => ({ ...prev, pixels: true }))
      
      const response = await fetch(`/api/public/pixel-stores?store_uuid=${storeUuid}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load pixels')
      }
      
      const data = await response.json()

      setPixels(data.data || [])
    } catch (error) {
      console.error('Error loading pixels:', error)
      setErrors(prev => [...prev, 'Failed to load pixels'])
    } finally {
      setLoading(prev => ({ ...prev, pixels: false }))
    }
  }

  const loadPageData = async (pageId?: string) => {
    if (!pageId) return

    try {
      setLoading(prev => ({ ...prev, pageData: true }))
      
      const response = await fetch(`/api/landing-pages/${pageId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load page data')
      }
      
      const data = await response.json()
      const pageData = data.data
      
      // Update page settings with loaded data
      setPageSettings(prev => ({
        ...prev,
        pageName: pageData.nama_halaman || '',
        titleTag: pageData.title_tag || '',
        slugUrl: pageData.slug || '',
        selectedStore: pageData.store_uuid || '',
        selectedDomain: pageData.domain || pageData.subdomain || '',
        metaDescription: pageData.meta_description || '',
        keywords: pageData.keywords || '',
        facebookPixel: pageData.facebook_pixel_uuid || '',
        tiktokPixel: pageData.tiktok_pixel_uuid || '',
        googleTagManager: pageData.google_tag_manager_uuid || ''
      }))
      
    } catch (error) {
      console.error('Error loading page data:', error)
      setErrors(prev => [...prev, 'Failed to load page data'])
    } finally {
      setLoading(prev => ({ ...prev, pageData: false }))
    }
  }

  // Load initial data on component mount
  useEffect(() => {
    loadStores()
    
    // Load page data if editing existing page
    const urlParams = new URLSearchParams(window.location.search)
    const pageId = urlParams.get('id')

    if (pageId) {
      loadPageData(pageId)
    }
  }, [])

  // Load domains when store selection changes
  useEffect(() => {
    if (pageSettings.selectedStore) {
      loadDomains(pageSettings.selectedStore)
      loadPixels(pageSettings.selectedStore)
    } else {
      setDomains([])
      setPixels([])
      setPageSettings(prev => ({
        ...prev,
        selectedDomain: ''
      }))
    }
  }, [pageSettings.selectedStore])

  // Auto-select domain when domains are loaded and store is selected
  useEffect(() => {
    if (pageSettings.selectedStore && domains.length > 0) {
      const selectedStore = stores.find(store => store.uuid === pageSettings.selectedStore)

      if (selectedStore && domains.length === 1) {
        // Auto-select the first (and only) domain option
        setPageSettings(prev => ({
          ...prev,
          selectedDomain: domains[0].id
        }))
      }
    }
  }, [pageSettings.selectedStore, domains, stores])
  
  // Auto-select store if user only has one store
  useEffect(() => {
    if (stores.length === 1 && !pageSettings.selectedStore) {
      setPageSettings(prev => ({
        ...prev,
        selectedStore: stores[0].uuid
      }))
    }
  }, [stores, pageSettings.selectedStore])
  
  // Handle accordion expand/collapse - only one can be expanded at a time
  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : '')
  }
  
  // Note: Store and domain data state declarations are above with proper TypeScript interfaces
  
  // Expanded outline items
  const [expandedOutlineItems, setExpandedOutlineItems] = useState<Set<string>>(new Set())
  
  // Unified Color Editor state (solid + gradient + alpha)
  const [colorEditorTab, setColorEditorTab] = useState<'solid' | 'gradient'>('solid')
  const [solidColor, setSolidColor] = useState<{ r: number; g: number; b: number; a: number }>({ r: 239, g: 64, b: 67, a: 1 })

  const [gradientStops, setGradientStops] = useState<Array<{ id: string; color: { r: number; g: number; b: number; a: number }; position: number }>>([
    { id: 'g1', color: { r: 239, g: 64, b: 67, a: 1 }, position: 0 },
    { id: 'g2', color: { r: 244, g: 63, b: 94, a: 1 }, position: 100 }
  ])

  const [activeStopId, setActiveStopId] = useState<string>('g1')
  const [gradientAngle, setGradientAngle] = useState<number>(135)
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear')

  // Helpers for color formatting
  const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v))
  const rgbaToCss = (c: { r: number; g: number; b: number; a?: number }) => `rgba(${clamp(0, 255, Math.round(c.r))}, ${clamp(0, 255, Math.round(c.g))}, ${clamp(0, 255, Math.round(c.b))}, ${clamp(0, 1, typeof c.a === 'number' ? c.a : 1)})`

  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (n: number) => clamp(0, 255, Math.round(n)).toString(16).padStart(2, '0').toUpperCase()

    
return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const s = hex.trim().replace('#', '')

    if (s.length !== 6) return null
    const r = parseInt(s.slice(0, 2), 16)
    const g = parseInt(s.slice(2, 4), 16)
    const b = parseInt(s.slice(4, 6), 16)

    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
    
return { r, g, b }
  }

  const applySolid = (c: { r: number; g: number; b: number; a: number }) => {
    if (!selectedElement?.style) return
    const css = rgbaToCss(c)

    selectedElement.style.backgroundColor = css as any
    selectedElement.style.background = ''
    selectedElement.style.backgroundImage = ''
    setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML)
  }

  const applyGradient = (stops = gradientStops, angle = gradientAngle, type = gradientType) => {
    if (!selectedElement?.style) return
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    const stopsCss = sorted.map(s => `${rgbaToCss(s.color)} ${clamp(0, 100, s.position)}%`).join(', ')
    const css = type === 'linear' ? `linear-gradient(${angle}deg, ${stopsCss})` : `radial-gradient(circle at center, ${stopsCss})`

    selectedElement.style.background = css as any
    selectedElement.style.backgroundImage = ''
    selectedElement.style.backgroundColor = ''
    setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML)
  }
  
  // Function to clean editor-specific styling for view page
  const cleanHtmlForViewing = (html: string): string => {
    // Remove editor-component class and any editor-specific styling
    return html
      .replace(/class="[^"]*editor-component[^"]*"/g, '')
      .replace(/class="editor-component"/g, '')
      .replace(/editor-component\s*/g, '')

      // Remove empty class attributes
      .replace(/class=""/g, '')
      .replace(/class="\s*"/g, '')
  }
  
  // Auto-update outline when HTML changes
  useEffect(() => {
    if (editedHtml) {
      const timer = setTimeout(() => {
        updateElementOutline();
      }, 300);

      
return () => clearTimeout(timer);
    }
  }, [editedHtml]);

  // Cleanup function for object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup any created object URLs when component unmounts
      if (pageSettings.favicon) {
        const url = URL.createObjectURL(pageSettings.favicon)

        URL.revokeObjectURL(url)
      }

      if (pageSettings.logo) {
        const url = URL.createObjectURL(pageSettings.logo)

        URL.revokeObjectURL(url)
      }

      if (pageSettings.metaImage) {
        const url = URL.createObjectURL(pageSettings.metaImage)

        URL.revokeObjectURL(url)
      }
    }
  }, [pageSettings.favicon, pageSettings.logo, pageSettings.metaImage])

  // Auto-generate slug from page name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()

      // Replace Indonesian characters
      .replace(/[àáäâèéëêìíïîòóöôùúüûñç]/g, (match) => {
        const map: { [key: string]: string } = {
          'à': 'a', 'á': 'a', 'ä': 'a', 'â': 'a',
          'è': 'e', 'é': 'e', 'ë': 'e', 'ê': 'e',
          'ì': 'i', 'í': 'i', 'ï': 'i', 'î': 'i',
          'ò': 'o', 'ó': 'o', 'ö': 'o', 'ô': 'o',
          'ù': 'u', 'ú': 'u', 'ü': 'u', 'û': 'u',
          'ñ': 'n', 'ç': 'c'
        }

        
return map[match] || match
      })
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  // Handle page name change and auto-generate slug
  const handlePageNameChange = (name: string) => {
    const newSlug = generateSlug(name)

    setPageSettings(prev => ({
      ...prev,
      pageName: name,
      slugUrl: newSlug,

      // Set titleTag to pageName if titleTag is empty
      titleTag: prev.titleTag || name
    }))
  }

  // Get preview URL based on selected store and domain
  const getPreviewUrl = () => {
    if (!pageSettings.selectedStore || !pageSettings.slugUrl) return ''
    
    const selectedStore = stores.find(store => store.uuid === pageSettings.selectedStore)

    if (!selectedStore) return ''
    
    // Use domain if available, otherwise use subdomain
    if (selectedStore.domain) {
      return `https://${selectedStore.domain}/${pageSettings.slugUrl}`
    } else if (selectedStore.subdomain) {
      return `https://${selectedStore.subdomain}.aidareu.com/${pageSettings.slugUrl}`
    }
    
    return ''
  }

  // Get full page URL for Google Search preview
  const getFullPageUrl = () => {
    if (!pageSettings.selectedStore || !pageSettings.slugUrl) return 'https://example.com/page'
    
    const selectedStore = stores.find(store => store.uuid === pageSettings.selectedStore)

    if (!selectedStore) return 'https://example.com/page'
    
    // Use domain if available, otherwise use subdomain
    if (selectedStore.domain) {
      return `https://${selectedStore.domain}/${pageSettings.slugUrl}`
    } else if (selectedStore.subdomain) {
      return `https://${selectedStore.subdomain}.aidareu.com/${pageSettings.slugUrl}`
    }
    
    return 'https://example.com/page'
  }

  // File upload validation
  const validateImageFile = (file: File, maxSize = 2) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSizeBytes = maxSize * 1024 * 1024 // Convert MB to bytes
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      
return false
    }
    
    if (file.size > maxSizeBytes) {
      alert(`File size must be less than ${maxSize}MB`)
      
return false
    }
    
    return true
  }

  // Push to local undo history whenever editedHtml changes (user edits)
  useEffect(() => {
    if (applyingHistoryRef.current) return
    setHtmlHistory(prev => {
      const current = prev[historyIndex]

      if (current === editedHtml) return prev
      const next = prev.slice(0, historyIndex + 1)

      next.push(editedHtml)
      setHistoryIndex(next.length - 1)
      
return next
    })

    // Keep parent informed (so server-side autosave & external buttons still reflect)
    onSave?.({ components: [], sections: [], html: editedHtml, css: initialData?.css || '' })
  }, [editedHtml])

  const applyHtmlToIframe = (html: string) => {
    const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement

    if (iframe?.contentWindow) {
      // Save current scroll position before applying HTML
      setLastScrollPosition({
        top: iframe.contentWindow.scrollY || 0,
        left: iframe.contentWindow.scrollX || 0
      });
    }

    setEditedHtml(html)

    if (iframe?.contentDocument) {
      iframe.contentDocument.body.innerHTML = html
      updateElementOutline()
    }
  }

  const handleLocalUndo = () => {
    if (historyIndex <= 0) return
    applyingHistoryRef.current = true
    const newIndex = historyIndex - 1

    setHistoryIndex(newIndex)
    const html = htmlHistory[newIndex]

    applyHtmlToIframe(html)
    applyingHistoryRef.current = false
    onUndo?.()
  }

  const handleLocalRedo = () => {
    if (historyIndex >= htmlHistory.length - 1) return
    applyingHistoryRef.current = true
    const newIndex = historyIndex + 1

    setHistoryIndex(newIndex)
    const html = htmlHistory[newIndex]

    applyHtmlToIframe(html)
    applyingHistoryRef.current = false
    onRedo?.()
  }

  const handleLocalReset = () => {
    applyingHistoryRef.current = true
    const html = originalSnapshotRef.current || ''

    applyHtmlToIframe(html)
    setHtmlHistory([html])
    setHistoryIndex(0)
    applyingHistoryRef.current = false
    onReset?.()
  }
  
  // Auto-save when content changes
  useEffect(() => {
    if (editedHtml || components.length > 0) {
      const timer = setTimeout(() => {
        let htmlToSave = editedHtml && editedHtml.trim() !== '' ? editedHtml : generateHTMLFromData(components, sections)
        
        // Clean HTML for viewing (remove editor-specific styling)
        htmlToSave = cleanHtmlForViewing(htmlToSave)
        
        const data = { 
          components, 
          sections,
          html: htmlToSave,
          css: initialData?.css || generateCSSFromData(components, sections)
        }

        onSave?.(data)
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [editedHtml, components, sections]);
  
  // Update iframe content when editedHtml changes without scroll interference
  useEffect(() => {
    const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

    if (iframe && iframe.contentDocument && editedHtml) {
      const doc = iframe.contentDocument;

      if (doc.body && doc.body.innerHTML !== editedHtml) {
        // Add basic styles to iframe body
        doc.head.innerHTML = `
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <style>
            ${(initialData && (initialData as any).css) ? (initialData as any).css : ''}
            body { 
              margin: 0; 
              padding: 0; 
              font-family: system-ui;
            }
            .editor-component {
              border: 2px dashed #e0e0e0 !important;
              border-radius: 8px !important;
            }
            .editor-component:hover {
              border-color: #3b82f6 !important;
            }
            .selected-element {
              outline: 2px solid #8b5cf6 !important;
              outline-offset: 2px !important;
              background-color: rgba(139, 92, 246, 0.05) !important;
            }
            /* Ensure images display properly without transparency grid */
            img {
              max-width: 100%;
              height: auto;
              display: block;
              background: transparent !important;
            }
            /* Full width images */
            .editor-component[data-component-type="full_width_image"] {
              width: 100% !important;
              margin: 20px 0 !important;
              padding: 0 !important;
            }
            .editor-component[data-component-type="full_width_image"] img {
              width: 100% !important;
              height: auto !important;
              object-fit: cover;
              border-radius: 0;
            }
            /* Regular images */
            .editor-component[data-component-type="image"] img {
              max-width: 100%;
              height: auto;
            }
          </style>
        `;
        
        // Update content without any scroll manipulation
        doc.body.innerHTML = editedHtml;
        
        updateElementOutline();
      }
    }
  }, [editedHtml]);

  // Re-attach handles after updates so properties panel sees latest values
  useEffect(() => {
    const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

    if (iframe && iframe.contentDocument) {
      const doc = iframe.contentDocument;
      const curr = doc.querySelector('.selected-element') as HTMLElement | null;

      if (curr) {
        // Ensure inline styles reflect layout box
        const rect = curr.getBoundingClientRect();

        (curr as any).style.width = rect.width + 'px';
        (curr as any).style.height = rect.height + 'px';
      }
    }
  }, [selectedElementVersion]);
  
  const addNewSection = () => {
    const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

    if (iframe?.contentDocument) {
      const doc = iframe.contentDocument;
      const newContainer = doc.createElement('div');

      newContainer.className = 'editor-container';
      newContainer.innerHTML = '<h2>New Container</h2><p>Click to edit content or drag components here</p>';
      newContainer.style.padding = '40px 20px';
      newContainer.style.margin = '20px 0';
      newContainer.style.border = '2px dashed #ccc';
      newContainer.style.borderRadius = '8px';
      newContainer.style.minHeight = '150px';
      doc.body.appendChild(newContainer);
      setEditedHtmlWithScrollPreservation(doc.body.innerHTML);
      updateElementOutline();
    }
  };
  
  const updateElementOutline = () => {
    const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

    if (iframe?.contentDocument) {
      const doc = iframe.contentDocument;
      const body = doc.body;
      const outline: any[] = [];
      
      // Parse body children as main sections
      Array.from(body.children).forEach((child: any, index) => {
        if (child.tagName && !child.classList.contains('element-controls')) {
          const section = {
            id: `section-${index}`,
            element: child,
            tagName: child.tagName.toLowerCase(),
            textContent: getElementPreview(child),
            isSection: ['section', 'div', 'article', 'aside', 'header', 'footer'].includes(child.tagName.toLowerCase()),
            children: [] as any[]
          };
          
          // Parse children elements
          Array.from(child.children).forEach((grandChild: any, childIndex) => {
            if (grandChild.tagName && !grandChild.classList.contains('element-controls')) {
              section.children.push({
                id: `element-${index}-${childIndex}`,
                element: grandChild,
                tagName: grandChild.tagName.toLowerCase(),
                textContent: getElementPreview(grandChild),
                isSection: false,
                parentSection: section
              });
            }
          });
          
          outline.push(section);
        }
      });
      
      setElementOutline(outline);
      
      // Auto-expand sections with children on first load
      if (expandedSections.size === 0) {
        const newExpanded = new Set<string>();

        outline.forEach(section => {
          if (section.children.length > 0) {
            newExpanded.add(section.id);
          }
        });
        setExpandedSections(newExpanded);
      }
    }
  };
  
  const getElementPreview = (element: any) => {
    const text = element.textContent?.replace(/\s+/g, ' ').trim() || '';

    if (text.length > 30) {
      return text.substring(0, 30) + '...';
    }

    
return text || element.tagName.toLowerCase();
  };
  
  const getElementIcon = (tagName: string) => {
    const icons: any = {
      'section': '📦',
      'div': '📦', 
      'header': '🔝',
      'footer': '🔗',
      'h1': 'T', 'h2': 'T', 'h3': 'T', 'h4': 'T', 'h5': 'T', 'h6': 'T',
      'p': 'T',
      'img': '🖼️',
      'a': '🔗',
      'button': '🔘',
      'span': 'T',
      'article': '📄',
      'aside': '📋'
    };

    
return icons[tagName] || '📦';
  };

  const toggleSectionExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);

    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }

    setExpandedSections(newExpanded);
  };

  const handleElementAction = (element: any, action: 'select' | 'duplicate' | 'delete') => {
    const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

    if (iframe?.contentDocument) {
      const doc = iframe.contentDocument;
      const targetElement = element.element;
      
      switch(action) {
        case 'select':
          // Clear previous selections
          doc.querySelectorAll('.selected-element').forEach((el: any) => {
            el.classList.remove('selected-element');
          });

          // Select element
          targetElement.classList.add('selected-element');
          setSelectedElement(targetElement);
          setSelectedTab(1); // Switch to Design/Properties tab
          break;
          
        case 'duplicate':
          const clone = targetElement.cloneNode(true);

          // Remove any controls from clone
          const controls = clone.querySelectorAll('.element-controls');

          controls.forEach((control: any) => control.remove());
          
          targetElement.parentNode.insertBefore(clone, targetElement.nextSibling);
          setEditedHtmlWithScrollPreservation(doc.body.innerHTML);
          break;
          
        case 'delete':
          if (confirm(`Delete ${element.tagName.toUpperCase()} element?`)) {
            targetElement.remove();
            setEditedHtmlWithScrollPreservation(doc.body.innerHTML);


            // Clear selection if deleted element was selected
            if (selectedElement === targetElement) {
              setSelectedElement(null);
            }
          }

          break;
      }
    }
  };
  
  const handleElementDrag = (element: any, targetElement: any, position: 'before' | 'after' | 'inside') => {
    const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

    if (iframe?.contentDocument && element.element && targetElement.element) {
      const doc = iframe.contentDocument;
      const draggedEl = element.element;
      const targetEl = targetElement.element;
      
      // Remove from current position
      draggedEl.remove();
      
      // Insert at new position
      if (position === 'before') {
        targetEl.parentNode.insertBefore(draggedEl, targetEl);
      } else if (position === 'after') {
        targetEl.parentNode.insertBefore(draggedEl, targetEl.nextSibling);
      } else if (position === 'inside') {
        targetEl.appendChild(draggedEl);
      }
      
      setEditedHtmlWithScrollPreservation(doc.body.innerHTML);
      updateElementOutline();
    }
  };
  
  const renderElementOutline = () => {
    return elementOutline.map((section, sectionIndex) => {
      const isExpanded = expandedSections.has(section.id);
      
      return (
        <Box key={section.id} sx={{ mb: 1 }}>
          {/* Section Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              bgcolor: selectedElement === section.element ? 'rgba(139, 92, 246, 0.1)' : 'white',
              '&:hover': {
                bgcolor: 'rgba(139, 92, 246, 0.05)',
                borderColor: '#8b5cf6',
                '& .element-actions': { opacity: 1 }
              }
            }}
          >
            {/* Expand/Collapse Button */}
            <Box
              onClick={(e) => {
                e.stopPropagation();

                if (section.children.length > 0) {
                  toggleSectionExpanded(section.id);
                }
              }}
              sx={{
                fontSize: '12px',
                color: '#8b5cf6',
                minWidth: '16px',
                cursor: section.children.length > 0 ? 'pointer' : 'default',
                userSelect: 'none'
              }}
            >
              {section.children.length > 0 ? (isExpanded ? '▼' : '▶') : ''}
            </Box>
            
            {/* Drag Handle */}
            <Box
              draggable
              onDragStart={() => setDraggedElement(section)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();

                if (draggedElement && draggedElement.id !== section.id) {
                  handleElementDrag(draggedElement, section, 'before');
                }

                setDraggedElement(null);
              }}
              sx={{ fontSize: '10px', color: '#ccc', cursor: 'move', minWidth: '16px' }}
            >
              ⋮⋮
            </Box>
            
            {/* Element Icon */}
            <Box sx={{ fontSize: '14px', minWidth: '20px' }}>
              {getElementIcon(section.tagName)}
            </Box>
            
            {/* Element Info */}
            <Box
              onClick={() => {
                setSelectedElement(section.element);
                setSelectedTab(1);
              }}
              sx={{ flex: 1, fontSize: '13px', cursor: 'pointer' }}
            >
              <Box sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                {section.tagName.toUpperCase()}
                {section.children.length > 0 && (
                  <span style={{ fontSize: '10px', color: '#999', marginLeft: '8px' }}>
                    ({section.children.length} children)
                  </span>
                )}
              </Box>
              <Box sx={{ fontSize: '11px', color: '#666', mt: 0.5 }}>
                {section.textContent}
              </Box>
            </Box>
            
            {/* Action Buttons */}
            <Box 
              className="element-actions"
              sx={{ 
                display: 'flex', 
                gap: 0.5, 
                opacity: 0, 
                transition: 'opacity 0.2s',
                alignItems: 'center'
              }}
            >
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleElementAction(section, 'select');
                }}
                sx={{ 
                  minWidth: '24px', 
                  width: '24px', 
                  height: '24px', 
                  fontSize: '10px',
                  bgcolor: '#8b5cf6',
                  color: 'white',
                  '&:hover': { bgcolor: '#7c3aed' }
                }}
              >
                🎯
              </Button>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleElementAction(section, 'duplicate');
                }}
                sx={{ 
                  minWidth: '24px', 
                  width: '24px', 
                  height: '24px', 
                  fontSize: '10px',
                  bgcolor: '#059669',
                  color: 'white',
                  '&:hover': { bgcolor: '#047857' }
                }}
              >
                📋
              </Button>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleElementAction(section, 'delete');
                }}
                sx={{ 
                  minWidth: '24px', 
                  width: '24px', 
                  height: '24px', 
                  fontSize: '10px',
                  bgcolor: '#dc2626',
                  color: 'white',
                  '&:hover': { bgcolor: '#b91c1c' }
                }}
              >
                🗑️
              </Button>
            </Box>
          </Box>
          
          {/* Section Children - Only show if expanded */}
          {isExpanded && section.children.map((child: any, childIndex: number) => (
            <Box
              key={child.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                ml: 4,
                border: '1px solid #f0f0f0',
                borderRadius: 1,
                bgcolor: selectedElement === child.element ? 'rgba(139, 92, 246, 0.1)' : '#fafafa',
                '&:hover': {
                  bgcolor: 'rgba(139, 92, 246, 0.05)',
                  borderColor: '#8b5cf6',
                  '& .element-actions': { opacity: 1 }
                }
              }}
            >
              {/* Spacer for alignment */}
              <Box sx={{ minWidth: '16px' }}></Box>
              
              {/* Drag Handle */}
              <Box
                draggable
                onDragStart={() => setDraggedElement(child)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();

                  if (draggedElement && draggedElement.id !== child.id) {
                    handleElementDrag(draggedElement, child, 'before');
                  }

                  setDraggedElement(null);
                }}
                sx={{ fontSize: '8px', color: '#ddd', cursor: 'move', minWidth: '12px' }}
              >
                ⋮⋮
              </Box>
              
              {/* Element Icon */}
              <Box sx={{ fontSize: '12px', minWidth: '18px' }}>
                {getElementIcon(child.tagName)}
              </Box>
              
              {/* Element Info */}
              <Box
                onClick={() => {
                  setSelectedElement(child.element);
                  setSelectedTab(1);
                }}
                sx={{ flex: 1, fontSize: '12px', cursor: 'pointer' }}
              >
                <Box sx={{ fontWeight: 'bold', color: '#666' }}>
                  {child.tagName.toUpperCase()}
                </Box>
                <Box sx={{ fontSize: '10px', color: '#999', mt: 0.5 }}>
                  {child.textContent}
                </Box>
              </Box>
              
              {/* Action Buttons for Children */}
              <Box 
                className="element-actions"
                sx={{ 
                  display: 'flex', 
                  gap: 0.5, 
                  opacity: 0, 
                  transition: 'opacity 0.2s',
                  alignItems: 'center'
                }}
              >
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleElementAction(child, 'select');
                  }}
                  sx={{ 
                    minWidth: '20px', 
                    width: '20px', 
                    height: '20px', 
                    fontSize: '8px',
                    bgcolor: '#8b5cf6',
                    color: 'white',
                    '&:hover': { bgcolor: '#7c3aed' }
                  }}
                >
                  🎯
                </Button>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleElementAction(child, 'duplicate');
                  }}
                  sx={{ 
                    minWidth: '20px', 
                    width: '20px', 
                    height: '20px', 
                    fontSize: '8px',
                    bgcolor: '#059669',
                    color: 'white',
                    '&:hover': { bgcolor: '#047857' }
                  }}
                >
                  📋
                </Button>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleElementAction(child, 'delete');
                  }}
                  sx={{ 
                    minWidth: '20px', 
                    width: '20px', 
                    height: '20px', 
                    fontSize: '8px',
                    bgcolor: '#dc2626',
                    color: 'white',
                    '&:hover': { bgcolor: '#b91c1c' }
                  }}
                >
                  🗑️
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      );
    });
  };
  
  const updateElementTree = () => {
    const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

    if (iframe?.contentDocument) {
      const doc = iframe.contentDocument;
      const elements = doc.querySelectorAll('div, section, header, footer, article, aside');

      const treeData = Array.from(elements).map((el: any, index) => ({
        id: `element-${index}`,
        element: el,
        tagName: el.tagName.toLowerCase(),
        textContent: el.textContent?.substring(0, 50) + (el.textContent?.length > 50 ? '...' : ''),
        classes: el.className,
        children: el.children.length
      }));

      setElementTree(treeData);
      
      // Update the element tree UI
      const treeContainer = document.getElementById('element-tree');

      if (treeContainer) {
        treeContainer.innerHTML = '';
        treeData.forEach((item, index) => {
          const elementCard = document.createElement('div');

          elementCard.style.cssText = `
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            background: white;
            cursor: pointer;
            transition: all 0.2s;
          `;
          
          elementCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: #8b5cf6;">${item.tagName}</strong>
                <span style="color: #666; font-size: 12px; margin-left: 8px;">${item.children} children</span>
                <div style="color: #999; font-size: 11px; margin-top: 4px;">${item.textContent}</div>
              </div>
              <div style="display: flex; gap: 4px;">
                <button data-action="select" data-index="${index}" style="background: #8b5cf6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Select</button>
                <button data-action="duplicate" data-index="${index}" style="background: #059669; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Copy</button>
                <button data-action="delete" data-index="${index}" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Delete</button>
              </div>
            </div>
          `;
          
          // Add event listeners for buttons
          elementCard.addEventListener('click', (e: any) => {
            const action = e.target.dataset.action;
            const index = e.target.dataset.index;

            if (action && index) {
              handleElementTreeAction(treeData[parseInt(index)], action);
            }
          });
          
          treeContainer.appendChild(elementCard);
        });
      }
    }
  };

  const handleElementTreeAction = (item: any, action: string) => {
    const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

    if (iframe?.contentDocument) {
      const doc = iframe.contentDocument;
      const element = item.element;
      
      switch(action) {
        case 'select':
          // Clear previous selections
          doc.querySelectorAll('.selected-element').forEach((el: any) => {
            el.classList.remove('selected-element');
          });

          // Select element
          element.classList.add('selected-element');
          setSelectedElement(element);
          setSelectedTab(1); // Switch to Properties tab
          break;
          
        case 'duplicate':
          const clone = element.cloneNode(true);

          element.parentNode.insertBefore(clone, element.nextSibling);
          setEditedHtmlWithScrollPreservation(doc.body.innerHTML);
          updateElementTree(); // Refresh tree
          break;
          
        case 'delete':
          if (confirm(`Delete ${item.tagName} element?`)) {
            element.remove();
            setEditedHtmlWithScrollPreservation(doc.body.innerHTML);
            updateElementTree(); // Refresh tree

            // Clear selection if deleted element was selected
            if (selectedElement === element) {
              setSelectedElement(null);
            }
          }

          break;
      }
    }
  };

  const standardComponents = [
    { type: COMPONENT_TYPES.TEXT, label: 'Text Block', icon: 'tabler-file-text' },
    { type: COMPONENT_TYPES.DYNAMIC_TEXT, label: 'Heading', icon: 'tabler-heading' },
    { type: COMPONENT_TYPES.BUTTON, label: 'Button', icon: 'tabler-square-rounded' },
    { type: COMPONENT_TYPES.IMAGE, label: 'Image', icon: 'tabler-photo' },
    { type: COMPONENT_TYPES.FULL_WIDTH_IMAGE, label: 'Cover Image', icon: 'tabler-photo-filled' },
    { type: COMPONENT_TYPES.VIDEO, label: 'Video', icon: 'tabler-video' },
    { type: COMPONENT_TYPES.CONTAINER, label: 'Container', icon: 'tabler-layout' },
    { type: COMPONENT_TYPES.GRID, label: 'Columns', icon: 'tabler-columns' },
    { type: 'divider', label: 'Divider', icon: 'tabler-separator-horizontal' },
    { type: 'spacer', label: 'Spacer', icon: 'tabler-space' }
  ]

  const layoutComponents = [
    { type: COMPONENT_TYPES.HERO_HEADER, label: 'Hero Header', icon: 'tabler-trophy' },
    { type: COMPONENT_TYPES.SPOTLIGHT_TEXT, label: 'Spotlight Text', icon: 'tabler-bulb' },
    { type: COMPONENT_TYPES.FEATURE_HIGHLIGHT, label: 'Feature Highlight', icon: 'tabler-star' }
  ]

  const businessComponents = [
    { type: 'contact_form', label: 'Contact Form', icon: 'tabler-mail' },
    { type: 'testimonial', label: 'Testimonial', icon: 'tabler-message-2' },
    { type: 'pricing_card', label: 'Pricing Card', icon: 'tabler-tag' },
    { type: 'team_member', label: 'Team Member', icon: 'tabler-user' },
    { type: 'faq', label: 'FAQ', icon: 'tabler-help' },
    { type: 'newsletter', label: 'Newsletter', icon: 'tabler-news' },
    { type: 'stats', label: 'Statistics', icon: 'tabler-chart-bar' },
    { type: 'features', label: 'Features Grid', icon: 'tabler-grid-dots' },
    { type: 'social_links', label: 'Social Links', icon: 'tabler-link' },
    { type: 'call_to_action', label: 'Call to Action', icon: 'tabler-speakerphone' }
  ]

  const handleAddComponent = useCallback((type: string, dropTarget?: HTMLElement) => {
    // Always add directly to iframe HTML so it merges with existing landing page
    
    // Otherwise, add directly to iframe HTML (new system)
    const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

    if (iframe?.contentDocument) {
      const doc = iframe.contentDocument;
      const newElement = createComponentElement(type);
      
      if (dropTarget && doc.body.contains(dropTarget)) {
        // Insert after the drop target
        dropTarget.parentNode?.insertBefore(newElement, dropTarget.nextSibling);
      } else {
        // Append to body if no specific target
        doc.body.appendChild(newElement);
      }
      
      // Update both HTML and components state
      const updatedHtml = doc.body.innerHTML;

      setEditedHtml(updatedHtml);
      
      // Force manual update of iframe if needed
      setTimeout(() => {
        const checkIframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

        if (checkIframe?.contentDocument) {
          const checkDoc = checkIframe.contentDocument;

          if (checkDoc.body.innerHTML !== updatedHtml) {
            checkDoc.body.innerHTML = updatedHtml;
          }
        }
      }, 100);

      // Do not push into components array to avoid placeholder canvas mode
    }
  }, [components])

  const createComponentElement = (type: string): HTMLElement => {
    const div = document.createElement('div');

    div.className = 'editor-component';
    div.dataset.componentType = type;
    div.style.cssText = 'margin: 10px; padding: 15px; min-height: 60px; position: relative; display: inline-block; max-width: 100%; vertical-align: top;';
    
    switch (type) {
      case COMPONENT_TYPES.TEXT:
        div.innerHTML = '<p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0;">Click to edit this text. You can add any content here and style it as needed.</p>';
        break;
      case COMPONENT_TYPES.DYNAMIC_TEXT:
        div.innerHTML = '<h2 style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">Dynamic Heading</h2><p style="color: #6b7280; margin: 0;">This is a subtitle that you can customize</p>';
        break;
      case COMPONENT_TYPES.BUTTON:
        div.innerHTML = '<div style="text-align: center; margin: 0;"><a href="#" style="display: inline-block; background: #3b82f6; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.2s; cursor: pointer;">Click Me</a></div>';
        break;
      case COMPONENT_TYPES.IMAGE:
        div.style.cssText = 'margin: 10px 0; padding: 0; min-height: 200px; position: relative; display: block; width: 100%;';
        div.innerHTML = '<img src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" alt="Click to replace image" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; cursor: pointer;" />';
        break;
      case COMPONENT_TYPES.FULL_WIDTH_IMAGE:
        div.style.cssText = 'margin: 20px 0; padding: 0; min-height: 300px; position: relative; display: block; width: 100%;';
        div.innerHTML = '<img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" alt="Full width cover image" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; cursor: pointer;" />';
        break;
      case COMPONENT_TYPES.VIDEO:
        div.innerHTML = '<div style="text-align: center; padding: 20px; border: 2px dashed #e0e0e0; border-radius: 8px; background: #f3f4f6;"><div style="position: relative; width: 100%; height: 200px; background: #e5e7eb; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;"><div style="font-size: 48px; color: #6b7280; margin-bottom: 10px;">▶️</div><div style="color: #6b7280; font-size: 16px; font-weight: 500;">Video Player</div><div style="color: #9ca3af; font-size: 14px; margin-top: 5px;">Click to add video URL</div></div></div>';
        break;
      case COMPONENT_TYPES.CONTAINER:
        div.innerHTML = '<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; text-align: center;"><h3 style="margin: 0 0 16px 0; color: #374151;">Container Section</h3><p style="margin: 0; color: #6b7280;">Drag other components into this container</p></div>';
        break;
      case COMPONENT_TYPES.GRID:
        div.innerHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;"><div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; color: #6b7280;">Column 1<br><small>Add content here</small></div><div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; color: #6b7280;">Column 2<br><small>Add content here</small></div></div>';
        break;
      case COMPONENT_TYPES.HERO_HEADER:
        div.style.margin = '0';
        div.style.padding = '80px 20px';
        div.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        div.style.color = 'white';
        div.style.textAlign = 'center';
        div.innerHTML = '<h1 style="font-size: 48px; font-weight: bold; margin: 0 0 20px 0;">Welcome to Our Service</h1><p style="font-size: 20px; margin: 0 0 30px 0; opacity: 0.9;">Transform your business with our amazing solutions</p><a href="#" style="display: inline-block; background: rgba(255,255,255,0.2); border: 2px solid white; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">Get Started</a>';
        break;
      case 'contact_form':
        div.innerHTML = '<form style="max-width: 500px; margin: 0 auto;"><h3 style="margin: 0 0 20px 0; color: #374151;">Contact Us</h3><input type="text" placeholder="Your Name" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #d1d5db; border-radius: 6px;"/><input type="email" placeholder="Email Address" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #d1d5db; border-radius: 6px;"/><textarea placeholder="Your Message" rows="4" style="width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #d1d5db; border-radius: 6px; resize: vertical;"></textarea><button type="submit" style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Send Message</button></form>';
        break;
      case 'testimonial':
        div.innerHTML = '<div style="max-width: 600px; margin: 0 auto; text-align: center;"><div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><p style="font-size: 18px; font-style: italic; margin: 0 0 20px 0; color: #374151;">"This service completely transformed our business. Highly recommended!"</p><div style="display: flex; align-items: center; justify-content: center; gap: 15px;"><img src="https://source.unsplash.com/60x60/?portrait" alt="Customer" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;"/><div><strong style="color: #374151;">John Smith</strong><br/><span style="color: #6b7280; font-size: 14px;">CEO, Company Inc.</span></div></div></div></div>';
        break;
      case 'pricing_card':
        div.innerHTML = '<div style="max-width: 350px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="background: #3b82f6; color: white; padding: 30px; text-align: center;"><h3 style="margin: 0 0 10px 0; font-size: 24px;">Pro Plan</h3><div style="font-size: 48px; font-weight: bold;">$29<span style="font-size: 18px; opacity: 0.8;">/month</span></div></div><div style="padding: 30px;"><ul style="list-style: none; padding: 0; margin: 0;"><li style="padding: 8px 0; color: #374151;">✓ All features included</li><li style="padding: 8px 0; color: #374151;">✓ 24/7 Support</li><li style="padding: 8px 0; color: #374151;">✓ Premium templates</li></ul><button style="width: 100%; background: #3b82f6; color: white; padding: 15px; border: none; border-radius: 8px; font-weight: 600; margin-top: 20px; cursor: pointer;">Choose Plan</button></div></div>';
        break;
      case 'divider':
        div.style.padding = '10px 0';
        div.innerHTML = '<hr style="border: none; height: 2px; background: linear-gradient(to right, transparent, #e5e7eb, transparent); margin: 20px 0;"/>';
        break;
      case 'spacer':
        div.innerHTML = '<div style="height: 60px; background: transparent; display: flex; align-items: center; justify-content: center; color: #9ca3af; border: 1px dashed #d1d5db; border-radius: 4px;"><small>Spacer - 60px height</small></div>';
        break;
      case 'stats':
        div.innerHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; text-align: center;"><div><div style="font-size: 48px; font-weight: bold; color: #3b82f6; margin-bottom: 8px;">100+</div><div style="color: #6b7280; font-size: 16px;">Happy Customers</div></div><div><div style="font-size: 48px; font-weight: bold; color: #10b981; margin-bottom: 8px;">5★</div><div style="color: #6b7280; font-size: 16px;">Average Rating</div></div><div><div style="font-size: 48px; font-weight: bold; color: #f59e0b; margin-bottom: 8px;">24/7</div><div style="color: #6b7280; font-size: 16px;">Support Available</div></div></div>';
        break;
      case 'features':
        div.innerHTML = '<div style="max-width: 1200px; margin: 0 auto;"><h2 style="text-align: center; font-size: 36px; font-weight: bold; color: #1f2937; margin-bottom: 50px;">Amazing Features</h2><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px;"><div style="text-align: center; padding: 20px;"><div style="font-size: 48px; margin-bottom: 20px;">🚀</div><h3 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 15px;">Fast Performance</h3><p style="color: #6b7280; line-height: 1.6;">Lightning fast loading times and optimized performance for the best user experience.</p></div><div style="text-align: center; padding: 20px;"><div style="font-size: 48px; margin-bottom: 20px;">🔒</div><h3 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 15px;">Secure & Safe</h3><p style="color: #6b7280; line-height: 1.6;">Enterprise-grade security with advanced encryption and protection.</p></div><div style="text-align: center; padding: 20px;"><div style="font-size: 48px; margin-bottom: 20px;">💎</div><h3 style="font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 15px;">Premium Quality</h3><p style="color: #6b7280; line-height: 1.6;">High-quality service with attention to detail and premium support.</p></div></div></div>';
        break;
      case 'social_links':
        div.innerHTML = '<div style="text-align: center;"><h3 style="margin: 0 0 20px 0; color: #374151;">Follow Us</h3><div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;"><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: #1da1f2; color: white; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s;">📘</a><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: #1da1f2; color: white; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s;">🐦</a><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: #e4405f; color: white; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s;">📷</a><a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: #0077b5; color: white; border-radius: 50%; text-decoration: none; font-size: 20px; transition: transform 0.2s;">💼</a></div></div>';
        break;
      case 'call_to_action':
        div.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        div.style.color = 'white';
        div.style.textAlign = 'center';
        div.style.padding = '60px 20px';
        div.style.margin = '40px 0';
        div.innerHTML = '<h2 style="font-size: 36px; font-weight: bold; margin: 0 0 20px 0;">Ready to Get Started?</h2><p style="font-size: 18px; margin: 0 0 30px 0; opacity: 0.9;">Join thousands of satisfied customers today</p><a href="#" style="display: inline-block; background: white; color: #667eea; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s;">Start Your Journey</a>';
        break;
      case 'team_member':
        div.innerHTML = '<div style="max-width: 300px; margin: 0 auto; text-align: center; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><img src="https://source.unsplash.com/300x300/?professional" alt="Team Member" style="width: 100%; height: 250px; object-fit: cover;"/><div style="padding: 25px;"><h3 style="margin: 0 0 8px 0; font-size: 20px; color: #374151;">John Doe</h3><p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">Senior Developer</p><p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">Experienced developer with passion for creating amazing user experiences.</p></div></div>';
        break;
      case 'faq':
        div.innerHTML = '<div style="max-width: 600px; margin: 0 auto;"><h3 style="margin: 0 0 30px 0; text-align: center; color: #374151;">Frequently Asked Questions</h3><div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;"><div style="border-bottom: 1px solid #e5e7eb; padding: 20px; background: #f9fafb;"><strong style="color: #374151;">How does it work?</strong><p style="margin: 10px 0 0 0; color: #6b7280;">Our service is designed to be simple and effective. Just sign up, customize your preferences, and start enjoying the benefits.</p></div><div style="border-bottom: 1px solid #e5e7eb; padding: 20px;"><strong style="color: #374151;">Is there a free trial?</strong><p style="margin: 10px 0 0 0; color: #6b7280;">Yes! We offer a 14-day free trial with no credit card required. You can explore all features during this period.</p></div><div style="padding: 20px; background: #f9fafb;"><strong style="color: #374151;">Can I cancel anytime?</strong><p style="margin: 10px 0 0 0; color: #6b7280;">Absolutely. You can cancel your subscription at any time without any penalties or hidden fees.</p></div></div></div>';
        break;
      case 'newsletter':
        div.innerHTML = '<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; text-align: center; max-width: 500px; margin: 0 auto;"><h3 style="margin: 0 0 15px 0; color: #374151; font-size: 24px;">Stay Updated</h3><p style="margin: 0 0 25px 0; color: #6b7280;">Subscribe to our newsletter for the latest updates and exclusive offers.</p><div style="display: flex; gap: 10px; max-width: 400px; margin: 0 auto;"><input type="email" placeholder="Enter your email" style="flex: 1; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"/><button style="background: #3b82f6; color: white; padding: 12px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap;">Subscribe</button></div></div>';
        break;
      default:
        div.innerHTML = `<div style="text-align: center; color: #6b7280;"><strong>${type.replace(/_/g, ' ').toUpperCase()}</strong><br><small>Component added successfully</small></div>`;
    }
    
    return div;
  }

  const getDefaultProps = (type: string) => {
    switch (type) {
      case COMPONENT_TYPES.TEXT:
        return { content: 'Edit this text...' }
      case COMPONENT_TYPES.DYNAMIC_TEXT:
        return { content: 'Dynamic Title' }
      case COMPONENT_TYPES.BUTTON:
        return { text: 'Button', url: '#', color: 'primary', size: 'medium' }
      case COMPONENT_TYPES.IMAGE:
        return { src: 'https://source.unsplash.com/400x300/?business', alt: 'Image' }
      case COMPONENT_TYPES.HERO_HEADER:
        return { 
          headline: 'Welcome to Our Service',
          subheadline: 'Transform your business with our solutions',
          ctaText: 'Get Started',
          backgroundImage: 'https://source.unsplash.com/1600x600/?business,modern'
        }
      case 'html_content':
        return { 
          content: '<div style="padding: 20px; text-align: center; border: 1px solid #e0e0e0; border-radius: 8px;"><h2>HTML Content Block</h2><p>You can edit this HTML content directly to customize your landing page.</p></div>' 
        }
      case 'divider':
        return { style: 'solid', color: '#e5e7eb', thickness: '1px' }
      case 'spacer':
        return { height: '50px' }
      case 'contact_form':
        return { title: 'Contact Us', fields: ['name', 'email', 'message'] }
      case 'testimonial':
        return { name: 'John Doe', text: 'Amazing service!', rating: 5 }
      case 'pricing_card':
        return { title: 'Basic Plan', price: '$29', features: ['Feature 1', 'Feature 2'] }
      case 'team_member':
        return { name: 'Team Member', role: 'Position', image: 'https://source.unsplash.com/200x200/?person' }
      case 'faq':
        return { question: 'Frequently Asked Question?', answer: 'Answer goes here' }
      case 'newsletter':
        return { title: 'Subscribe Newsletter', placeholder: 'Enter your email' }
      case 'stats':
        return { title: '1000+', subtitle: 'Happy Customers' }
      case 'features':
        return { title: 'Features Grid', items: ['Feature 1', 'Feature 2', 'Feature 3'] }
      case 'social_links':
        return { platforms: ['facebook', 'twitter', 'instagram'] }
      case 'call_to_action':
        return { title: 'Ready to get started?', button: 'Get Started Now' }
      default:
        return {}
    }
  }

  // Helper function to update HTML without scroll interference
  const setEditedHtmlWithScrollPreservation = (newHtml: string) => {
    // Simply update HTML content without any scroll preservation
    // This allows natural scrolling behavior without interference
    setEditedHtml(newHtml);
  }

  const updateComponent = (id: string, newData: any) => {
    setComponents(prev => prev.map(comp => comp.id === id ? { ...comp, ...newData } : comp))
  }

  const deleteComponent = (id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id))
  }

  const handleSave = () => {
    let htmlToSave = editedHtml && editedHtml.trim() !== '' ? editedHtml : generateHTMLFromData(components, sections)
    
    // Clean HTML for viewing (remove editor-specific styling)
    htmlToSave = cleanHtmlForViewing(htmlToSave)
    
    const data = { 
      components, 
      sections,
      html: htmlToSave,
      css: initialData?.css || generateCSSFromData(components, sections)
    }

    onSave?.(data)
  }

  const generateHTMLFromData = (components: any[], sections: any[]) => {
    // Combine components and sections into complete HTML
    const componentHTML = components.map(comp => {
      switch (comp.type) {
        case 'hero_header':
          return `<section class="hero-section relative min-h-screen flex items-center justify-center text-white" style="background: linear-gradient(135deg, rgba(0,0,0,0.6), rgba(37,99,235,0.3)), url(${comp.backgroundImage || 'https://source.unsplash.com/1600/600/?hero'}) center/cover;"><div class="container mx-auto px-4 text-center"><h1 class="text-5xl md:text-6xl font-bold mb-6">${comp.headline || 'Hero Headline'}</h1><p class="text-xl md:text-2xl mb-8">${comp.subheadline || 'Hero subheadline'}</p><a href="#contact" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg">${comp.ctaText || 'Call to Action'}</a></div></section>`
        case 'text':
          return `<div class="py-4"><p class="text-lg text-gray-600">${comp.content || 'Text content'}</p></div>`
        case 'dynamic_text':
          return `<div class="py-4"><h2 class="text-3xl font-bold text-gray-800">${comp.content || 'Dynamic Title'}</h2></div>`
        case 'button':
          return `<div class="py-4 text-center"><a href="${comp.url || '#'}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg">${comp.text || 'Button'}</a></div>`
        case 'image':
          return `<div class="py-4 text-center"><img src="${comp.src || 'https://source.unsplash.com/600/400/?image'}" alt="${comp.alt || 'Image'}" class="max-w-full h-auto rounded-lg shadow-lg mx-auto"/></div>`
        case 'html_content':
          return comp.content || '<div>HTML Content</div>'
        default:
          return `<div class="py-4"><!-- ${comp.type} component --></div>`
      }
    }).join('')

    // Add sections if available
    const sectionHTML = sections.map(section => {
      if (section.type === 'hero') {
        return `<section class="hero py-20 text-center"><h1 class="text-4xl font-bold mb-4">${section.title || ''}</h1><p class="text-xl mb-8">${section.subtitle || ''}</p>${section.image ? `<img src="${section.image}" class="mx-auto max-w-md rounded-lg"/>` : ''}</section>`
      }

      if (section.type === 'features') {
        return `<section class="features py-16"><div class="container mx-auto"><h2 class="text-3xl font-bold text-center mb-8">Features</h2><div class="grid md:grid-cols-3 gap-6">${(section.items || []).map((item: string) => `<div class="p-6 bg-white rounded-lg shadow"><p>${item}</p></div>`).join('')}</div></div></section>`
      }

      if (section.type === 'cta') {
        return `<section class="cta py-16 bg-blue-600 text-white text-center"><div class="container mx-auto"><h2 class="text-3xl font-bold">${section.text || 'Call to Action'}</h2></div></section>`
      }

      
return ''
    }).join('')

    return componentHTML + sectionHTML
  }

  const generateCSSFromData = (components: any[], sections: any[]) => {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
      .hero-section { position: relative; }
      .py-4 { padding: 1rem 0; }
      .py-8 { padding: 2rem 0; }
      .py-16 { padding: 4rem 0; }
      .py-20 { padding: 5rem 0; }
      .text-center { text-align: center; }
      .text-lg { font-size: 1.125rem; }
      .text-xl { font-size: 1.25rem; }
      .text-3xl { font-size: 1.875rem; }
      .text-4xl { font-size: 2.25rem; }
      .text-5xl { font-size: 3rem; }
      .font-bold { font-weight: 700; }
      .text-gray-600 { color: #6b7280; }
      .text-gray-800 { color: #1f2937; }
      .text-white { color: white; }
      .bg-blue-600 { background-color: #2563eb; }
      .bg-white { background-color: white; }
      .rounded-lg { border-radius: 0.5rem; }
      .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .shadow-lg { box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
      .max-w-full { max-width: 100%; }
      .h-auto { height: auto; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      .mb-4 { margin-bottom: 1rem; }
      .mb-6 { margin-bottom: 1.5rem; }
      .mb-8 { margin-bottom: 2rem; }
      .grid { display: grid; }
      .gap-2 { gap: 0.5rem; }
      .gap-6 { gap: 1.5rem; }
      .p-6 { padding: 1.5rem; }
      .inline-block { display: inline-block; }
      a { text-decoration: none; transition: all 0.3s ease; }
      a:hover { transform: translateY(-2px); }
      @media (min-width: 768px) {
        .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .md\\:text-6xl { font-size: 3.75rem; }
        .md\\:text-2xl { font-size: 1.5rem; }
      }
    `
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '80vh', bgcolor: 'background.paper' }}>
      {/* Sidebar - Conditional Rendering */}
      {drawerOpen && (
        <Box
          sx={{
            width: 320,
            flexShrink: 0,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            height: 'auto',
            maxHeight: '150vh',
            overflow: 'auto',
            transition: 'width 0.3s ease'
          }}
        >
        <Box sx={{ p: 2 }}>
                                  <Tabs 
            value={selectedTab} 
            onChange={(e, v) => setSelectedTab(v)} 
            variant="fullWidth"
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              mb: 2,
              '& .MuiTab-root': {
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main'
                }
              }
            }}
          >
            <Tab label="Konten" />
            <Tab label="Design" />
            <Tab label="Pengaturan" />
          </Tabs>

          {selectedTab === 0 && (
            <Box sx={{ mt: 2 }}>
                                        <Typography variant="h6" sx={{ 
                mb: 2, 
                color: 'primary.main', 
                fontWeight: 700, 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pb: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <i className="tabler-file-text" style={{ fontSize: '16px' }} />
                Standard Components
              </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                            {standardComponents.map((comp) => (
                              <DraggableComponent
                                key={comp.type}
                                type={comp.type}
                                label={comp.label}
                                icon={comp.icon}
                                onAdd={handleAddComponent}
                              />
                            ))}
                          </Box>

                          <Typography variant="h6" sx={{ 
                mt: 3, 
                mb: 2, 
                color: 'primary.main', 
                fontWeight: 700, 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pb: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <i className="tabler-layout" style={{ fontSize: '16px' }} />
                Layout Components
              </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                            {layoutComponents.map((comp) => (
                              <DraggableComponent
                                key={comp.type}
                                type={comp.type}
                                label={comp.label}
                                icon={comp.icon}
                                onAdd={handleAddComponent}
                              />
                            ))}
                          </Box>

                          <Typography variant="h6" sx={{ 
                mt: 3, 
                mb: 2, 
                color: 'primary.main', 
                fontWeight: 700, 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pb: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <i className="tabler-briefcase" style={{ fontSize: '16px' }} />
                Business Components
              </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                            {businessComponents.map((comp) => (
                              <DraggableComponent
                                key={comp.type}
                                type={comp.type}
                                label={comp.label}
                                icon={comp.icon}
                                onAdd={handleAddComponent}
                              />
                            ))}
                          </Box>
            </Box>
          )}

          {selectedTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                color: 'primary.main', 
                fontWeight: 700, 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pb: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <i className="tabler-settings" style={{ fontSize: '16px' }} />
                Properties Panel
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'text.secondary', 
                mb: 3,
                fontSize: '12px',
                fontStyle: 'italic'
              }}>
                Customize your selected element
              </Typography>
              
              {selectedElement ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ 
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: 2,
                    p: 2
                  }}>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600, 
                      color: '#8b5cf6',
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📝 {selectedElement.tagName?.toLowerCase() || 'element'} Element
                    </Typography>
                  </Box>
                  
                  {/* Button Specific Properties */}
                  {selectedElement.tagName === 'A' && (
                    <Box sx={{ 
                      background: 'linear-gradient(135deg, #f3f4f6, #ffffff)',
                      border: '1px solid #e5e7eb',
                      borderRadius: 2,
                      p: 3,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        mb: 2, 
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        🔘 Button Properties
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                            Button Text
                          </Typography>
                          <TextField
                            value={selectedElement.textContent || ''}
                            placeholder="Enter button text"
                            size="small"
                            fullWidth
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#ffffff',
                                '&:hover': { borderColor: '#8b5cf6' },
                                '&.Mui-focused': { borderColor: '#8b5cf6' }
                              }
                            }}
                            onChange={(e) => {
                              selectedElement.textContent = e.target.value;
                              setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                            Button URL
                          </Typography>
                          <TextField
                            value={selectedElement.getAttribute('href') || ''}
                            placeholder="https://example.com"
                            size="small"
                            fullWidth
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#ffffff',
                                '&:hover': { borderColor: '#8b5cf6' },
                                '&.Mui-focused': { borderColor: '#8b5cf6' }
                              }
                            }}
                            onChange={(e) => {
                              selectedElement.setAttribute('href', e.target.value);
                              setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Image Specific Properties */}
                  {selectedElement.tagName === 'IMG' && (
                    <Box sx={{ 
                      background: 'linear-gradient(135deg, #f0fdf4, #ffffff)',
                      border: '1px solid #86efac',
                      borderRadius: 2,
                      p: 3,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        mb: 2, 
                        color: '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        🖼️ Image Properties
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Current Image Preview */}
                        <Box sx={{
                          border: '2px dashed #d1d5db',
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center',
                          background: '#f9fafb'
                        }}>
                          <Box sx={{
                            width: '100%',
                            maxWidth: 200,
                            height: 120,
                            margin: '0 auto',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb',
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <img 
                              src={(selectedElement as HTMLImageElement).src || ''}
                              alt="Current Image"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;

                                target.style.display = 'none';
                                target.nextSibling && ((target.nextSibling as HTMLElement).style.display = 'flex');
                              }}
                            />
                            <Box sx={{
                              display: 'none',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6b7280',
                              fontSize: '12px'
                            }}>
                              No Image
                            </Box>
                          </Box>
                        </Box>
                        
                        {/* Upload New Image */}
                        <Button
                          variant="contained"
                          component="label"
                          fullWidth
                          sx={{
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #059669, #047857)'
                            }
                          }}
                        >
                          📁 Upload New Image
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0];

                              if (file) {
                                const reader = new FileReader();

                                reader.onload = () => {
                                  const dataUrl = reader.result as string;

                                  if (selectedElement && selectedElement.tagName === 'IMG') {
                                    (selectedElement as HTMLImageElement).src = dataUrl;
                                    setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                                  }
                                };

                                reader.readAsDataURL(file);
                              }


                              // Reset input so same file can be selected again
                              (e.target as HTMLInputElement).value = '';
                            }}
                          />
                        </Button>
                        
                        {/* Image URL Field */}
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                            Image URL
                          </Typography>
                          <TextField
                            value={(selectedElement as HTMLImageElement)?.src || ''}
                            placeholder="https://images.unsplash.com/photo-..."
                            size="small"
                            fullWidth
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#ffffff',
                                '&:hover': { borderColor: '#10b981' },
                                '&.Mui-focused': { borderColor: '#10b981' }
                              }
                            }}
                            onChange={(e) => {
                              if (selectedElement && selectedElement.tagName === 'IMG') {
                                (selectedElement as HTMLImageElement).src = e.target.value;
                                setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                              }
                            }}
                          />
                        </Box>
                        
                        {/* Alt Text Field */}
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                            Alt Text (Accessibility)
                          </Typography>
                          <TextField
                            value={(selectedElement as HTMLImageElement)?.alt || ''}
                            placeholder="Describe the image for screen readers"
                            size="small"
                            fullWidth
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#ffffff',
                                '&:hover': { borderColor: '#10b981' },
                                '&.Mui-focused': { borderColor: '#10b981' }
                              }
                            }}
                            onChange={(e) => {
                              if (selectedElement && selectedElement.tagName === 'IMG') {
                                (selectedElement as HTMLImageElement).alt = e.target.value;
                                setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                              }
                            }}
                          />
                        </Box>
                        
                        {/* Quick Size Presets */}
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                            Quick Size Options
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {[
                              { label: 'Small', width: '150px', height: 'auto' },
                              { label: 'Medium', width: '300px', height: 'auto' },
                              { label: 'Large', width: '500px', height: 'auto' },
                              { label: 'Full Width', width: '100%', height: 'auto' },
                              { label: 'Square', width: '200px', height: '200px' }
                            ].map(size => (
                              <Button
                                key={size.label}
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  if (selectedElement?.style) {
                                    selectedElement.style.width = size.width;
                                    selectedElement.style.height = size.height;
                                    selectedElement.style.objectFit = size.height !== 'auto' ? 'cover' : 'initial';
                                    setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                                  }
                                }}
                                sx={{
                                  fontSize: '10px',
                                  minWidth: 'auto',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1.5,
                                  borderColor: '#10b981',
                                  color: '#10b981',
                                  '&:hover': { 
                                    bgcolor: '#f0fdf4',
                                    borderColor: '#059669'
                                  }
                                }}
                              >
                                {size.label}
                              </Button>
                            ))}
                          </Box>
                        </Box>
                        
                        {/* Object Fit Options */}
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                            Image Fit
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {['cover', 'contain', 'fill', 'scale-down', 'none'].map(fit => (
                              <Button
                                key={fit}
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  if (selectedElement?.style) {
                                    selectedElement.style.objectFit = fit;
                                    setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                                  }
                                }}
                                sx={{
                                  fontSize: '10px',
                                  minWidth: 'auto',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  borderColor: '#10b981',
                                  color: '#10b981',
                                  '&:hover': { 
                                    bgcolor: '#f0fdf4',
                                    borderColor: '#059669'
                                  }
                                }}
                              >
                                {fit}
                              </Button>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Text Content and Typography - Unified Tiptap Editor */}
                  {(selectedElement.tagName === 'P' || selectedElement.tagName === 'H1' || selectedElement.tagName === 'H2' || selectedElement.tagName === 'H3' || selectedElement.tagName === 'SPAN') && (
                    <Box sx={{ 
                      background: 'linear-gradient(135deg, #f0f9ff, #ffffff)',
                      border: '1px solid #bae6fd',
                      borderRadius: 2,
                      p: 3,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        mb: 2, 
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        ✏️ Text Content & Typography
                      </Typography>
                      {(() => {
                        const clone = selectedElement.cloneNode(true) as HTMLElement

                        clone.querySelectorAll?.('.ve-drag-handle, .ve-resize-handle').forEach((n:any)=> n.remove())
                        const value = clone.innerHTML || clone.textContent || ''

                        
return (
                          <TiptapEditor
                            content={value}
                            onChange={(content) => {
                              selectedElement.querySelectorAll?.('.ve-drag-handle, .ve-resize-handle').forEach((n:any)=> n.remove())
                              selectedElement.innerHTML = content
                              setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML)
                            }}
                            placeholder="Enter your text content..."
                            selectedElement={selectedElement}
                          />
                        )
                      })()}
                    </Box>
                  )}


                                    {/* Background & Border */}
                                    <Box sx={{ 
                    background: 'linear-gradient(135deg, #fef3c7, #ffffff)',
                    border: '1px solid #fbbf24',
                    borderRadius: 2,
                    p: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      mb: 2, 
                      color: '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      🎨 Colors & Borders
                    </Typography>
                    {/* Unified Color Editor */}
                    <Box sx={{ mt: 1 }}>
                      <Tabs
                        value={colorEditorTab === 'solid' ? 0 : 1}
                        onChange={(e, v) => setColorEditorTab(v === 0 ? 'solid' : 'gradient')}
                        sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600 } }}
                      >
                        <Tab label="Solid color" />
                        <Tab label="Gradient" />
                      </Tabs>

                      {colorEditorTab === 'solid' && (
                        <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                          <Box>
                            {/* Preview with transparency checker */}
                            <Box sx={{
                              height: 120,
                              borderRadius: 2,
                              border: '1px solid #e5e7eb',
                              backgroundImage:
                                'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                              backgroundSize: '16px 16px',
                              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                              <Box sx={{ position: 'absolute', inset: 0, borderRadius: 2, background: `rgba(${Math.round(solidColor.r)}, ${Math.round(solidColor.g)}, ${Math.round(solidColor.b)}, ${solidColor.a})` }} />
                            </Box>
                          </Box>
                          <Box>
                            <RgbaColorPicker
                              color={solidColor}
                              onChange={(c) => { setSolidColor(c as any); applySolid(c as any) }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <Box sx={{ width: 28, height: 28, borderRadius: 1, border: '1px solid #e5e7eb', background: `rgb(${solidColor.r}, ${solidColor.g}, ${solidColor.b})` }} />
                              <HexColorInput
                                color={rgbToHex(solidColor.r, solidColor.g, solidColor.b)}
                                onChange={(val) => {
                                  const rgb = hexToRgb(val)

                                  if (!rgb) return
                                  const next = { ...solidColor, ...rgb }

                                  setSolidColor(next)
                                  applySolid(next as any)
                                }}
                                prefixed
                                style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
                                placeholder="#EFOE43"
                              />
                            </Box>
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>Transparency</Typography>
                              <Slider size="small" value={Math.round((solidColor.a || 0) * 100)} onChange={(e, v:any)=>{
                                const next = { ...solidColor, a: (Array.isArray(v) ? v[0]: v)/100 }

                                setSolidColor(next)
                                applySolid(next)
                              }} valueLabelDisplay="auto" min={0} max={100} />
                            </Box>
                          </Box>
                        </Box>
                      )}

                      {colorEditorTab === 'gradient' && (
                        <Box sx={{ mt: 2 }}>
                          {/* Gradient preview */}
                          {(() => {
                            const sorted = [...gradientStops].sort((a,b)=>a.position-b.position)
                            const stopsCss = sorted.map(s=>`rgba(${Math.round(s.color.r)}, ${Math.round(s.color.g)}, ${Math.round(s.color.b)}, ${s.color.a}) ${Math.round(s.position)}%`).join(', ')
                            const css = gradientType === 'linear' ? `linear-gradient(${gradientAngle}deg, ${stopsCss})` : `radial-gradient(circle at center, ${stopsCss})`

                            
return (
                              <Box sx={{
                                height: 120,
                                borderRadius: 2,
                                border: '1px solid #e5e7eb',
                                backgroundImage:
                                  'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                                backgroundSize: '16px 16px',
                                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                                position: 'relative',
                                overflow: 'hidden',
                                mb: 2
                              }}>
                                <Box sx={{ position: 'absolute', inset: 0, borderRadius: 2, background: css }} />
                              </Box>
                            )
                          })()}

                          {/* Stops */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            {gradientStops.map(s => (
                              <Box key={s.id} onClick={()=> setActiveStopId(s.id)} sx={{
                                width: 28, height: 28, borderRadius: '50%', border: activeStopId===s.id?'2px solid #7c3aed':'2px solid #e5e7eb', cursor: 'pointer',
                                background: `rgba(${Math.round(s.color.r)}, ${Math.round(s.color.g)}, ${Math.round(s.color.b)}, ${s.color.a})`
                              }} title={`${Math.round(s.position)}%`} />
                            ))}
                            <IconButton size="small" onClick={()=>{
                              const last = gradientStops[gradientStops.length-1]
                              const newId = 'g' + Math.random().toString(36).slice(2,7)
                              const pos = clamp(0,100,last ? Math.min(100, last.position + 10) : 50)
                              const newStop = { id: newId, color: last? { ...last.color } : { r: 239, g: 64, b: 67, a: 1 }, position: pos }
                              const next = [...gradientStops, newStop]

                              setGradientStops(next)
                              setActiveStopId(newId)
                              applyGradient(next)
                            }}>
                              <i className="tabler-plus"/>
                            </IconButton>
                            {gradientStops.length > 2 && (
                              <IconButton size="small" color="error" onClick={()=>{
                                const next = gradientStops.filter(s=>s.id!==activeStopId)

                                setGradientStops(next)
                                setActiveStopId(next[0]?.id || '')
                                applyGradient(next)
                              }}>
                                <i className="tabler-trash"/>
                              </IconButton>
                            )}
                          </Box>

                          {/* Active stop editors */}
                          {(() => {
                            const current = gradientStops.find(s=>s.id===activeStopId) || gradientStops[0]

                            if (!current) return null
                            
return (
                              <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <Box>
                                  <RgbaColorPicker color={current.color} onChange={(c)=>{
                                    const next = gradientStops.map(s=> s.id===current.id ? { ...s, color: c as any } : s)

                                    setGradientStops(next)
                                    applyGradient(next)
                                  }} />
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#6b7280' }}>Transparency</Typography>
                                    <Slider size="small" value={Math.round((current.color.a||0)*100)} onChange={(e,v:any)=>{
                                      const next = gradientStops.map(s=> s.id===current.id ? { ...s, color: { ...s.color, a: (Array.isArray(v)?v[0]:v)/100 } } : s)

                                      setGradientStops(next)
                                      applyGradient(next)
                                    }} valueLabelDisplay="auto" min={0} max={100} />
                                  </Box>
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#6b7280' }}>Stop position ({Math.round(current.position)}%)</Typography>
                                  <Slider size="small" value={current.position} onChange={(e, v:any)=>{
                                    const next = gradientStops.map(s=> s.id===current.id ? { ...s, position: clamp(0,100,Array.isArray(v)?v[0]:v) } : s)

                                    setGradientStops(next)
                                    applyGradient(next)
                                  }} valueLabelDisplay="auto" min={0} max={100} />
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
                                    <Button size="small" variant={gradientType==='linear'?'contained':'outlined'} onClick={()=>{ setGradientType('linear'); applyGradient(gradientStops, gradientAngle, 'linear') }}>Linear</Button>
                                    <Button size="small" variant={gradientType==='radial'?'contained':'outlined'} onClick={()=>{ setGradientType('radial'); applyGradient(gradientStops, gradientAngle, 'radial') }}>Radial</Button>
                                  </Box>
                                  {gradientType==='linear' && (
                                    <Box sx={{ mt: 2 }}>
                                      <Typography variant="caption" sx={{ color: '#6b7280' }}>Angle ({gradientAngle}°)</Typography>
                                      <Slider size="small" value={gradientAngle} onChange={(e, v:any)=>{ setGradientAngle(Array.isArray(v)?v[0]:v); applyGradient(gradientStops, Array.isArray(v)?v[0]:v) }} valueLabelDisplay="auto" min={0} max={360} />
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            )
                          })()}
                        </Box>
                      )}
                    </Box>

                    {/* Border Controls */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                        Border
                      </Typography>
                      <TextField
                        value={selectedElement.style?.border || ''}
                        placeholder="1px solid #ccc"
                        size="small"
                        fullWidth
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#ffffff',
                            '&:hover': { borderColor: '#f59e0b' },
                            '&.Mui-focused': { borderColor: '#f59e0b' }
                          }
                        }}
                        onChange={(e) => {
                          if (selectedElement.style) {
                            selectedElement.style.border = e.target.value;
                            setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                          }
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        {['none', '1px solid #ccc', '2px solid #000', '1px dashed #666', '2px dotted #999'].map(border => (
                          <Button
                            key={border}
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              if (selectedElement.style) {
                                selectedElement.style.border = border;
                                setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                              }
                            }}
                            sx={{
                              fontSize: '10px',
                              minWidth: 'auto',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              '&:hover': { bgcolor: '#fef3c7' }
                            }}
                          >
                            {border === 'none' ? 'None' : border.split(' ')[0]}
                          </Button>
                        ))}
                      </Box>
                    </Box>

                    {/* Background Image */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                        Background Image
                      </Typography>
                      <TextField
                        label="Image URL"
                        size="small"
                        fullWidth
                        value={(() => {
                          const bg = selectedElement.style?.backgroundImage || '';
                          const m = bg.match(/url\((['"]?)(.*?)\1\)/);

                          
return m ? m[2] : '';
                        })()}
                        onChange={(e) => {
                          if (!selectedElement?.style) return;
                          const url = e.target.value.trim();

                          if (url) {
                            selectedElement.style.backgroundImage = `url(${url})`;
                            if (!selectedElement.style.backgroundSize) selectedElement.style.backgroundSize = 'cover';
                          } else {
                            selectedElement.style.backgroundImage = '';
                          }

                          selectedElement.style.background = '';
                          setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button
                          size="small"
                          variant="contained"
                          component="label"
                          sx={{ fontSize: '10px', px: 1, py: 0.5, borderRadius: 1 }}
                        >
                          Upload Image
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0];

                              if (!file) return;
                              const reader = new FileReader();

                              reader.onload = () => {
                                const dataUrl = reader.result as string;

                                if (!selectedElement?.style) return;
                                selectedElement.style.backgroundImage = `url(${dataUrl})`;
                                if (!selectedElement.style.backgroundSize) selectedElement.style.backgroundSize = 'cover';
                                selectedElement.style.backgroundRepeat = selectedElement.style.backgroundRepeat || 'no-repeat';
                                selectedElement.style.background = '';
                                setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                              };

                              reader.readAsDataURL(file);

                              // reset input so same file can be picked again
                              (e.target as HTMLInputElement).value = '';
                            }}
                          />
                        </Button>
                      <Box sx={{ flex: 1 }} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        {['cover', 'contain', 'auto'].map(size => (
                          <Button
                            key={size}
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              if (!selectedElement?.style) return;
                              selectedElement.style.backgroundSize = size;
                              setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                            }}
                            sx={{ fontSize: '10px', px: 1, py: 0.5, borderRadius: 1 }}
                          >
                            {size}
                          </Button>
                        ))}
                        {['center', 'top', 'bottom', 'left', 'right'].map(pos => (
                          <Button
                            key={pos}
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              if (!selectedElement?.style) return;
                              selectedElement.style.backgroundPosition = pos;
                              setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                            }}
                            sx={{ fontSize: '10px', px: 1, py: 0.5, borderRadius: 1 }}
                          >
                            {pos}
                          </Button>
                        ))}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            if (!selectedElement?.style) return;
                            selectedElement.style.backgroundRepeat = selectedElement.style.backgroundRepeat === 'no-repeat' ? '' : 'no-repeat';
                            setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                          }}
                          sx={{ fontSize: '10px', px: 1, py: 0.5, borderRadius: 1 }}
                        >
                          No Repeat
                        </Button>
                      </Box>
                      <Button
                        size="small"
                        color="secondary"
                        variant="text"
                        onClick={() => {
                          if (!selectedElement?.style) return;
                          selectedElement.style.background = '';
                          selectedElement.style.backgroundImage = '';
                          selectedElement.style.backgroundColor = '';
                          selectedElement.style.backgroundSize = '';
                          selectedElement.style.backgroundPosition = '';
                          selectedElement.style.backgroundRepeat = '';
                          setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                        }}
                        sx={{ mt: 1 }}
                      >
                        Clear All Background
                      </Button>
                    </Box>
                  </Box>
                  
                  {/* Spacing Controls */}
                  <Box sx={{ 
                    background: 'linear-gradient(135deg, #fef7ff, #ffffff)',
                    border: '1px solid #e9d5ff',
                    borderRadius: 2,
                    p: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      mb: 2, 
                      color: '#581c87',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📏 Spacing
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                          Padding
                        </Typography>
                        <TextField
                          value={selectedElement.style?.padding || ''}
                          placeholder="20px"
                          size="small"
                          fullWidth
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: '#ffffff',
                              '&:hover': { borderColor: '#a855f7' },
                              '&.Mui-focused': { borderColor: '#a855f7' }
                            }
                          }}
                          onChange={(e) => {
                            if (selectedElement.style) {
                              selectedElement.style.padding = e.target.value;
                              setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                            }
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                          Margin
                        </Typography>
                        <TextField
                          value={selectedElement.style?.margin || ''}
                          placeholder="10px"
                          size="small"
                          fullWidth
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: '#ffffff',
                              '&:hover': { borderColor: '#a855f7' },
                              '&.Mui-focused': { borderColor: '#a855f7' }
                            }
                          }}
                          onChange={(e) => {
                            if (selectedElement.style) {
                              selectedElement.style.margin = e.target.value;
                              setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Typography Controls (dedup removed lower duplicate) */}

                  {/* Reorder & Flow (Positioning simplified - absolute disabled) */}
                  <Box sx={{ 
                    background: 'linear-gradient(135deg, #fff7ed, #ffffff)',
                    border: '1px solid #fed7aa',
                    borderRadius: 2,
                    p: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      mb: 1.5, 
                      color: '#9a3412',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📍 Reorder & Flow
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: '#7c2d12' }}>
                      Gunakan ALT + Drag pada elemen atau tombol handle untuk menyusun ulang elemen. Semua elemen mengikuti normal flow (tanpa absolute).
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          if (!selectedElement?.style) return
                          selectedElement.style.position = ''
                          selectedElement.style.left = ''
                          selectedElement.style.top = ''
                          selectedElement.style.margin = selectedElement.style.margin || ''
                          setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML)
                          setSelectedElementVersion(v => v + 1)
                        }}
                      >
                        Reset ke Normal Flow
                      </Button>
                    </Box>
                  </Box>
                  
                  
                  {/* Layout */}
                  <Box sx={{ 
                    background: 'linear-gradient(135deg, #fef2f2, #ffffff)',
                    border: '1px solid #fca5a5',
                    borderRadius: 2,
                    p: 3,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      mb: 2, 
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📐 Layout & Size
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                          Width
                        </Typography>
                        <TextField
                          value={selectedElement.style?.width || ''}
                          placeholder="100%"
                          size="small"
                          fullWidth
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: '#ffffff',
                              '&:hover': { borderColor: '#ef4444' },
                              '&.Mui-focused': { borderColor: '#ef4444' }
                            }
                          }}
                          onChange={(e) => {
                            if (selectedElement.style) {
                              selectedElement.style.width = e.target.value;
                              setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          {['auto', '100%', '50%', '25%', '200px', '300px'].map(width => (
                            <Button
                              key={width}
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                if (selectedElement.style) {
                                  selectedElement.style.width = width;
                                  setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                                }
                              }}
                              sx={{
                                fontSize: '10px',
                                minWidth: 'auto',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                '&:hover': { bgcolor: '#fef2f2' }
                              }}
                            >
                              {width}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                          Height
                        </Typography>
                        <TextField
                          value={selectedElement.style?.height || ''}
                          placeholder="auto"
                          size="small"
                          fullWidth
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: '#ffffff',
                              '&:hover': { borderColor: '#ef4444' },
                              '&.Mui-focused': { borderColor: '#ef4444' }
                            }
                          }}
                          onChange={(e) => {
                            if (selectedElement.style) {
                              selectedElement.style.height = e.target.value;
                              setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          {['auto', '100px', '200px', '300px', '50vh', '100vh'].map(height => (
                            <Button
                              key={height}
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                if (selectedElement.style) {
                                  selectedElement.style.height = height;
                                  setEditedHtmlWithScrollPreservation(selectedElement.ownerDocument.body.innerHTML);
                                }
                              }}
                              sx={{
                                fontSize: '10px',
                                minWidth: 'auto',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                '&:hover': { bgcolor: '#fef2f2' }
                              }}
                            >
                              {height}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    mt: 3
                  }}>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon="✨"
                      sx={{ 
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #d97706, #b45309)',
                          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        // Clear selections
                        const iframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

                        if (iframe?.contentDocument) {
                          iframe.contentDocument.querySelectorAll('.selected-element').forEach((el: any) => {
                            el.classList.remove('selected-element');
                          });
                        }

                        setSelectedElement(null);
                      }}
                    >
                      Clear Selection
                    </Button>
                  </Box>
                </Box>
              ) : selectedComponent ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Component ID"
                    value={selectedComponent.id}
                    disabled
                    size="small"
                  />
                  <TextField
                    label="Component Type"
                    value={selectedComponent.type}
                    disabled
                    size="small"
                  />
                  {selectedComponent.type === 'text' && (
                    <TextField
                      label="Content"
                      value={selectedComponent.content || ''}
                      onChange={(e) => {
                        setSelectedComponent({ ...selectedComponent, content: e.target.value })
                        updateComponent(selectedComponent.id, { content: e.target.value })
                      }}
                      multiline
                      rows={3}
                      size="small"
                    />
                  )}
                  {selectedComponent.type === 'image' && (
                    <>
                      <TextField
                        label="Image URL"
                        value={selectedComponent.src || ''}
                        onChange={(e) => {
                          setSelectedComponent({ ...selectedComponent, src: e.target.value })
                          updateComponent(selectedComponent.id, { src: e.target.value })
                        }}
                        size="small"
                      />
                      <TextField
                        label="Alt Text"
                        value={selectedComponent.alt || ''}
                        onChange={(e) => {
                          setSelectedComponent({ ...selectedComponent, alt: e.target.value })
                          updateComponent(selectedComponent.id, { alt: e.target.value })
                        }}
                        size="small"
                      />
                    </>
                  )}
                  {selectedComponent.type === 'button' && (
                    <>
                      <TextField
                        label="Button Text"
                        value={selectedComponent.text || ''}
                        onChange={(e) => {
                          setSelectedComponent({ ...selectedComponent, text: e.target.value })
                          updateComponent(selectedComponent.id, { text: e.target.value })
                        }}
                        size="small"
                      />
                      <TextField
                        label="Button URL"
                        value={selectedComponent.url || ''}
                        onChange={(e) => {
                          setSelectedComponent({ ...selectedComponent, url: e.target.value })
                          updateComponent(selectedComponent.id, { url: e.target.value })
                        }}
                        size="small"
                      />
                    </>
                  )}
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: 'center',
                  py: 6,
                  px: 3,
                  background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                  border: '2px dashed #cbd5e1',
                  borderRadius: 3,
                  color: '#64748b'
                }}>
                  <Box sx={{ fontSize: '48px', mb: 2 }}>🎯</Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#475569' }}>
                    No Element Selected
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.6 }}>
                    Click on any element in the editor to customize its properties
                  </Typography>
                  <Box sx={{ 
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: 2,
                    p: 2,
                    fontSize: '13px',
                    textAlign: 'left'
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#8b5cf6' }}>
                      💡 Quick Tips:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      • Click any text, button, or image to select it
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      • Use the Outline tab to see all elements
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      • Hold ALT + Drag to reorder elements
                    </Typography>
                    <Typography variant="body2">
                      • Drag components from the sidebar to add new ones
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {selectedTab === 2 && (
            <Box sx={{ mt: 2 }}>
              {/* Website Section - Expanded by default */}
              <Accordion 
                expanded={expandedAccordion === 'website'}
                onChange={handleAccordionChange('website')}
                sx={{ 
                  mb: 3, 
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': {
                    boxShadow: '0 8px 32px rgba(25, 118, 210, 0.12)'
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(25, 118, 210, 0.02))',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    minHeight: 64,
                    '&.Mui-expanded': {
                      minHeight: 64,
                      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08), rgba(25, 118, 210, 0.04))'
                    },
                    '& .MuiAccordionSummary-content': {
                      margin: '16px 0'
                    }
                  }}
                >
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    color: 'primary.main',
                    fontSize: '16px'
                  }}>
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      🌍
                    </Box>
                    Website Settings
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 5, background: 'rgba(248, 250, 252, 0.5)' }}>
                  {/* Error Messages */}
                  {errors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 4 }}>
                      {errors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5}}>
                    <TextField
                      label="Nama Halaman"
                      value={pageSettings.pageName}
                      onChange={(e) => handlePageNameChange(e.target.value)}
                      size="small"
                      fullWidth
                      helperText="Nama akan otomatis membuat slug URL"
                      disabled={loading.pageData}
                      InputProps={{
                        endAdornment: loading.pageData ? <CircularProgress size={20} /> : null
                      }}
                      sx={{
                        mb: 0,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.9)'
                          },
                          '&.Mui-focused': {
                            background: 'rgba(255, 255, 255, 1)',
                            boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: '10px',      // ukuran helperText
                          color: 'text.secondary',
                        },
                      }}
                    />
                    <Box sx={{ mb: 1 }}>
                      <TextField
                        label="Slug URL"
                        value={pageSettings.slugUrl}
                        onChange={(e) => setPageSettings({...pageSettings, slugUrl: e.target.value})}
                        size="small"
                        fullWidth
                        helperText={getPreviewUrl()}
                        disabled={loading.pageData}
                        InputProps={{
                          endAdornment: loading.pageData ? <CircularProgress size={20} /> : null
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.9)'
                            },
                            '&.Mui-focused': {
                              background: 'rgba(255, 255, 255, 1)',
                              boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                            }
                          },
                          '& .MuiFormHelperText-root': {
                            fontSize: '10px',      // ukuran helperText
                            color: 'text.secondary',
                          },
                        }}
                      />
                    </Box>
                    <FormControl fullWidth size="small" sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.9)'
                        },
                        '&.Mui-focused': {
                          background: 'rgba(255, 255, 255, 1)',
                          boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                        }
                      }
                    }}>
                      <InputLabel>Pilih Toko</InputLabel>
                      <Select
                        value={pageSettings.selectedStore}
                        onChange={(e) => {
                          const storeUuid = e.target.value

                          setPageSettings({...pageSettings, selectedStore: storeUuid, selectedDomain: ''})
                        }}
                        label="Pilih Toko"
                        disabled={loading.stores}
                        startAdornment={loading.stores ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                        sx={{ mb: 1 }}
                      >
                        <MenuItem value="">
                          <em>{loading.stores ? 'Loading stores...' : 'Pilih Toko'}</em>
                        </MenuItem>
                        {stores.map((store) => (
                          <MenuItem key={store.uuid} value={store.uuid}>
                            {store.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.9)'
                        },
                        '&.Mui-focused': {
                          background: 'rgba(255, 255, 255, 1)',
                          boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                        }
                      }
                    }}>
                      <InputLabel>Pilih Domain</InputLabel>
                      <Select
                        value={pageSettings.selectedDomain}
                        onChange={(e) => setPageSettings({...pageSettings, selectedDomain: e.target.value})}
                        label="Pilih Domain"
                        disabled={!pageSettings.selectedStore || loading.domains}
                        startAdornment={loading.domains ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                      >
                        <MenuItem value="">
                          <em>{loading.domains ? 'Loading domains...' : (!pageSettings.selectedStore ? 'Pilih toko terlebih dahulu' : 'Pilih Domain')}</em>
                        </MenuItem>
                        {domains.map((domain) => (
                          <MenuItem key={domain.id} value={domain.id}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {domain.domain ? '🌐 ' + domain.domain : '🔗 ' + domain.subdomain + '.aidareu.com'}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                      mt: 3,
                      mb: 2
                    }}>
                      <Box sx={{
                        p: 4,
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.02), rgba(25, 118, 210, 0.01))',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        minHeight: 200,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          borderColor: 'primary.main',
                          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(25, 118, 210, 0.02))',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 6px 20px rgba(25, 118, 210, 0.15)'
                        }
                      }}>
                        <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          🎨 Upload Favicon
                        </Typography>
                        <Button 
                          variant="outlined" 
                          component="label" 
                          size="small" 
                          fullWidth
                          sx={{
                            borderRadius: 2,
                            borderStyle: 'dashed',
                            borderWidth: 2,
                            py: 1.5,
                            background: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 1)',
                              borderColor: 'primary.main',
                              transform: 'scale(1.02)'
                            }
                          }}
                        >
                          Choose Favicon
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]

                              if (file && validateImageFile(file, 1)) {
                                setPageSettings({...pageSettings, favicon: file})
                              }
                            }}
                          />
                        </Button>
                        {pageSettings.favicon && (
                          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                              width: 64,
                              height: 64,
                              borderRadius: 2,
                              border: '2px solid',
                              borderColor: 'primary.light',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              background: 'rgba(255, 255, 255, 0.9)'
                            }}>
                              <img 
                                src={URL.createObjectURL(pageSettings.favicon)}
                                alt="Favicon Preview"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </Box>
                            <Chip 
                              label={pageSettings.favicon.name} 
                              size="small" 
                              sx={{ 
                                background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                                color: 'primary.dark',
                                fontWeight: 500,
                                '& .MuiChip-label': {
                                  fontSize: '11px'
                                }
                              }} 
                            />
                          </Box>
                        )}
                      </Box>
                      <Box sx={{
                        p: 4,
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.02), rgba(76, 175, 80, 0.01))',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        minHeight: 200,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        '&:hover': {
                          borderColor: 'success.main',
                          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(76, 175, 80, 0.02))',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 6px 20px rgba(76, 175, 80, 0.15)'
                        }
                      }}>
                        <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          🎨 Upload Logo
                        </Typography>
                        <Button 
                          variant="outlined" 
                          component="label" 
                          size="small" 
                          fullWidth
                          sx={{
                            borderRadius: 2,
                            borderStyle: 'dashed',
                            borderWidth: 2,
                            py: 1.5,
                            borderColor: 'success.main',
                            color: 'success.main',
                            background: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 1)',
                              borderColor: 'success.dark',
                              transform: 'scale(1.02)'
                            }
                          }}
                        >
                          Choose Logo
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]

                              if (file && validateImageFile(file, 5)) {
                                setPageSettings({...pageSettings, logo: file})
                              }
                            }}
                          />
                        </Button>
                        {pageSettings.logo && (
                          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                              width: 80,
                              height: 80,
                              borderRadius: 2,
                              border: '2px solid',
                              borderColor: 'success.light',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              background: 'rgba(255, 255, 255, 0.9)'
                            }}>
                              <img 
                                src={URL.createObjectURL(pageSettings.logo)}
                                alt="Logo Preview"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </Box>
                            <Chip 
                              label={pageSettings.logo.name} 
                              size="small" 
                              sx={{ 
                                background: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)',
                                color: 'success.dark',
                                fontWeight: 500,
                                '& .MuiChip-label': {
                                  fontSize: '11px'
                                }
                              }} 
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
              
              {/* SEO Section - Collapsed by default */}
              <Accordion 
                expanded={expandedAccordion === 'seo'}
                onChange={handleAccordionChange('seo')}
                sx={{ 
                mb: 3, 
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  boxShadow: '0 8px 32px rgba(156, 39, 176, 0.12)'
                }
              }}>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: 'secondary.main' }} />}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05), rgba(156, 39, 176, 0.02))',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    minHeight: 64,
                    '&.Mui-expanded': {
                      minHeight: 64,
                      background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08), rgba(156, 39, 176, 0.04))'
                    },
                    '& .MuiAccordionSummary-content': {
                      margin: '16px 0'
                    }
                  }}
                >
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    color: 'secondary.main',
                    fontSize: '16px'
                  }}>
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      🔍
                    </Box>
                    SEO Optimization
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3, background: 'rgba(248, 250, 252, 0.5)' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      label="Judul Tag"
                      value={pageSettings.titleTag}
                      onChange={(e) =>
                        setPageSettings({ ...pageSettings, titleTag: e.target.value })
                      }
                      size="small"
                      fullWidth
                      helperText="Judul yang muncul di google search"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.9)',
                          },
                          '&.Mui-focused': {
                            background: 'rgba(255, 255, 255, 1)',
                            boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)',
                          },
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: '10px',      // ukuran helperText
                          color: 'text.secondary',
                        },
                      }}
                    />

                    <TextField
                      label="Meta Description"
                      value={pageSettings.metaDescription}
                      onChange={(e) => setPageSettings({...pageSettings, metaDescription: e.target.value})}
                      size="small"
                      fullWidth
                      multiline
                      rows={3}
                      helperText="Deskripsi yang akan muncul di hasil pencarian"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.9)'
                          },
                          '&.Mui-focused': {
                            background: 'rgba(255, 255, 255, 1)',
                            boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)'
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: '10px',      // ukuran helperText
                          color: 'text.secondary',
                        },
                      }}
                    />
                    <TextField
                      label="Keyword Website"
                      value={pageSettings.keywords}
                      onChange={(e) => setPageSettings({...pageSettings, keywords: e.target.value})}
                      size="small"
                      fullWidth
                      helperText="Pisahkan dengan koma untuk multiple keywords"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.9)'
                          },
                          '&.Mui-focused': {
                            background: 'rgba(255, 255, 255, 1)',
                            boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)'
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: '10px',      // ukuran helperText
                          color: 'text.secondary',
                        },
                      }}
                    />
                    
                    {/* Meta Image Upload */}
                    <Box sx={{
                      p: 4,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 4,
                      background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.02), rgba(156, 39, 176, 0.01))',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      minHeight: 200,
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      '&:hover': {
                        borderColor: 'secondary.main',
                        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05), rgba(156, 39, 176, 0.02))',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 20px rgba(156, 39, 176, 0.15)'
                      }
                    }}>
                      <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        🖼️ Upload Meta Gambar
                      </Typography>
                      <Button 
                        variant="outlined" 
                        component="label" 
                        size="small" 
                        fullWidth
                        sx={{
                          borderRadius: 2,
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          py: 1.5,
                          borderColor: 'secondary.main',
                          color: 'secondary.main',
                          background: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 1)',
                            borderColor: 'secondary.dark',
                            transform: 'scale(1.02)'
                          }
                        }}
                      >
                        Choose Meta Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]

                            if (file && validateImageFile(file, 5)) {
                              setPageSettings({...pageSettings, metaImage: file})
                            }
                          }}
                        />
                      </Button>
                      <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                        jpg, jpeg, png, webp (Max 5MB)
                      </Typography>
                      {pageSettings.metaImage && (
                        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <Box sx={{
                            width: 120,
                            height: 80,
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: 'secondary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.9)'
                          }}>
                            <img 
                              src={URL.createObjectURL(pageSettings.metaImage)}
                              alt="Meta Image Preview"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </Box>
                          <Chip 
                            label={pageSettings.metaImage.name} 
                            size="small" 
                            sx={{ 
                              background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
                              color: 'secondary.dark',
                              fontWeight: 500,
                              '& .MuiChip-label': {
                                fontSize: '11px'
                              }
                            }} 
                          />
                        </Box>
                      )}
                    </Box>

                    {/* Google Search Preview */}
                    <Box
                      sx={{
                        mt: 4,
                        p: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      {/* Header Google Search */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          component="img"
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/36px-Google_%22G%22_logo.svg.png"
                          alt="Google"
                          sx={{ width: 18, height: 18, mr: 1 }}
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            fontSize: '14px',
                          }}
                        >
                          Google Search
                        </Typography>
                      </Box>

                      {/* Preview Box */}
                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          background: '#ffffff',
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="a"
                          sx={{
                            color: '#1a0dab',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {pageSettings.titleTag || pageSettings.pageName || 'Judul Halaman'}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="inherit"
                          sx={{ color: 'rgb(5, 107, 171)', fontSize: '11px', mt: 0.5 }}
                        >
                          {getFullPageUrl()}
                        </Typography>


                        <Typography
                          variant="body2"
                          sx={{ color: '#545454', fontSize: '11px', lineHeight: 1.4 }}
                        >
                          {pageSettings.metaDescription || 'Deskripsi halaman akan muncul di sini...'}
                        </Typography>
                      </Box>
                    </Box>


                    {/* Social Media Preview */}
                    <Box
                      sx={{
                        mt: 3,
                        p: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      {/* Header Social Media */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          component="img"
                          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                          alt="WhatsApp"
                          sx={{ width: 18, height: 18, mr: 1 }}
                        />
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: 'text.primary', fontSize: '14px' }}
                        >
                          Social Media
                        </Typography>
                      </Box>

                      {/* Preview Card */}
                      <Box
                        sx={{
                          display: 'flex',
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          overflow: 'hidden',
                          background: '#ffffff',
                          maxWidth: 400,
                        }}
                      >
                        {pageSettings.metaImage && (
                          <Box sx={{ width: 120, height: 80, flexShrink: 0 }}>
                            <img
                              src={URL.createObjectURL(pageSettings.metaImage)}
                              alt="Social Preview"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </Box>
                        )}

                        <Box
                          sx={{
                            p: 2,
                            flex: 1,
                            minHeight: 80,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              fontSize: '12px',
                              mb: 0.5,
                              lineHeight: 1.2,
                            }}
                          >
                            {pageSettings.titleTag || pageSettings.pageName || 'Judul Halaman'}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', fontSize: '11px', lineHeight: 1.3 }}
                          >
                            {pageSettings.metaDescription ||
                              'Deskripsi halaman akan muncul di sini...'}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{ color: '#00000', fontSize: '11px', mt: 0.5 }}
                          >
                            {getFullPageUrl().replace('https://', '')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <FormControl fullWidth size="small" sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.9)'
                        },
                        '&.Mui-focused': {
                          background: 'rgba(255, 255, 255, 1)',
                          boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)'
                        }
                      }
                    }}>
                      <InputLabel>Facebook Pixel</InputLabel>
                      <Select
                        value={pageSettings.facebookPixel}
                        onChange={(e) => setPageSettings({...pageSettings, facebookPixel: e.target.value})}
                        label="Facebook Pixel"
                        disabled={!pageSettings.selectedStore || loading.pixels}
                        startAdornment={loading.pixels ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                      >
                        <MenuItem value="">
                          <em>{loading.pixels ? 'Loading pixels...' : 'Pilih Facebook Pixel'}</em>
                        </MenuItem>
                        {pixels.filter(p => p.pixel_type === 'facebook_pixel').map((pixel) => (
                          <MenuItem key={pixel.uuid} value={pixel.uuid}>
                            {pixel.nama_pixel || 'Facebook Pixel'} - {pixel.pixel_id}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.9)'
                        },
                        '&.Mui-focused': {
                          background: 'rgba(255, 255, 255, 1)',
                          boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)'
                        }
                      }
                    }}>
                      <InputLabel>TikTok Pixel</InputLabel>
                      <Select
                        value={pageSettings.tiktokPixel}
                        onChange={(e) => setPageSettings({...pageSettings, tiktokPixel: e.target.value})}
                        label="TikTok Pixel"
                        disabled={!pageSettings.selectedStore || loading.pixels}
                        startAdornment={loading.pixels ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                      >
                        <MenuItem value="">
                          <em>{loading.pixels ? 'Loading pixels...' : 'Pilih TikTok Pixel'}</em>
                        </MenuItem>
                        {pixels.filter(p => p.pixel_type === 'tiktok_pixel').map((pixel) => (
                          <MenuItem key={pixel.uuid} value={pixel.uuid}>
                            {pixel.nama_pixel || 'TikTok Pixel'} - {pixel.pixel_id}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.9)'
                        },
                        '&.Mui-focused': {
                          background: 'rgba(255, 255, 255, 1)',
                          boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)'
                        }
                      }
                    }}>
                      <InputLabel>Google Tag Manager</InputLabel>
                      <Select
                        value={pageSettings.googleTagManager}
                        onChange={(e) => setPageSettings({...pageSettings, googleTagManager: e.target.value})}
                        label="Google Tag Manager"
                        disabled={!pageSettings.selectedStore || loading.pixels}
                        startAdornment={loading.pixels ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                      >
                        <MenuItem value="">
                          <em>{loading.pixels ? 'Loading pixels...' : 'Pilih Google Tag Manager'}</em>
                        </MenuItem>
                        {pixels.filter(p => p.pixel_type === 'google_tag_manager').map((pixel) => (
                          <MenuItem key={pixel.uuid} value={pixel.uuid}>
                            {pixel.nama_pixel || 'Google Tag Manager'} - {pixel.pixel_id}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </AccordionDetails>
              </Accordion>
              
              {/* Element Outline Section - Collapsed by default */}
              <Accordion 
                expanded={expandedAccordion === 'element'}
                onChange={handleAccordionChange('element')}
                sx={{ 
                mb: 3, 
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  boxShadow: '0 8px 32px rgba(255, 152, 0, 0.12)'
                }
              }}>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: 'warning.main' }} />}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(255, 152, 0, 0.02))',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    minHeight: 64,
                    '&.Mui-expanded': {
                      minHeight: 64,
                      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08), rgba(255, 152, 0, 0.04))'
                    },
                    '& .MuiAccordionSummary-content': {
                      margin: '16px 0'
                    }
                  }}
                >
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    color: 'warning.main',
                    fontSize: '16px'
                  }}>
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      📋
                    </Box>
                    Element Outline
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3, background: 'rgba(248, 250, 252, 0.5)' }}>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary', 
                    mb: 3,
                    fontSize: '13px',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    p: 2,
                    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(255, 152, 0, 0.02))',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'warning.light'
                  }}>
                    🔄 Drag elements to reorder within or between sections
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1, 
                    maxHeight: '140vh', 
                    overflow: 'auto',
                    p: 1,
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    {renderElementOutline()}
                  </Box>
                  
                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="medium"
                      onClick={() => addNewSection()}
                      sx={{
                        background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: 2,
                        py: 1.5,
                        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #f57c00, #ff9800)',
                          boxShadow: '0 6px 20px rgba(255, 152, 0, 0.4)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ➕ Add New Section
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}



        </Box>
        </Box>
      )}

      {/* Main Editor Area */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        minWidth: 0, // Prevents flex item from overflowing
        transition: 'all 0.3s ease'
      }}>
        {/* Top Controls Bar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          mb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'relative'
        }}>
          {/* Left - Sidebar Toggle & Advanced Edit Button */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <CustomIconButton 
              size="small" 
              color={drawerOpen ? 'primary' : 'secondary'}
              variant={drawerOpen ? 'contained' : 'outlined'}
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ 
                '&:hover': { 
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease',
                mr: 1
              }}
              title={drawerOpen ? 'Hide Sidebar' : 'Show Sidebar'}
            >
              <i className={drawerOpen ? 'tabler-menu-2' : 'tabler-menu'} />
            </CustomIconButton>
            <Button 
              size="small" 
              variant="outlined"
              color="primary"
              onClick={() => {
                // Convert to component mode for advanced editing
                setComponents([{
                  id: 'existing-content',
                  type: 'html_content',
                  content: initialData?.html || ''
                }])
              }}
            >
              Advanced Edit
            </Button>
          </Box>
          
          {/* Center - Device Preview Icons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1
          }}>
            <CustomIconButton 
              title="Desktop View"
              onClick={() => setViewMode('desktop')}
              color={viewMode === 'desktop' ? 'primary' : 'secondary'}
              variant={viewMode === 'desktop' ? 'contained' : 'outlined'}
              size="small"
            >
              <i className="tabler-device-desktop" />
            </CustomIconButton>
            <CustomIconButton 
              title="Tablet View"
              onClick={() => setViewMode('tablet')}
              color={viewMode === 'tablet' ? 'primary' : 'secondary'}
              variant={viewMode === 'tablet' ? 'contained' : 'outlined'}
              size="small"
            >
              <i className="tabler-device-tablet" />
            </CustomIconButton>
            <CustomIconButton 
              title="Mobile View"
              onClick={() => setViewMode('mobile')}
              color={viewMode === 'mobile' ? 'primary' : 'secondary'}
              variant={viewMode === 'mobile' ? 'contained' : 'outlined'}
              size="small"
            >
              <i className="tabler-device-mobile" />
            </CustomIconButton>
          </Box>
          
          {/* Right - Control Buttons */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Undo last change">
              <span>
                <CustomIconButton 
                  onClick={handleLocalUndo}
                  disabled={historyIndex <= 0}
                  color="primary"
                  variant="outlined"
                  size="small"
                >
                  <i className="tabler-arrow-back-up" />
                </CustomIconButton>
              </span>
            </Tooltip>
            
            <Tooltip title="Redo last change">
              <span>
                <CustomIconButton 
                  onClick={handleLocalRedo}
                  disabled={historyIndex >= htmlHistory.length - 1}
                  color="primary"
                  variant="outlined"
                  size="small"
                >
                  <i className="tabler-arrow-forward-up" />
                </CustomIconButton>
              </span>
            </Tooltip>
            
            <Tooltip title="Reset to original">
              <CustomIconButton 
                onClick={handleLocalReset}
                color="error"
                variant="outlined"
                size="small"
              >
                <i className="tabler-refresh" />
              </CustomIconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <i className="tabler-loader" /> : <i className="tabler-device-floppy" />}
              disabled={saving}
              onClick={() => onManualSave?.()}
              sx={{ 
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                ml: 1,
                textTransform: 'none',
                '&:hover': {
                  transform: saving ? 'none' : 'translateY(-1px)'
                },
                '& .tabler-loader': {
                  animation: 'spin 1s linear infinite'
                },
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>

        {/* Canvas */}
        <Box sx={{ p: 2 }}>
          <Canvas className="min-h-[60vh]">
          {/* Always render the iframe with edited HTML so drops merge into existing page */}
          {true ? (
            <Box sx={{ 
              width: '100%', 
              height: '150vh', 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              pt: 2,
              bgcolor: 'background.default',
              transition: 'all 0.3s ease',
              overflowX: 'hidden'
            }}>
              <Box sx={{
                width: viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '1200px',
                maxWidth: '100%',
                height: '100%',
                mx: 'auto',
                border: viewMode !== 'desktop' ? '1px solid' : 'none',
                borderColor: viewMode !== 'desktop' ? 'divider' : 'transparent',
                borderRadius: viewMode !== 'desktop' ? 2 : 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}>
                <iframe 
                  ref={(iframe) => {
                    if (iframe) {
                      iframe.onload = () => {
                        const doc = iframe.contentDocument;

                      if (doc) {
                        // Add inline editing capabilities
                        doc.body.addEventListener('click', (e) => {
                          const target = e.target as HTMLElement;
                          
                          // Clear previous selections & any existing handles before selecting new
                          doc.querySelectorAll('.selected-element').forEach((el: any) => {
                            el.classList.remove('selected-element');
                          });
                          doc.querySelectorAll('.ve-resize-handle, .ve-drag-handle').forEach((h: any) => h.remove());
                          
                          const blockElement = target.closest('div, section, header, footer, article, aside, main, nav, p, h1, h2, h3, h4, h5, h6, ul, ol, li, figure, figcaption, blockquote, button, a, img') as HTMLElement;

                          if (blockElement) {
                            blockElement.classList.add('selected-element');
                            setSelectedElement(blockElement);
                            setSelectedElementVersion(v => v + 1);
                            setSelectedTab(1); // Switch to Properties tab
                            // Attach handles
                            addHandles(blockElement);
                          }
                          
                          // Make text elements editable
                          if (target.tagName === 'H1' || target.tagName === 'H2' || target.tagName === 'H3' || target.tagName === 'P' || target.tagName === 'SPAN' || target.tagName === 'A') {
                            // Remove drag/resize while editing so 'Drag' text isn't captured
                            doc.querySelectorAll('.ve-drag-handle, .ve-resize-handle').forEach((n:any)=> n.remove());
                            e.preventDefault();
                            
                            target.contentEditable = 'true';
                            target.focus();
                            target.style.outline = '2px solid #3b82f6';

                            // Don't change backgroundColor that's already set by user
                            
                            target.addEventListener('blur', () => {
                              target.contentEditable = 'false';
                              target.style.outline = 'none';
                              
                              setEditedHtmlWithScrollPreservation(doc.body.innerHTML);

                              // Re-add handles on the nearest block container
                              const block = target.closest('div, section, header, footer, article, aside, main, nav, p, h1, h2, h3, h4, h5, h6, ul, ol, li, figure, figcaption, blockquote') as HTMLElement || target as HTMLElement;

                              if (block) setTimeout(()=> addHandles(block), 0);
                            });
                            
                            target.addEventListener('keydown', (e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                target.blur();
                              }
                            });
                          }
                          
                          // Make images replaceable - direct file explorer access
                          if (target.tagName === 'IMG') {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Create and trigger file input immediately
                            const input = doc.createElement('input');

                            input.type = 'file';
                            input.accept = 'image/*';
                            input.style.display = 'none';
                            
                            input.onchange = (event) => {
                              const file = (event.target as HTMLInputElement).files?.[0];

                              if (file) {
                                // Validate file type and size
                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

                                if (!allowedTypes.includes(file.type)) {
                                  alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
                                  
return;
                                }
                                
                                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                                  alert('File size must be less than 5MB');
                                  
return;
                                }
                                
                                const reader = new FileReader();

                                reader.onload = (loadEvent) => {
                                  if (loadEvent.target?.result) {
                                    (target as HTMLImageElement).src = loadEvent.target.result as string;
                                    (target as HTMLImageElement).alt = file.name;
                                    setEditedHtmlWithScrollPreservation(doc.body.innerHTML);
                                  }
                                };

                                reader.readAsDataURL(file);
                              }
                              
                              // Clean up
                              input.remove();
                            };
                            
                            // Add to DOM and trigger click
                            doc.body.appendChild(input);
                            input.click();
                          }
                        });
                        
                        // Add minimal visual indicators + handles styles
                        const style = doc.createElement('style');

                        style.textContent = `
                          /* Editable text elements - only border line (no bg/no shadow) */
                          h1:hover, h2:hover, h3:hover, p:hover, span:hover, a:hover {
                            cursor: text !important;
                            outline: 1px dashed rgba(59,130,246,0.7) !important;
                            outline-offset: 2px !important;
                          }
                          
                          /* Images - subtle hover effect */
                          img:hover {
                            cursor: pointer !important;
                            opacity: 0.9 !important;
                            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
                            border-radius: 4px !important;
                          }
                          
                          /* Selected element highlight (no background so color changes remain visible) */
                          .selected-element {
                            outline: 2px solid #8b5cf6 !important;
                            outline-offset: 2px !important;
                            position: relative !important;
                          }
                          
                          [contenteditable="true"] {
                            cursor: text !important;
                            outline: 2px solid #3b82f6 !important;
                            background-color: transparent !important;
                          }
                          
                          /* Editor component styling - only visible in editor */
                          .editor-component {
                            border: 2px dashed #e0e0e0 !important;
                            border-radius: 8px !important;
                          }
                          .editor-component:hover {
                            border-color: #3b82f6 !important;
                          }

                          /* Enhanced Resize/drag handles with improved image resizing */
                          .ve-resize-handle { position: absolute; width: 12px; height: 12px; background: #fff; border: 2px solid #8b5cf6; border-radius: 3px; z-index: 9999; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                          .ve-resize-handle.se { right: -7px; bottom: -7px; cursor: nwse-resize; }
                          .ve-resize-handle.ne { right: -7px; top: -7px; cursor: nesw-resize; }
                          .ve-resize-handle.sw { left: -7px; bottom: -7px; cursor: nesw-resize; }
                          .ve-resize-handle.nw { left: -7px; top: -7px; cursor: nwse-resize; }
                          .ve-resize-handle.e { right: -7px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
                          .ve-resize-handle.w { left: -7px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
                          .ve-resize-handle.s { bottom: -7px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
                          .ve-resize-handle.n { top: -7px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
                          
                          /* Component type indicators */
                          .editor-component::before { 
                            content: attr(data-component-type); 
                            position: absolute; 
                            top: -20px; 
                            left: 0; 
                            background: #8b5cf6; 
                            color: white; 
                            padding: 2px 8px; 
                            border-radius: 4px; 
                            font-size: 10px; 
                            font-weight: 600; 
                            text-transform: uppercase; 
                            opacity: 0; 
                            transition: opacity 0.2s ease; 
                            pointer-events: none; 
                            z-index: 1000;
                          }
                          .editor-component:hover::before { opacity: 1; }
                          
                          /* Better spacing for inline elements */
                          .editor-component + .editor-component { margin-left: 15px; }
                          .ve-drag-handle { position: absolute; left: 50%; top: -18px; transform: translateX(-50%); padding: 2px 6px; font-size: 11px; background: #8b5cf6; color: #fff; border-radius: 6px; user-select: none; cursor: grab; z-index: 9999; }
                        `;
                        doc.head.appendChild(style);

                        // Helpers to add resize/drag handles to selected element
                        const addHandles = (el: HTMLElement) => {
                          if (el.querySelector('.ve-resize-handle.se')) return;
                          const se = doc.createElement('div');

 se.className = 've-resize-handle se';
                          const ne = doc.createElement('div');

 ne.className = 've-resize-handle ne';
                          const sw = doc.createElement('div');

 sw.className = 've-resize-handle sw';
                          const nw = doc.createElement('div');

 nw.className = 've-resize-handle nw';
                          const eH = doc.createElement('div');

 eH.className = 've-resize-handle e';
                          const wH = doc.createElement('div');

 wH.className = 've-resize-handle w';
                          const sH = doc.createElement('div');

 sH.className = 've-resize-handle s';
                          const nH = doc.createElement('div');

 nH.className = 've-resize-handle n';
                          const drag = doc.createElement('div');

 drag.className = 've-drag-handle'; drag.textContent = 'Drag';
                          el.appendChild(se); el.appendChild(ne); el.appendChild(sw); el.appendChild(nw); el.appendChild(eH); el.appendChild(wH); el.appendChild(sH); el.appendChild(nH); el.appendChild(drag);

                          let startX = 0, startY = 0, startW = 0, startH = 0;

                          const beginResize = (evt: MouseEvent, mode: 'se'|'ne'|'sw'|'nw'|'e'|'w'|'s'|'n') => {
                            evt.preventDefault();
                            startX = evt.clientX; startY = evt.clientY; startW = el.clientWidth; startH = el.clientHeight;
                            const isImage = el.tagName === 'IMG' || el.querySelector('img');
                            const minW = isImage ? 50 : 100;
                            const minH = isImage ? 50 : 80;
                            
                            const move = (e2: MouseEvent) => {
                              const dx = e2.clientX - startX; const dy = e2.clientY - startY;
                              let newW = startW; let newH = startH;

                              if (mode === 'e') newW = startW + dx;
                              if (mode === 'w') newW = startW - dx;
                              if (mode === 's') newH = startH + dy;
                              if (mode === 'n') newH = startH - dy;
                              if (mode === 'se') { newW = startW + dx; newH = startH + dy; }
                              if (mode === 'ne') { newW = startW + dx; newH = startH - dy; }
                              if (mode === 'sw') { newW = startW - dx; newH = startH + dy; }
                              if (mode === 'nw') { newW = startW - dx; newH = startH - dy; }
                              
                              // Apply minimum constraints
                              newW = Math.max(minW, newW);
                              newH = Math.max(minH, newH);
                              
                              // For images, maintain aspect ratio when shift is held
                              if (isImage && evt.shiftKey) {
                                const aspectRatio = startW / startH;

                                if (mode.includes('e') || mode.includes('w')) {
                                  newH = newW / aspectRatio;
                                } else if (mode.includes('n') || mode.includes('s')) {
                                  newW = newH * aspectRatio;
                                }
                              }
                              
                              (el as any).style.width = newW + 'px';
                              (el as any).style.height = newH + 'px';
                            };

                            const up = () => {
                              doc.removeEventListener('mousemove', move);
                              doc.removeEventListener('mouseup', up);

                              // Update inline style attributes so value/inspector reflects size
                              const rect = el.getBoundingClientRect();

                              (el as any).style.width = rect.width + 'px';
                              (el as any).style.height = rect.height + 'px';
                              setEditedHtmlWithScrollPreservation(doc.body.innerHTML);
                              setSelectedElementVersion(v => v + 1);
                            };

                            doc.addEventListener('mousemove', move);
                            doc.addEventListener('mouseup', up);
                          };

                          se.addEventListener('mousedown', (e: any) => beginResize(e, 'se'));
                          ne.addEventListener('mousedown', (e: any) => beginResize(e, 'ne'));
                          sw.addEventListener('mousedown', (e: any) => beginResize(e, 'sw'));
                          nw.addEventListener('mousedown', (e: any) => beginResize(e, 'nw'));
                          eH.addEventListener('mousedown', (e: any) => beginResize(e, 'e'));
                          wH.addEventListener('mousedown', (e: any) => beginResize(e, 'w'));
                          sH.addEventListener('mousedown', (e: any) => beginResize(e, 's'));
                          nH.addEventListener('mousedown', (e: any) => beginResize(e, 'n'));

                          // Drag vertically to reorder between sections
                          // Show drag/resize only when selected and hide when deselected
                          const clearHandles = () => {
                            el.querySelectorAll('.ve-resize-handle, .ve-drag-handle').forEach(h => h.remove());
                          };

                          // Click outside deselects and removes handles
                          const outsideClick = (ev: any) => {
                            const inside = el.contains(ev.target as Node);
                            const isHandle = (ev.target as HTMLElement).classList?.contains('ve-drag-handle') || (ev.target as HTMLElement).classList?.contains('ve-resize-handle');

                            if (!inside && !isHandle && el.classList.contains('selected-element')) {
                              el.classList.remove('selected-element');
                              clearHandles();
                              doc.removeEventListener('click', outsideClick);
                            }
                          };

                          doc.addEventListener('click', outsideClick);

                          // Drag handle now triggers element reordering (no absolute positioning)
                          drag.addEventListener('pointerdown', (evt: any) => {
                            evt.preventDefault();
                            const draggableElement = el as HTMLElement;

                            draggableElement.draggable = true;
                            draggableElement.style.opacity = '0.7';
                            draggableElement.style.cursor = 'grabbing';

                            const dragStartHandler = (e: DragEvent) => {
                              e.dataTransfer!.setData('internal-drag', 'true');
                              e.dataTransfer!.setData('element-html', draggableElement.outerHTML);
                              e.dataTransfer!.effectAllowed = 'move';
                            };

                            const dragEndHandler = () => {
                              draggableElement.draggable = false;
                              draggableElement.style.opacity = '';
                              draggableElement.style.cursor = '';
                              draggableElement.removeEventListener('dragstart', dragStartHandler);
                              draggableElement.removeEventListener('dragend', dragEndHandler);
                            };

                            draggableElement.addEventListener('dragstart', dragStartHandler);
                            draggableElement.addEventListener('dragend', dragEndHandler);
                          });

                          // Double click drag label to reset size to responsive defaults
                          drag.addEventListener('dblclick', (ev: any) => {
                            (el as any).style.width = '100%';
                            (el as any).style.height = 'auto';
                            setEditedHtmlWithScrollPreservation(doc.body.innerHTML);
                            setSelectedElementVersion(v => v + 1);
                          });
                        };
                        
                        // Add keyboard delete functionality for selected elements
                        doc.addEventListener('keydown', (e) => {
                          if (e.key === 'Delete') {
                            const selectedElement = doc.querySelector('.selected-element');

                            if (selectedElement) {
                              e.preventDefault();
                              
                              // Show confirmation dialog
                              const elementName = selectedElement.tagName.toLowerCase();
                              const elementText = selectedElement.textContent?.substring(0, 50) || 'element';
                              const truncatedText = elementText.length > 50 ? elementText + '...' : elementText;
                              
                              if (confirm(`Are you sure you want to delete this ${elementName} element?\n\n"${truncatedText}"\n\nThis action cannot be undone.`)) {
                                // Remove the element
                                selectedElement.remove();
                                
                                // Update HTML state
                                setEditedHtmlWithScrollPreservation(doc.body.innerHTML);
                                
                                // Clear selection
                                setSelectedElement(null);
                                
                                // Update outline
                                updateElementOutline();
                                
                                // Show success notification
                                const notification = doc.createElement('div');

                                notification.style.cssText = `
                                  position: fixed;
                                  top: 20px;
                                  right: 20px;
                                  background: #dc2626;
                                  color: white;
                                  padding: 12px 16px;
                                  border-radius: 6px;
                                  font-family: system-ui;
                                  font-size: 14px;
                                  font-weight: 500;
                                  z-index: 10000;
                                  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                `;
                                notification.textContent = `✓ ${elementName.charAt(0).toUpperCase() + elementName.slice(1)} element deleted`;
                                doc.body.appendChild(notification);
                                
                                setTimeout(() => {
                                  if (notification.parentNode) {
                                    notification.remove();
                                  }
                                }, 3000);
                              }
                            }
                          }
                        });
                        
                        // Add ALT+Drag functionality for reordering elements
                        let isDragging = false;
                        
                        doc.body.addEventListener('mousedown', (e) => {
                          if (e.altKey) {
                            const target = e.target as HTMLElement;
                            const draggableElement = target.closest('div, section, header, footer, article, aside, main, nav, p, h1, h2, h3, h4, h5, h6, ul, ol, li, figure, figcaption, blockquote, button, a, img') as HTMLElement;
                            
                            if (draggableElement) {
                              e.preventDefault();
                              draggableElement.draggable = true;
                              draggableElement.style.opacity = '0.7';
                              draggableElement.style.cursor = 'grabbing';
                              isDragging = true;
                              
                              const dragStartHandler = (e: DragEvent) => {
                                e.dataTransfer!.setData('internal-drag', 'true');
                                e.dataTransfer!.setData('element-html', draggableElement.outerHTML);
                                e.dataTransfer!.effectAllowed = 'move';
                              };
                              
                              const dragEndHandler = () => {
                                draggableElement.draggable = false;
                                draggableElement.style.opacity = '';
                                draggableElement.style.cursor = '';
                                isDragging = false;
                                draggableElement.removeEventListener('dragstart', dragStartHandler);
                                draggableElement.removeEventListener('dragend', dragEndHandler);
                              };
                              
                              draggableElement.addEventListener('dragstart', dragStartHandler);
                              draggableElement.addEventListener('dragend', dragEndHandler);
                            }
                          }
                        });
                        
                        // Add drop zone functionality to iframe
                        doc.addEventListener('dragover', (e) => {
                          e.preventDefault();
                          
                          // Handle internal drag (reordering)
                          if (e.dataTransfer!.types.includes('internal-drag')) {
                            e.dataTransfer!.dropEffect = 'move';
                            
                            const target = e.target as HTMLElement;
                            const dropTarget = target.closest('div, section, header, footer, article, aside, main, nav, p, h1, h2, h3, h4, h5, h6, ul, ol, li, figure, figcaption, blockquote, button, a, img') as HTMLElement;

                            if (dropTarget && !dropTarget.draggable) {
                              // Clear all previous indicators
                              doc.querySelectorAll('[style*="border-top"]').forEach((el: any) => {
                                el.style.borderTop = '';
                              });
                              dropTarget.style.borderTop = '3px solid #8b5cf6';
                            }
                          } else {
                            // Handle external drag (from sidebar)
                            e.dataTransfer!.dropEffect = 'copy';
                            
                            // Add visual feedback
                            doc.body.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
                            doc.body.style.border = '3px dashed #8b5cf6';
                          }
                        });
                        
                        doc.addEventListener('dragleave', (e) => {
                          // Only remove highlight if we're leaving the document entirely
                          if (!doc.body.contains(e.relatedTarget as Node)) {
                            doc.body.style.backgroundColor = '';
                            doc.body.style.border = '';
                          }
                        });
                        
                        doc.addEventListener('drop', (e) => {
                          e.preventDefault();
                          
                          // Remove visual feedback
                          doc.body.style.backgroundColor = '';
                          doc.body.style.border = '';
                          
                          // Clear border indicators
                          doc.querySelectorAll('[style*="border-top"]').forEach((el: any) => {
                            el.style.borderTop = '';
                          });
                          
                          // Handle internal drag (reordering)
                          if (e.dataTransfer!.types.includes('internal-drag')) {
                            const elementHtml = e.dataTransfer!.getData('element-html');
                            const target = e.target as HTMLElement;
                            const dropTarget = target.closest('div, section, header, footer, article, aside, main, nav, p, h1, h2, h3, h4, h5, h6, ul, ol, li, figure, figcaption, blockquote, button, a, img') as HTMLElement;
                            
                            if (dropTarget && elementHtml) {
                              // Find the original element to remove
                              const tempDiv = doc.createElement('div');

                              tempDiv.innerHTML = elementHtml;
                              const elementToMove = tempDiv.firstElementChild as HTMLElement;
                              
                              // Find original in DOM and remove it
                              const allElements = Array.from(doc.querySelectorAll('div, section, header, footer'));
                              const originalElement = allElements.find(el => el.outerHTML === elementHtml);
                              
                              if (originalElement && originalElement !== dropTarget) {
                                // Insert before drop target
                                dropTarget.parentNode?.insertBefore(elementToMove, dropTarget);
                                originalElement.remove();
                                
                                setEditedHtmlWithScrollPreservation(doc.body.innerHTML);
                                
                                // Show success notification
                                const notification = doc.createElement('div');

                                notification.style.cssText = `
                                  position: fixed;
                                  top: 20px;
                                  right: 20px;
                                  background: #10b981;
                                  color: white;
                                  padding: 12px 20px;
                                  border-radius: 8px;
                                  font-weight: 600;
                                  z-index: 1000;
                                  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                `;
                                notification.textContent = '✓ Element reordered successfully!';
                                doc.body.appendChild(notification);
                                
                                setTimeout(() => {
                                  notification.remove();
                                }, 2000);
                              }
                            }

                            
return;
                          }
                          
                          // Handle external drag (components from sidebar)
                          const componentType = e.dataTransfer!.getData('component-type');
                          const componentLabel = e.dataTransfer!.getData('component-label');
                          
                          if (componentType) {
                            // Get accurate drop position with iframe offset
                            const target = e.target as HTMLElement;
                            const iframeRect = iframe.getBoundingClientRect();
                            const dropY = e.clientY - iframeRect.top;
                            
                            // Determine precise insertion position
                            let insertTarget = target;
                            let insertPosition: 'before' | 'after' = 'after';
                            
                            // Find the closest block element for better positioning
                            const blockElement = target.closest('div, section, header, footer, article, aside, main, nav, p, h1, h2, h3, h4, h5, h6, ul, ol, li, figure, figcaption, blockquote, button, a, img, .editor-component') as HTMLElement;
                            
                            if (blockElement) {
                              insertTarget = blockElement;
                              const blockRect = blockElement.getBoundingClientRect();
                              const blockCenterY = blockRect.top + blockRect.height / 2;

                              insertPosition = dropY + iframeRect.top < blockCenterY ? 'before' : 'after';
                            } else {
                              // If no block element found, insert at cursor position
                              const bodyChildren = Array.from(doc.body.children) as HTMLElement[];
                              const insertIndex = bodyChildren.length;
                              
                              for (let i = 0; i < bodyChildren.length; i++) {
                                const childRect = bodyChildren[i].getBoundingClientRect();

                                if (dropY + iframeRect.top < childRect.top + childRect.height / 2) {
                                  insertTarget = bodyChildren[i];
                                  insertPosition = 'before';
                                  break;
                                }
                              }
                            }
                            
                            // Create and insert new component
                            const newElement = createComponentElement(componentType);
                            
                            if (insertPosition === 'before') {
                              insertTarget.parentNode?.insertBefore(newElement, insertTarget);
                            } else {
                              insertTarget.parentNode?.insertBefore(newElement, insertTarget.nextSibling);
                            }
                            
                            // Update both HTML and components state
                            const updatedHtml = doc.body.innerHTML;

                            setEditedHtml(updatedHtml);
                            
                            // Force manual update of iframe if needed
                            setTimeout(() => {
                              const checkIframe = document.querySelector('iframe[title="Landing Page Editor"]') as HTMLIFrameElement;

                              if (checkIframe?.contentDocument) {
                                const checkDoc = checkIframe.contentDocument;

                                if (checkDoc.body.innerHTML !== updatedHtml) {
                                  checkDoc.body.innerHTML = updatedHtml;
                                }
                              }
                            }, 100);

                            // Do not push into components array to avoid placeholder canvas mode
                            
                            // Show success feedback
                            const notification = doc.createElement('div');

                            notification.style.cssText = `
                              position: fixed;
                              top: 20px;
                              right: 20px;
                              background: #10b981;
                              color: white;
                              padding: 12px 20px;
                              border-radius: 8px;
                              font-weight: 600;
                              z-index: 1000;
                              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                            `;
                            notification.textContent = `✓ ${componentLabel} added ${insertPosition} element!`;
                            doc.body.appendChild(notification);
                            
                            setTimeout(() => {
                              notification.remove();
                            }, 2000);
                          }
                        });
                        
                        // Initialize element outline after page loads
                        setTimeout(() => {
                          updateElementOutline();
                        }, 100);
                      }
                    };
                  }
                }}
                title="Landing Page Editor"
                                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8"/>
                      <meta name="viewport" content="width=device-width, initial-scale=1"/>
                      <style>
                        ${initialData?.css || ''}
                        /* Guardrails agar canvas tidak melebar */
                        *, *::before, *::after { box-sizing: border-box; }
                        html, body { width: 100%; max-width: 100%; overflow-x: hidden !important; }
                        img, video, canvas, svg { max-width: 100%; height: auto; }
                        body { margin: 0; padding: 0; }
                      </style>
                    </head>
                    <body>
                      <div id="editor-canvas" style="max-width: ${viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '1200px'}; width: 100%; margin: 0 auto; overflow-x: hidden;">
                        ${editedHtml || initialData?.html || ''}
                      </div>
                    </body>
                  </html>
                `}
              />
              </Box>
            </Box>
          ) : components.length === 0 ? (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 8,
                px: 4,
                border: '3px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                bgcolor: 'background.default',
                margin: 4,
                transition: 'all 0.3s ease',
                width: 'calc(100% - 32px)', // Account for margin
                maxWidth: '100%',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.lighterOpacity'
                }
              }}
            >
              <Box sx={{ fontSize: '64px', mb: 2, opacity: 0.6 }}>🎨</Box>
              <Typography variant="h5" sx={{ mb: 2, color: 'text.primary', fontWeight: 600 }}>
                Start Building Your Landing Page
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3, maxWidth: '400px', mx: 'auto', lineHeight: 1.6 }}>
                Drag and drop components from the sidebar or click to add them to your page. 
                Create beautiful landing pages in minutes!
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 4 }}>
                <Button 
                  variant="contained" 
                  startIcon="🏆"
                  onClick={() => handleAddComponent(COMPONENT_TYPES.HERO_HEADER)}
                  sx={{ 
                    bgcolor: '#8b5cf6', 
                    '&:hover': { bgcolor: '#7c3aed' },
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Add Hero Section
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon="📝"
                  onClick={() => handleAddComponent(COMPONENT_TYPES.TEXT)}
                  sx={{ 
                    borderColor: '#8b5cf6', 
                    color: '#8b5cf6',
                    '&:hover': { 
                      borderColor: '#7c3aed',
                      backgroundColor: 'rgba(139, 92, 246, 0.05)'
                    },
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Add Text
                </Button>
              </Box>
              <Typography variant="caption" sx={{ 
                display: 'block', 
                mt: 3, 
                color: '#9ca3af',
                fontStyle: 'italic'
              }}>
                💡 Tip: Drag components directly from the sidebar for faster building
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {components.map((component) => (
                <EditableComponent
                  key={component.id}
                  component={component}
                  onUpdate={(newData) => updateComponent(component.id, newData)}
                  onDelete={() => deleteComponent(component.id)}
                  onSelect={(comp) => setSelectedComponent(comp)}
                />
              ))}
            </Box>
          )}
        </Canvas>
        </Box>
      </Box>


    </Box>
  )
}
