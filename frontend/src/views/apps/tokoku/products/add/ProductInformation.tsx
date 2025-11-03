'use client'

// React Imports
import { useEffect, useState, useRef } from 'react'

// MUI Imports
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import FormHelperText from '@mui/material/FormHelperText'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { BulletList } from '@tiptap/extension-bullet-list'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { ListItem } from '@tiptap/extension-list-item'
import { Highlight } from '@tiptap/extension-highlight'
import { FontSize } from 'tiptap-extension-font-size'
import type { Editor } from '@tiptap/core'

// Context Imports
import { useProductForm } from '@/contexts/ProductFormContext'

// Components Imports
import CustomIconButton from '@core/components/mui/IconButton'
import CustomTextField from '@core/components/mui/TextField'

// Style Imports
import '@/libs/styles/tiptapEditor.css'

const HiddenFileInput = styled('input')({
  display: 'none',
});

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const [colorMenuAnchor, setColorMenuAnchor] = useState<null | HTMLElement>(null)
  const [highlightMenuAnchor, setHighlightMenuAnchor] = useState<null | HTMLElement>(null)
  const [linkMenuAnchor, setLinkMenuAnchor] = useState<null | HTMLElement>(null)
  const [fontSizeMenuAnchor, setFontSizeMenuAnchor] = useState<null | HTMLElement>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add image resize functionality
  useEffect(() => {
    if (!editor) return

    // Store references for cleanup
    const imageClickHandlers = new WeakMap()
    let isProcessing = false

    const addResizeHandles = (img: HTMLImageElement) => {
      // Skip if already processed
      if (img.parentElement?.classList.contains('image-wrapper')) return
      if (imageClickHandlers.has(img)) return

      // Prevent processing during DOM modifications
      if (isProcessing) return

      // Create wrapper
      const wrapper = document.createElement('div')
      wrapper.className = 'image-wrapper'
      wrapper.style.cssText = 'position: relative; display: inline-block; max-width: 100%;'

      // Wrap the image
      isProcessing = true
      img.parentNode?.insertBefore(wrapper, img)
      wrapper.appendChild(img)

      // Use setTimeout to ensure DOM is fully updated before clearing flag
      setTimeout(() => {
        isProcessing = false
      }, 0)

      // Add click handler to show resize handles
      const handleImageClick = (e: Event) => {
        e.stopPropagation()

        // Remove selected class from other images (more efficient)
        const selectedWrappers = editor.view.dom.querySelectorAll('.image-wrapper.selected')
        selectedWrappers.forEach(el => {
          el.classList.remove('selected')
          el.querySelectorAll('.resize-handle').forEach(handle => handle.remove())
        })

        // Add selected class and handles to this image
        wrapper.classList.add('selected')
        createResizeHandles(wrapper, img)
      }

      img.addEventListener('click', handleImageClick)
      imageClickHandlers.set(img, handleImageClick)
    }

      const createResizeHandles = (wrapper: HTMLElement, img: HTMLImageElement) => {
        // Remove existing handles
        wrapper.querySelectorAll('.resize-handle').forEach(handle => handle.remove())

        const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']

        handles.forEach(position => {
          const handle = document.createElement('div')
          handle.className = `resize-handle ${position}`
          handle.style.cssText = `
            position: absolute;
            background: #2196F3;
            border: 2px solid white;
            border-radius: 3px;
            width: 12px;
            height: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            z-index: 10;
            cursor: ${position.includes('n') ? (position.includes('w') ? 'nw-resize' : position.includes('e') ? 'ne-resize' : 'n-resize') :
                     position.includes('s') ? (position.includes('w') ? 'sw-resize' : position.includes('e') ? 'se-resize' : 's-resize') :
                     position.includes('w') ? 'w-resize' : 'e-resize'};
          `

          // Position the handle
          switch (position) {
            case 'nw': handle.style.cssText += 'top: -6px; left: -6px;'; break
            case 'ne': handle.style.cssText += 'top: -6px; right: -6px;'; break
            case 'sw': handle.style.cssText += 'bottom: -6px; left: -6px;'; break
            case 'se': handle.style.cssText += 'bottom: -6px; right: -6px;'; break
            case 'n': handle.style.cssText += 'top: -6px; left: 50%; transform: translateX(-50%);'; break
            case 's': handle.style.cssText += 'bottom: -6px; left: 50%; transform: translateX(-50%);'; break
            case 'w': handle.style.cssText += 'top: 50%; left: -6px; transform: translateY(-50%);'; break
            case 'e': handle.style.cssText += 'top: 50%; right: -6px; transform: translateY(-50%);'; break
          }

          // Add resize functionality
          handle.addEventListener('mousedown', (e) => startResize(e, img, position))
          wrapper.appendChild(handle)
        })
      }

      const startResize = (e: MouseEvent, img: HTMLImageElement, direction: string) => {
        e.preventDefault()
        e.stopPropagation()

        const startX = e.clientX
        const startY = e.clientY
        const startWidth = img.offsetWidth
        const startHeight = img.offsetHeight
        const aspectRatio = startWidth / startHeight

        const handleMouseMove = (e: MouseEvent) => {
          const deltaX = e.clientX - startX
          const deltaY = e.clientY - startY

          let newWidth = startWidth
          let newHeight = startHeight

          switch (direction) {
            case 'se':
              newWidth = startWidth + deltaX
              newHeight = startHeight + deltaY
              break
            case 'sw':
              newWidth = startWidth - deltaX
              newHeight = startHeight + deltaY
              break
            case 'ne':
              newWidth = startWidth + deltaX
              newHeight = startHeight - deltaY
              break
            case 'nw':
              newWidth = startWidth - deltaX
              newHeight = startHeight - deltaY
              break
            case 'e':
              newWidth = startWidth + deltaX
              break
            case 'w':
              newWidth = startWidth - deltaX
              break
            case 'n':
              newHeight = startHeight - deltaY
              break
            case 's':
              newHeight = startHeight + deltaY
              break
          }

          // Maintain aspect ratio for corner handles
          if (['se', 'sw', 'ne', 'nw'].includes(direction)) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              newHeight = newWidth / aspectRatio
            } else {
              newWidth = newHeight * aspectRatio
            }
          }

          // Apply constraints
          newWidth = Math.max(50, Math.min(800, newWidth))
          newHeight = Math.max(50, Math.min(600, newHeight))

          // Apply new dimensions
          img.style.width = `${newWidth}px`
          img.style.height = `${newHeight}px`
        }

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
      }

      // Process existing images
      const processImages = () => {
        if (isProcessing) return

        const images = editor.view.dom.querySelectorAll('img.editor-image')
        images.forEach((img) => addResizeHandles(img as HTMLImageElement))
      }

      // Process initially
      processImages()

      // Optimized observer that only processes when new img elements are added
      const observer = new MutationObserver((mutations) => {
        if (isProcessing) return

        let hasNewImages = false
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element
                // Check if the added node is an image or contains images
                if (element.tagName === 'IMG' && element.classList.contains('editor-image')) {
                  hasNewImages = true
                } else if (element.querySelector && element.querySelector('img.editor-image')) {
                  hasNewImages = true
                }
              }
            })
          }
        })

        if (hasNewImages) {
          processImages()
        }
      })

      observer.observe(editor.view.dom, {
        childList: true,
        subtree: true
      })

      // Click outside to deselect
      const handleClickOutside = (e: Event) => {
        if (!(e.target as Element).closest('.image-wrapper')) {
          document.querySelectorAll('.image-wrapper.selected').forEach(el => {
            el.classList.remove('selected')
            el.querySelectorAll('.resize-handle').forEach(handle => handle.remove())
          })
        }
      }

      document.addEventListener('click', handleClickOutside)

      return () => {
        observer.disconnect()
        document.removeEventListener('click', handleClickOutside)

        // Clean up all image click handlers
        editor.view.dom.querySelectorAll('img.editor-image').forEach(img => {
          const imageElement = img as HTMLImageElement
          const handler = imageClickHandlers.get(imageElement)
          if (handler) {
            imageElement.removeEventListener('click', handler)
            imageClickHandlers.delete(imageElement)
          }
        })

        // Remove all resize handles and wrappers
        editor.view.dom.querySelectorAll('.image-wrapper').forEach(wrapper => {
          wrapper.querySelectorAll('.resize-handle').forEach(handle => handle.remove())
        })
      }
  }, [editor])

  if (!editor) return null

  const addImage = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const loadingImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjBmMGYwIi8+CiAgICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VXBsb2FkaW5nLi4uPC90ZXh0Pgo8L3N2Zz4='
        editor.chain().focus().setImage({ src: loadingImage }).run()

        const formData = new FormData()
        formData.append('image', file)

        const backendUrl = 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/api/upload-editor-image`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.url) {
            const currentContent = editor.getHTML()
            const updatedContent = currentContent.replace(loadingImage, result.url)
            editor.commands.setContent(updatedContent)
          } else {
            throw new Error('Failed to upload image')
          }
        } else {
          throw new Error('Failed to upload image')
        }
      } catch (error) {
        console.error('Image upload failed:', error)
        const reader = new FileReader()
        reader.onload = (e) => {
          const src = e.target?.result as string
          const currentContent = editor.getHTML()
          const loadingImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjBmMGYwIi8+CiAgICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VXBsb2FkaW5nLi4uPC90ZXh0Pgo8L3N2Zz4='
          const updatedContent = currentContent.replace(loadingImage, src)
          editor.commands.setContent(updatedContent)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run()
    setColorMenuAnchor(null)
  }

  const setHighlight = (color: string) => {
    editor.chain().focus().toggleHighlight({ color }).run()
    setHighlightMenuAnchor(null)
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setLinkMenuAnchor(null)
    }
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
    setLinkMenuAnchor(null)
  }

  const setFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run()
    setFontSizeMenuAnchor(null)
  }

  const openImageControls = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Image controls functionality can be added here if needed
  }

  const resizeImage = (width: string) => {
    const selection = editor.state.selection
    const node = editor.state.doc.nodeAt(selection.from)

    if (node && node.type.name === 'image') {
      const currentClass = node.attrs.class || ''
      const newClass = currentClass.replace(/image-(small|medium|large|full)/g, '').trim()

      const sizeClass = width === '25%' ? 'image-small' :
                      width === '50%' ? 'image-medium' :
                      width === '75%' ? 'image-large' : 'image-full'

      const finalClass = `${newClass} ${sizeClass}`.trim()

      editor.chain().focus().updateAttributes('image', {
        class: `editor-image ${finalClass}`,
        style: `width: ${width}; height: auto; max-width: 100%;`
      }).run()
    }
  }

  const alignImage = (alignment: 'left' | 'center' | 'right') => {
    const selection = editor.state.selection
    const node = editor.state.doc.nodeAt(selection.from)

    if (node && node.type.name === 'image') {
      const currentClass = node.attrs.class || ''
      const newClass = currentClass.replace(/image-(left|center|right)/g, '').trim()

      const alignClass = `image-${alignment}`
      const finalClass = `${newClass} ${alignClass}`.trim()

      const baseStyle = node.attrs.style || 'max-width: 100%; height: auto;'

      let alignmentStyle = ''
      if (alignment === 'left') {
        alignmentStyle = 'float: left; margin: 0 15px 15px 0; display: inline;'
      } else if (alignment === 'right') {
        alignmentStyle = 'float: right; margin: 0 0 15px 15px; display: inline;'
      } else {
        alignmentStyle = 'display: block; margin: 15px auto; float: none;'
      }

      editor.chain().focus().updateAttributes('image', {
        class: `editor-image ${finalClass}`,
        style: `${baseStyle} ${alignmentStyle}`
      }).run()
    }
  }

  const colors = ['#000000', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722']
  const highlightColors = ['#FFEB3B', '#4CAF50', '#2196F3', '#E91E63', '#FF9800', '#9C27B0']
  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']
  const imageSizes = ['25%', '50%', '75%', '100%']

  return (
    <Box className='flex flex-wrap gap-x-2 gap-y-2 pbs-4 pbe-4 pli-6' sx={{ borderBottom: '1px solid #e0e0e0' }}>
      {/* Text Formatting */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', borderRight: '1px solid #e0e0e0', pr: 2 }}>
        <Tooltip title="Bold">
          <CustomIconButton
            {...(editor.isActive('bold') && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <i className={classnames('tabler-bold', { 'text-textSecondary': !editor.isActive('bold') })} />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <CustomIconButton
            {...(editor.isActive('italic') && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <i className={classnames('tabler-italic', { 'text-textSecondary': !editor.isActive('italic') })} />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Underline">
          <CustomIconButton
            {...(editor.isActive('underline') && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <i className={classnames('tabler-underline', { 'text-textSecondary': !editor.isActive('underline') })} />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Strikethrough">
          <CustomIconButton
            {...(editor.isActive('strike') && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <i className={classnames('tabler-strikethrough', { 'text-textSecondary': !editor.isActive('strike') })} />
          </CustomIconButton>
        </Tooltip>
      </Box>

      {/* Text Color, Highlight & Font Size */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', borderRight: '1px solid #e0e0e0', pr: 2 }}>
        <Tooltip title="Text Color">
          <CustomIconButton
            variant='tonal'
            size='small'
            onClick={(e) => setColorMenuAnchor(e.currentTarget)}
          >
            <i className="tabler-palette" />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Highlight">
          <CustomIconButton
            {...(editor.isActive('highlight') && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={(e) => setHighlightMenuAnchor(e.currentTarget)}
          >
            <i className="tabler-highlight" />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Font Size">
          <CustomIconButton
            variant='tonal'
            size='small'
            onClick={(e) => setFontSizeMenuAnchor(e.currentTarget)}
          >
            <i className="tabler-typography" />
          </CustomIconButton>
        </Tooltip>
      </Box>

      {/* Lists */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', borderRight: '1px solid #e0e0e0', pr: 2 }}>
        <Tooltip title="Bullet List">
          <CustomIconButton
            {...(editor.isActive('bulletList') && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <i className={classnames('tabler-list', { 'text-textSecondary': !editor.isActive('bulletList') })} />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <CustomIconButton
            {...(editor.isActive('orderedList') && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <i className={classnames('tabler-list-numbers', { 'text-textSecondary': !editor.isActive('orderedList') })} />
          </CustomIconButton>
        </Tooltip>
      </Box>

      {/* Alignment */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', borderRight: '1px solid #e0e0e0', pr: 2 }}>
        <Tooltip title="Align Left">
          <CustomIconButton
            {...(editor.isActive({ textAlign: 'left' }) && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <i className={classnames('tabler-align-left', { 'text-textSecondary': !editor.isActive({ textAlign: 'left' }) })} />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Align Center">
          <CustomIconButton
            {...(editor.isActive({ textAlign: 'center' }) && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <i className={classnames('tabler-align-center', { 'text-textSecondary': !editor.isActive({ textAlign: 'center' }) })} />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Align Right">
          <CustomIconButton
            {...(editor.isActive({ textAlign: 'right' }) && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <i className={classnames('tabler-align-right', { 'text-textSecondary': !editor.isActive({ textAlign: 'right' }) })} />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Justify">
          <CustomIconButton
            {...(editor.isActive({ textAlign: 'justify' }) && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          >
            <i className={classnames('tabler-align-justified', { 'text-textSecondary': !editor.isActive({ textAlign: 'justify' }) })} />
          </CustomIconButton>
        </Tooltip>
      </Box>

      {/* Media & Links */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Tooltip title="Add Image">
          <CustomIconButton
            variant='tonal'
            size='small'
            onClick={addImage}
          >
            <i className="tabler-photo" />
          </CustomIconButton>
        </Tooltip>
        <Tooltip title="Add Link">
          <CustomIconButton
            {...(editor.isActive('link') && { color: 'primary' })}
            variant='tonal'
            size='small'
            onClick={(e) => setLinkMenuAnchor(e.currentTarget)}
          >
            <i className={classnames('tabler-link', { 'text-textSecondary': !editor.isActive('link') })} />
          </CustomIconButton>
        </Tooltip>
      </Box>

      {/* Hidden file input for image upload */}
      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {/* Color Menu */}
      <Menu
        anchorEl={colorMenuAnchor}
        open={Boolean(colorMenuAnchor)}
        onClose={() => setColorMenuAnchor(null)}
      >
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, width: 200 }}>
          <Typography variant="caption" sx={{ gridColumn: '1 / -1', mb: 1 }}>Text Color</Typography>
          {colors.map((color) => (
            <Box
              key={color}
              onClick={() => setTextColor(color)}
              sx={{
                width: 24,
                height: 24,
                backgroundColor: color,
                borderRadius: '4px',
                cursor: 'pointer',
                border: '1px solid #ccc',
                '&:hover': { transform: 'scale(1.1)' }
              }}
            />
          ))}
        </Box>
      </Menu>

      {/* Highlight Menu */}
      <Menu
        anchorEl={highlightMenuAnchor}
        open={Boolean(highlightMenuAnchor)}
        onClose={() => setHighlightMenuAnchor(null)}
      >
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, width: 150 }}>
          <Typography variant="caption" sx={{ gridColumn: '1 / -1', mb: 1 }}>Highlight</Typography>
          {highlightColors.map((color) => (
            <Box
              key={color}
              onClick={() => setHighlight(color)}
              sx={{
                width: 24,
                height: 24,
                backgroundColor: color,
                borderRadius: '4px',
                cursor: 'pointer',
                border: '1px solid #ccc',
                '&:hover': { transform: 'scale(1.1)' }
              }}
            />
          ))}
          <Button
            size="small"
            onClick={() => {
              editor.chain().focus().unsetHighlight().run()
              setHighlightMenuAnchor(null)
            }}
            sx={{ gridColumn: '1 / -1', mt: 1 }}
          >
            Remove
          </Button>
        </Box>
      </Menu>

      {/* Link Menu */}
      <Menu
        anchorEl={linkMenuAnchor}
        open={Boolean(linkMenuAnchor)}
        onClose={() => setLinkMenuAnchor(null)}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
            {editor.isActive('link') ? 'Edit Link' : 'Add Link'}
          </Typography>
          <CustomTextField
            fullWidth
            size="small"
            label="URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={addLink}
              disabled={!linkUrl}
            >
              {editor.isActive('link') ? 'Update' : 'Add'}
            </Button>
            {editor.isActive('link') && (
              <Button
                size="small"
                variant="outlined"
                onClick={removeLink}
              >
                Remove
              </Button>
            )}
          </Box>
        </Box>
      </Menu>

      {/* Font Size Menu */}
      <Menu
        anchorEl={fontSizeMenuAnchor}
        open={Boolean(fontSizeMenuAnchor)}
        onClose={() => setFontSizeMenuAnchor(null)}
      >
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, width: 200 }}>
          <Typography variant="caption" sx={{ gridColumn: '1 / -1', mb: 1 }}>Font Size</Typography>
          {fontSizes.map((size) => (
            <Button
              key={size}
              size="small"
              variant="outlined"
              onClick={() => setFontSize(size)}
              sx={{
                minWidth: 60,
                fontSize: '12px',
                py: 0.5,
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              {size}
            </Button>
          ))}
          <Button
            size="small"
            onClick={() => {
              editor.chain().focus().unsetFontSize().run()
              setFontSizeMenuAnchor(null)
            }}
            sx={{ gridColumn: '1 / -1', mt: 1 }}
          >
            Reset
          </Button>
        </Box>
      </Menu>

    </Box>
  )
}

const ProductInformation = () => {
  const { formData, setFormData, errors, setEditor } = useProductForm()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write something here...'
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Underline,
      Color,
      TextStyle,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'editor-bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'editor-ordered-list',
        },
      }),
      ListItem,
      Highlight.configure({
        multicolor: true
      }),
      FontSize.configure({
        types: ['textStyle'],
      })
    ],
    immediatelyRender: false,
    content: `
      <p>
        Deskripsi produk singkat dan jelas tentang produk yang dijual.
      </p>
    `,
    onUpdate: ({ editor }) => {
      setFormData({ deskripsi: editor.getHTML() })
    }
  })

  useEffect(() => {
    if (editor) {
      setEditor(editor)
      // Load existing content when editor is ready (useful for edit mode)
      if (formData.deskripsi && formData.deskripsi.trim() !== '') {
        editor.commands.setContent(formData.deskripsi)
      }
    }
  }, [editor, setEditor, formData.deskripsi])

  const handleProductNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ nama_produk: e.target.value })
  }

  const handleProductTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const jenis = e.target.value as 'digital' | 'fisik'
    setFormData({ 
      jenis_produk: jenis,
      url_produk: jenis === 'fisik' ? '' : formData.url_produk // Clear URL if switching to physical
    })
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ url_produk: e.target.value })
  }

  return (
    <Card>
      <CardHeader title='Product Information' />
      <CardContent>
        <Grid container spacing={6} className='mbe-6'>
          <Grid size={{ xs: 12 }}>
            <CustomTextField 
              fullWidth 
              label='Nama Produk' 
              placeholder='Workshop Pintar untuk anak cerdas 12.000+' 
              value={formData.nama_produk}
              onChange={handleProductNameChange}
              error={!!errors.nama_produk}
            />
            {errors.nama_produk && (
              <FormHelperText error>{errors.nama_produk}</FormHelperText>
            )}
          </Grid>
        </Grid>
        <Typography className='mbe-1'>Deskripsi Produk (Optional)</Typography>
        <Card className='p-0 border shadow-none' sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <CardContent className='p-0'>
            <EditorToolbar editor={editor} />
            <Divider />
            <EditorContent
              editor={editor}
              className='bs-[680px] overflow-y-auto'
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0 0 12px 12px'
              }}
            />
          </CardContent>
        </Card>
        <Grid container spacing={6} className='mbe-6 mt-4'>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              select
              fullWidth
              label='Jenis Produk'
              value={formData.jenis_produk}
              onChange={handleProductTypeChange}
            >
              <MenuItem value='digital'>Produk Digital</MenuItem>
              <MenuItem value='fisik'>Produk Fisik</MenuItem>
            </CustomTextField>
          </Grid>

          {/* Muncul hanya jika Produk Digital */}
          {formData.jenis_produk === 'digital' && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField 
                fullWidth 
                label='Url Produk' 
                placeholder='https://www.tokoku.com' 
                value={formData.url_produk || ''}
                onChange={handleUrlChange}
                error={!!errors.url_produk}
              />
              {errors.url_produk && (
                <FormHelperText error>{errors.url_produk}</FormHelperText>
              )}
            </Grid>
          )}

          {/* Show stock field for physical products */}
          {formData.jenis_produk === 'fisik' && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField 
                fullWidth 
                type="number"
                label='Stock' 
                placeholder='0' 
                value={formData.stock || ''}
                onChange={(e) => setFormData({ stock: parseInt(e.target.value) || 0 })}
                error={!!errors.stock}
              />
              {errors.stock && (
                <FormHelperText error>{errors.stock}</FormHelperText>
              )}
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ProductInformation
