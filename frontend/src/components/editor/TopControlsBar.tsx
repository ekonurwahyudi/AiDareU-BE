'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import CustomIconButton from '@core/components/mui/IconButton'

interface TopControlsBarProps {
  drawerOpen: boolean
  onDrawerToggle: () => void
  onAdvancedEdit: () => void
  viewMode: 'desktop' | 'mobile' | 'tablet'
  onViewModeChange: (mode: 'desktop' | 'mobile' | 'tablet') => void
  historyIndex: number
  htmlHistoryLength: number
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  saving?: boolean
  onManualSave?: () => void
}

const TopControlsBar = ({
  drawerOpen,
  onDrawerToggle,
  onAdvancedEdit,
  viewMode,
  onViewModeChange,
  historyIndex,
  htmlHistoryLength,
  onUndo,
  onRedo,
  onReset,
  saving,
  onManualSave
}: TopControlsBarProps) => {
  return (
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
          onClick={onDrawerToggle}
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
          onClick={onAdvancedEdit}
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
          onClick={() => onViewModeChange('desktop')}
          color={viewMode === 'desktop' ? 'primary' : 'secondary'}
          variant={viewMode === 'desktop' ? 'contained' : 'outlined'}
          size="small"
        >
          <i className="tabler-device-desktop" />
        </CustomIconButton>
        <CustomIconButton 
          title="Tablet View"
          onClick={() => onViewModeChange('tablet')}
          color={viewMode === 'tablet' ? 'primary' : 'secondary'}
          variant={viewMode === 'tablet' ? 'contained' : 'outlined'}
          size="small"
        >
          <i className="tabler-device-tablet" />
        </CustomIconButton>
        <CustomIconButton 
          title="Mobile View"
          onClick={() => onViewModeChange('mobile')}
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
              onClick={onUndo}
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
              onClick={onRedo}
              disabled={historyIndex >= htmlHistoryLength - 1}
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
            onClick={onReset}
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
  )
}

export default TopControlsBar