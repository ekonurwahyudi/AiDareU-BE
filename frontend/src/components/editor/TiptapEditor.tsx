'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { 
  Box, 
  Button, 
  ButtonGroup, 
  Select, 
  MenuItem, 
  Divider,
  FormControl,
  IconButton,
  Popover,
  TextField,
  Paper,
  Grid,
  Typography,
  Tooltip
} from '@mui/material'
import { 
  Undo,
  Redo,
  FormatBold, 
  FormatItalic, 
  FormatUnderlined,
  StrikethroughS,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  FormatListBulleted,
  FormatListNumbered,
  Palette,
  Code,
  Link,
  Close,
  Colorize
} from '@mui/icons-material'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  selectedElement?: HTMLElement
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, placeholder = "Start typing...", selectedElement }) => {
  const [colorAnchor, setColorAnchor] = React.useState<HTMLButtonElement | null>(null)
  const [textColor, setTextColor] = React.useState('#000000')

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  })

  // Heading levels for dropdown
  const headingLevels = [
    { value: 0, label: 'Paragraph' },
    { value: 1, label: 'Heading 1' },
    { value: 2, label: 'Heading 2' },
    { value: 3, label: 'Heading 3' },
    { value: 4, label: 'Heading 4' },
    { value: 5, label: 'Heading 5' },
    { value: 6, label: 'Heading 6' },
  ]

  if (!editor) {
    return null
  }

  // Get current heading level with selectedElement priority
  const getCurrentHeadingLevel = (): number => {
    // First check selectedElement prop for heading level detection
    if (selectedElement) {
      const tagName = selectedElement.tagName.toLowerCase()
      if (tagName.startsWith('h') && tagName.length === 2) {
        const level = parseInt(tagName.charAt(1))
        if (level >= 1 && level <= 6) {
          return level
        }
      }
    }
    
    // Fallback to editor's active state
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) {
        return i
      }
    }
    return 0 // paragraph
  }

  const setHeadingLevel = (level: number) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
    }
  }

  const applyTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run()
    setColorAnchor(null)
  }

  return (
    <Box sx={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: 3, 
      overflow: 'hidden',
      background: '#ffffff',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        borderColor: '#d1d5db'
      }
    }}>
      {/* Modern Toolbar */}
      <Box sx={{ 
        p: 1.5, 
        borderBottom: '1px solid #e5e7eb', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        alignItems: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        {/* Undo/Redo */}
        <ButtonGroup size="small" variant="text" sx={{ mr: 1 }}>
          <Tooltip title="Undo">
            <span>
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                sx={{ 
                  borderRadius: 1, 
                  '&:hover': { background: 'rgba(59, 130, 246, 0.1)' },
                  '&:disabled': { opacity: 0.4 }
                }}
              >
                <Undo fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo">
            <span>
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                sx={{ 
                  borderRadius: 1, 
                  '&:hover': { background: 'rgba(59, 130, 246, 0.1)' },
                  '&:disabled': { opacity: 0.4 }
                }}
              >
                <Redo fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </ButtonGroup>

        {/* Heading Select */}
        <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
          <Select
            value={getCurrentHeadingLevel()}
            onChange={(e) => setHeadingLevel(Number(e.target.value))}
            size="small"
            sx={{
              borderRadius: 1.5,
              '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #e5e7eb' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
            }}
          >
            {headingLevels.map((level) => (
              <MenuItem key={level.value} value={level.value}>
                {level.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24 }} />

        {/* Text Formatting */}
        <ButtonGroup size="small" variant="text" sx={{ mr: 1 }}>
          <Tooltip title="Bold">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBold().run()}
              sx={{
                borderRadius: 1,
                backgroundColor: editor.isActive('bold') ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: editor.isActive('bold') ? '#3b82f6' : '#6b7280',
                '&:hover': { 
                  background: editor.isActive('bold') ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }
              }}
            >
              <FormatBold fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              sx={{
                borderRadius: 1,
                backgroundColor: editor.isActive('italic') ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: editor.isActive('italic') ? '#3b82f6' : '#6b7280',
                '&:hover': { 
                  background: editor.isActive('italic') ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }
              }}
            >
              <FormatItalic fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              sx={{
                borderRadius: 1,
                backgroundColor: editor.isActive('underline') ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: editor.isActive('underline') ? '#3b82f6' : '#6b7280',
                '&:hover': { 
                  background: editor.isActive('underline') ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }
              }}
            >
              <FormatUnderlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Strikethrough">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              sx={{
                borderRadius: 1,
                backgroundColor: editor.isActive('strike') ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: editor.isActive('strike') ? '#3b82f6' : '#6b7280',
                '&:hover': { 
                  background: editor.isActive('strike') ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }
              }}
            >
              <StrikethroughS fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24 }} />

        {/* Text Color */}
        <Tooltip title="Text Color">
          <IconButton
            size="small"
            onClick={(e) => setColorAnchor(e.currentTarget)}
            sx={{
              borderRadius: 1,
              '&:hover': { background: 'rgba(59, 130, 246, 0.1)' },
              position: 'relative'
            }}
          >
            <Colorize fontSize="small" sx={{ color: textColor }} />
            <Box sx={{
              position: 'absolute',
              bottom: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 12,
              height: 3,
              backgroundColor: textColor,
              borderRadius: 0.5
            }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24 }} />

        {/* Text Alignment */}
        <ButtonGroup size="small" variant="text" sx={{ mr: 1 }}>
          <Tooltip title="Align Left">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              sx={{
                borderRadius: 1,
                backgroundColor: editor.isActive({ textAlign: 'left' }) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: editor.isActive({ textAlign: 'left' }) ? '#3b82f6' : '#6b7280',
                '&:hover': { 
                  background: editor.isActive({ textAlign: 'left' }) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }
              }}
            >
              <FormatAlignLeft fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align Center">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              sx={{
                borderRadius: 1,
                backgroundColor: editor.isActive({ textAlign: 'center' }) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: editor.isActive({ textAlign: 'center' }) ? '#3b82f6' : '#6b7280',
                '&:hover': { 
                  background: editor.isActive({ textAlign: 'center' }) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }
              }}
            >
              <FormatAlignCenter fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align Right">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              sx={{
                borderRadius: 1,
                backgroundColor: editor.isActive({ textAlign: 'right' }) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: editor.isActive({ textAlign: 'right' }) ? '#3b82f6' : '#6b7280',
                '&:hover': { 
                  background: editor.isActive({ textAlign: 'right' }) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }
              }}
            >
              <FormatAlignRight fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Justify">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              sx={{
                borderRadius: 1,
                backgroundColor: editor.isActive({ textAlign: 'justify' }) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: editor.isActive({ textAlign: 'justify' }) ? '#3b82f6' : '#6b7280',
                '&:hover': { 
                  background: editor.isActive({ textAlign: 'justify' }) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }
              }}
            >
              <FormatAlignJustify fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24 }} />

        {/* Lists */}
        <ButtonGroup size="small" variant="text">
          <Tooltip title="Bullet List">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              sx={{
                borderRadius: 1,
                backgroundColor: editor.isActive('bulletList') ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: editor.isActive('bulletList') ? '#3b82f6' : '#6b7280',
                '&:hover': { 
                  background: editor.isActive('bulletList') ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }
              }}
            >
              <FormatListBulleted fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              sx={{
                borderRadius: 1,
                backgroundColor: editor.isActive('orderedList') ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: editor.isActive('orderedList') ? '#3b82f6' : '#6b7280',
                '&:hover': { 
                  background: editor.isActive('orderedList') ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }
              }}
            >
              <FormatListNumbered fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* Modern Editor Content */}
      <Box sx={{ 
        minHeight: 140,
        background: '#ffffff',
        '& .ProseMirror': {
          outline: 'none',
          padding: '16px 20px',
          minHeight: '140px',
          lineHeight: 1.6,
          fontSize: '14px',
          color: '#374151',
          '& p': { 
            margin: '0 0 12px 0',
            '&:last-child': { marginBottom: 0 }
          },
          '& h1': { 
            fontSize: '2em', 
            fontWeight: 700, 
            margin: '20px 0 12px 0',
            color: '#111827',
            lineHeight: 1.2
          },
          '& h2': { 
            fontSize: '1.5em', 
            fontWeight: 600, 
            margin: '18px 0 10px 0',
            color: '#111827',
            lineHeight: 1.3
          },
          '& h3': { 
            fontSize: '1.25em', 
            fontWeight: 600, 
            margin: '16px 0 8px 0',
            color: '#111827',
            lineHeight: 1.4
          },
          '& h4': { 
            fontSize: '1.1em', 
            fontWeight: 600, 
            margin: '14px 0 6px 0',
            color: '#111827'
          },
          '& h5': { 
            fontSize: '1em', 
            fontWeight: 600, 
            margin: '12px 0 4px 0',
            color: '#111827'
          },
          '& h6': { 
            fontSize: '0.9em', 
            fontWeight: 600, 
            margin: '10px 0 4px 0',
            color: '#111827'
          },
          '& ul, & ol': {
            paddingLeft: '1.5rem',
            margin: '12px 0'
          },
          '& li': {
            margin: '4px 0'
          },
          '& strong': { fontWeight: 600 },
          '& em': { fontStyle: 'italic' },
          '& u': { textDecoration: 'underline' },
          '& s': { textDecoration: 'line-through' },
          '& [data-placeholder]:before': {
            color: '#9ca3af',
            content: 'attr(data-placeholder)',
            float: 'left',
            height: 0,
            pointerEvents: 'none'
          }
        }
      }}>
        <EditorContent editor={editor} />
      </Box>

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorAnchor)}
        anchorEl={colorAnchor}
        onClose={() => setColorAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Paper sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Text Color
          </Typography>
          <Box sx={{ mb: 2 }}>
            <HexColorPicker 
              color={textColor} 
              onChange={setTextColor}
              style={{ width: '100%', height: '150px' }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
            <TextField
              size="small"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              sx={{ flexGrow: 1 }}
              placeholder="#000000"
            />
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: textColor,
                border: '1px solid #e5e7eb',
                borderRadius: 1
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setColorAnchor(null)}>
              Cancel
            </Button>
            <Button 
              size="small" 
              variant="contained" 
              onClick={() => applyTextColor(textColor)}
            >
              Apply
            </Button>
          </Box>
        </Paper>
      </Popover>
    </Box>
  )
}

export default TiptapEditor