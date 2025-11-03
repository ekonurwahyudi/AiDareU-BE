'use client'

import { useRef, useEffect, useState } from 'react'
import Box from '@mui/material/Box'

interface CanvasProps {
  children: React.ReactNode
  className?: string
  onAddComponent?: (type: string, dropTarget?: HTMLElement) => void
}

const Canvas = ({ children, className = '', onAddComponent }: CanvasProps) => {
  // Enable pan/drag of the whole canvas like Notion/Elementor (space+drag)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const componentType = e.dataTransfer.getData('component-type')
    if (componentType && onAddComponent) {
      // Get the actual drop target element
      let dropTarget = e.target as HTMLElement
      
      // Try to find the closest editor component or container
      const editorComponent = dropTarget.closest('.editor-component') as HTMLElement
      const container = dropTarget.closest('.editor-container') as HTMLElement
      
      // Use the most appropriate target
      const target = editorComponent || container || dropTarget
      
      onAddComponent(componentType, target)
    }
  }

  return (
    <Box
      ref={containerRef}
      className={`${className} ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{ 
        width: '100%',
        minHeight: '80vh',
        border: isDragOver ? '2px solid' : '2px dashed #e0e0e0',
        borderColor: isDragOver ? 'primary.main' : '#e0e0e0',
        borderRadius: 2,
        p: 2,
        position: 'relative',
        background: isDragOver ? 'rgba(115, 103, 240, 0.05)' : '#fafafa',
        overflow: 'auto',
        cursor: 'default',
        transition: 'all 0.3s ease'
      }}
    >
      {children}
    </Box>
  )
}

export default Canvas