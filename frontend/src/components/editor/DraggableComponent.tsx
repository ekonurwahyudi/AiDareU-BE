'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

interface DraggableComponentProps {
  type: string
  label: string
  icon: string
  onAdd: (type: string) => void
}

export default function DraggableComponent({ type, label, icon, onAdd }: DraggableComponentProps) {
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