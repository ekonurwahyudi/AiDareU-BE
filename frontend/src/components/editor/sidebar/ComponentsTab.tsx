'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import DraggableComponent from '../DraggableComponent'

interface ComponentsTabProps {
  standardComponents: any[]
  layoutComponents: any[]
  businessComponents: any[]
  onAddComponent: (type: string) => void
}

export default function ComponentsTab({
  standardComponents,
  layoutComponents,
  businessComponents,
  onAddComponent
}: ComponentsTabProps) {
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
            onAdd={onAddComponent}
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
            onAdd={onAddComponent}
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
            onAdd={onAddComponent}
          />
        ))}
      </Box>
    </Box>
  )
}