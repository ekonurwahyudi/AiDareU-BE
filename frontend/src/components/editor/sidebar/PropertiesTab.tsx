'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Slider from '@mui/material/Slider'
import IconButton from '@mui/material/IconButton'
import { RgbaColorPicker, HexColorInput } from 'react-colorful'

import TiptapEditor from '../TiptapEditor'

interface PropertiesTabProps {
  selectedElement: any
  selectedComponent: any
  colorEditorTab: 'solid' | 'gradient'
  onColorEditorTabChange: (tab: 'solid' | 'gradient') => void
  solidColor: { r: number; g: number; b: number; a: number }
  onSolidColorChange: (color: { r: number; g: number; b: number; a: number }) => void
  gradientStops: Array<{ id: string; color: { r: number; g: number; b: number; a: number }; position: number }>
  onGradientStopsChange: (stops: Array<{ id: string; color: { r: number; g: number; b: number; a: number }; position: number }>) => void
  activeStopId: string
  onActiveStopIdChange: (id: string) => void
  gradientAngle: number
  onGradientAngleChange: (angle: number) => void
  gradientType: 'linear' | 'radial'
  onGradientTypeChange: (type: 'linear' | 'radial') => void
  onApplySolid: (color: { r: number; g: number; b: number; a: number }) => void
  onApplyGradient: (stops?: Array<{ id: string; color: { r: number; g: number; b: number; a: number }; position: number }>, angle?: number, type?: 'linear' | 'radial') => void
  onEditedHtmlChange: (html: string) => void
  selectedElementVersion: number
  onSelectedElementVersionChange: (version: number) => void
  onUpdateComponent: (id: string, data: any) => void
  onSelectedComponentChange: (component: any) => void
  onClearSelection: () => void
}

export default function PropertiesTab({
  selectedElement,
  selectedComponent,
  colorEditorTab,
  onColorEditorTabChange,
  solidColor,
  onSolidColorChange,
  gradientStops,
  onGradientStopsChange,
  activeStopId,
  onActiveStopIdChange,
  gradientAngle,
  onGradientAngleChange,
  gradientType,
  onGradientTypeChange,
  onApplySolid,
  onApplyGradient,
  onEditedHtmlChange,
  selectedElementVersion,
  onSelectedElementVersionChange,
  onUpdateComponent,
  onSelectedComponentChange,
  onClearSelection
}: PropertiesTabProps) {

  // Helper functions
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

  return (
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
          
          {/* Button/Link Specific Properties */}
          {(selectedElement.tagName === 'A' || selectedElement.tagName === 'BUTTON' || selectedElement.hasAttribute('data-editable-link')) && (
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
                    value={selectedElement.textContent || selectedElement.innerText || ''}
                    placeholder={selectedElement.tagName === 'A' ? "📱 WhatsApp" : "Enter button text"}
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
                      // Update both textContent and innerText for better compatibility
                      selectedElement.textContent = e.target.value;
                      selectedElement.innerText = e.target.value;
                      onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                    {selectedElement.tagName === 'A' ? 'Link URL' : 'Button URL'}
                  </Typography>
                  <TextField
                    value={selectedElement.tagName === 'A' 
                      ? (selectedElement.getAttribute('href') || '') 
                      : (selectedElement.getAttribute('data-url') || selectedElement.getAttribute('onclick') || '')
                    }
                    placeholder={selectedElement.tagName === 'A' ? "https://wa.me/62812345678901?text=Hello, I want" : "javascript:void(0) or data action"}
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
                      if (selectedElement.tagName === 'A') {
                        selectedElement.setAttribute('href', e.target.value);
                      } else {
                        selectedElement.setAttribute('data-url', e.target.value);
                      }
                      onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                            onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                        onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                        onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                            onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                    key={`${selectedElement?.tagName}-${selectedElementVersion}-${selectedElement?.textContent?.slice(0, 10)}`}
                    content={value}
                    onChange={(content) => {
                      selectedElement.querySelectorAll?.('.ve-drag-handle, .ve-resize-handle').forEach((n:any)=> n.remove())
                      selectedElement.innerHTML = content
                      onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML)
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
                onChange={(e, v) => onColorEditorTabChange(v === 0 ? 'solid' : 'gradient')}
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
                      onChange={(c) => { onSolidColorChange(c as any); onApplySolid(c as any) }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: 1, border: '1px solid #e5e7eb', background: `rgb(${solidColor.r}, ${solidColor.g}, ${solidColor.b})` }} />
                      <HexColorInput
                        color={rgbToHex(solidColor.r, solidColor.g, solidColor.b)}
                        onChange={(val) => {
                          const rgb = hexToRgb(val)
                          if (!rgb) return
                          const next = { ...solidColor, ...rgb }
                          onSolidColorChange(next)
                          onApplySolid(next as any)
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
                        onSolidColorChange(next)
                        onApplySolid(next)
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
                      <Box key={s.id} onClick={()=> onActiveStopIdChange(s.id)} sx={{
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
                      onGradientStopsChange(next)
                      onActiveStopIdChange(newId)
                      onApplyGradient(next)
                    }}>
                      <i className="tabler-plus"/>
                    </IconButton>
                    {gradientStops.length > 2 && (
                      <IconButton size="small" color="error" onClick={()=>{
                        const next = gradientStops.filter(s=>s.id!==activeStopId)
                        onGradientStopsChange(next)
                        onActiveStopIdChange(next[0]?.id || '')
                        onApplyGradient(next)
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
                            onGradientStopsChange(next)
                            onApplyGradient(next)
                          }} />
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>Transparency</Typography>
                            <Slider size="small" value={Math.round((current.color.a||0)*100)} onChange={(e,v:any)=>{
                              const next = gradientStops.map(s=> s.id===current.id ? { ...s, color: { ...s.color, a: (Array.isArray(v)?v[0]:v)/100 } } : s)
                              onGradientStopsChange(next)
                              onApplyGradient(next)
                            }} valueLabelDisplay="auto" min={0} max={100} />
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>Stop position ({Math.round(current.position)}%)</Typography>
                          <Slider size="small" value={current.position} onChange={(e, v:any)=>{
                            const next = gradientStops.map(s=> s.id===current.id ? { ...s, position: clamp(0,100,Array.isArray(v)?v[0]:v) } : s)
                            onGradientStopsChange(next)
                            onApplyGradient(next)
                          }} valueLabelDisplay="auto" min={0} max={100} />
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
                            <Button size="small" variant={gradientType==='linear'?'contained':'outlined'} onClick={()=>{ onGradientTypeChange('linear'); onApplyGradient(gradientStops, gradientAngle, 'linear') }}>Linear</Button>
                            <Button size="small" variant={gradientType==='radial'?'contained':'outlined'} onClick={()=>{ onGradientTypeChange('radial'); onApplyGradient(gradientStops, gradientAngle, 'radial') }}>Radial</Button>
                          </Box>
                          {gradientType==='linear' && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>Angle ({gradientAngle}°)</Typography>
                              <Slider size="small" value={gradientAngle} onChange={(e, v:any)=>{ onGradientAngleChange(Array.isArray(v)?v[0]:v); onApplyGradient(gradientStops, Array.isArray(v)?v[0]:v) }} valueLabelDisplay="auto" min={0} max={360} />
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
                    onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                        onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                      onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                      onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
                    }
                  }}
                />
              </Box>
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
                      onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                          onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                      onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
                          onEditedHtmlChange(selectedElement.ownerDocument.body.innerHTML);
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
              onClick={onClearSelection}
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
                onSelectedComponentChange({ ...selectedComponent, content: e.target.value })
                onUpdateComponent(selectedComponent.id, { content: e.target.value })
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
                  onSelectedComponentChange({ ...selectedComponent, src: e.target.value })
                  onUpdateComponent(selectedComponent.id, { src: e.target.value })
                }}
                size="small"
              />
              <TextField
                label="Alt Text"
                value={selectedComponent.alt || ''}
                onChange={(e) => {
                  onSelectedComponentChange({ ...selectedComponent, alt: e.target.value })
                  onUpdateComponent(selectedComponent.id, { alt: e.target.value })
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
                  onSelectedComponentChange({ ...selectedComponent, text: e.target.value })
                  onUpdateComponent(selectedComponent.id, { text: e.target.value })
                }}
                size="small"
              />
              <TextField
                label="Button URL"
                value={selectedComponent.url || ''}
                onChange={(e) => {
                  onSelectedComponentChange({ ...selectedComponent, url: e.target.value })
                  onUpdateComponent(selectedComponent.id, { url: e.target.value })
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
  )
}