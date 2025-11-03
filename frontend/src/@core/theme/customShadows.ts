// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { SystemMode } from '@core/types'

const customShadows = (mode: SystemMode): Theme['customShadows'] => {
  return {
    xs: `0px 1px 2px rgb(var(--mui-mainColorChannels-${mode}Shadow) / ${mode === 'light' ? 0.015 : 0.05})`,
    sm: `0px 1px 2px rgb(var(--mui-mainColorChannels-${mode}Shadow) / ${mode === 'light' ? 0.02 : 0.07})`,
    md: `0px 1px 3px rgb(var(--mui-mainColorChannels-${mode}Shadow) / ${mode === 'light' ? 0.025 : 0.09})`,
    lg: `0px 1px 4px rgb(var(--mui-mainColorChannels-${mode}Shadow) / ${mode === 'light' ? 0.035 : 0.11})`,
    xl: `0px 2px 4px rgb(var(--mui-mainColorChannels-${mode}Shadow) / ${mode === 'light' ? 0.04 : 0.13})`,
    primary: {
      sm: '0px 2px 6px rgb(var(--mui-palette-primary-mainChannel) / 0.3)',
      md: '0px 4px 16px rgb(var(--mui-palette-primary-mainChannel) / 0.4)',
      lg: '0px 6px 20px rgb(var(--mui-palette-primary-mainChannel) / 0.5)'
    },
    secondary: {
      sm: '0px 2px 6px rgb(var(--mui-palette-secondary-mainChannel) / 0.3)',
      md: '0px 4px 16px rgb(var(--mui-palette-secondary-mainChannel) / 0.4)',
      lg: '0px 6px 20px rgb(var(--mui-palette-secondary-mainChannel) / 0.5)'
    },
    error: {
      sm: '0px 2px 6px rgb(var(--mui-palette-error-mainChannel) / 0.3)',
      md: '0px 4px 16px rgb(var(--mui-palette-error-mainChannel) / 0.4)',
      lg: '0px 6px 20px rgb(var(--mui-palette-error-mainChannel) / 0.5)'
    },
    warning: {
      sm: '0px 2px 6px rgb(var(--mui-palette-warning-mainChannel) / 0.3)',
      md: '0px 4px 16px rgb(var(--mui-palette-warning-mainChannel) / 0.4)',
      lg: '0px 6px 20px rgb(var(--mui-palette-warning-mainChannel) / 0.5)'
    },
    info: {
      sm: '0px 2px 6px rgb(var(--mui-palette-info-mainChannel) / 0.3)',
      md: '0px 4px 16px rgb(var(--mui-palette-info-mainChannel) / 0.4)',
      lg: '0px 6px 20px rgb(var(--mui-palette-info-mainChannel) / 0.5)'
    },
    success: {
      sm: '0px 2px 6px rgb(var(--mui-palette-success-mainChannel) / 0.3)',
      md: '0px 4px 16px rgb(var(--mui-palette-success-mainChannel) / 0.4)',
      lg: '0px 6px 20px rgb(var(--mui-palette-success-mainChannel) / 0.5)'
    }
  }
}

export default customShadows
