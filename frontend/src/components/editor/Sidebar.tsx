'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

// Import sub-components
import ComponentsTab from './sidebar/ComponentsTab'
import PropertiesTab from './sidebar/PropertiesTab'  
import SettingsTab from './sidebar/SettingsTab'

interface SidebarProps {
  selectedTab: number
  onTabChange: (event: any, value: number) => void
  drawerOpen: boolean
  
  // Props for ComponentsTab
  standardComponents: any[]
  layoutComponents: any[]
  businessComponents: any[]
  onAddComponent: (type: string) => void
  
  // Props for PropertiesTab
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
  
  // Props for SettingsTab
  expandedAccordion: string
  onAccordionChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void
  pageSettings: any
  onPageSettingsChange: (settings: any) => void
  stores: any[]
  domains: any[]
  pixels: any[]
  loading: any
  errors: string[]
  onPageNameChange: (name: string) => void
  getPreviewUrl: () => string
  getFullPageUrl: () => string
  validateImageFile: (file: File, maxSize?: number) => boolean
  elementOutline: any[]
  renderElementOutline: () => React.ReactNode
  onAddNewSection: () => void
}

export default function Sidebar({
  selectedTab,
  onTabChange,
  drawerOpen,
  
  // ComponentsTab props
  standardComponents,
  layoutComponents,
  businessComponents,
  onAddComponent,
  
  // PropertiesTab props
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
  onClearSelection,
  
  // SettingsTab props
  expandedAccordion,
  onAccordionChange,
  pageSettings,
  onPageSettingsChange,
  stores,
  domains,
  pixels,
  loading,
  errors,
  onPageNameChange,
  getPreviewUrl,
  getFullPageUrl,
  validateImageFile,
  elementOutline,
  renderElementOutline,
  onAddNewSection
}: SidebarProps) {
  
  if (!drawerOpen) return null

  return (
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
          onChange={onTabChange} 
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
          <ComponentsTab
            standardComponents={standardComponents}
            layoutComponents={layoutComponents}
            businessComponents={businessComponents}
            onAddComponent={onAddComponent}
          />
        )}

        {selectedTab === 1 && (
          <PropertiesTab
            selectedElement={selectedElement}
            selectedComponent={selectedComponent}
            colorEditorTab={colorEditorTab}
            onColorEditorTabChange={onColorEditorTabChange}
            solidColor={solidColor}
            onSolidColorChange={onSolidColorChange}
            gradientStops={gradientStops}
            onGradientStopsChange={onGradientStopsChange}
            activeStopId={activeStopId}
            onActiveStopIdChange={onActiveStopIdChange}
            gradientAngle={gradientAngle}
            onGradientAngleChange={onGradientAngleChange}
            gradientType={gradientType}
            onGradientTypeChange={onGradientTypeChange}
            onApplySolid={onApplySolid}
            onApplyGradient={onApplyGradient}
            onEditedHtmlChange={onEditedHtmlChange}
            selectedElementVersion={selectedElementVersion}
            onSelectedElementVersionChange={onSelectedElementVersionChange}
            onUpdateComponent={onUpdateComponent}
            onSelectedComponentChange={onSelectedComponentChange}
            onClearSelection={onClearSelection}
          />
        )}

        {selectedTab === 2 && (
          <SettingsTab
            expandedAccordion={expandedAccordion}
            onAccordionChange={onAccordionChange}
            pageSettings={pageSettings}
            onPageSettingsChange={onPageSettingsChange}
            stores={stores}
            domains={domains}
            pixels={pixels}
            loading={loading}
            errors={errors}
            onPageNameChange={onPageNameChange}
            getPreviewUrl={getPreviewUrl}
            getFullPageUrl={getFullPageUrl}
            validateImageFile={validateImageFile}
            elementOutline={elementOutline}
            renderElementOutline={renderElementOutline}
            onAddNewSection={onAddNewSection}
          />
        )}
      </Box>
    </Box>
  )
}