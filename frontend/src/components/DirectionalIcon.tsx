'use client'

// React Imports
import type { CSSProperties } from 'react'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

type Props = {
  ltrIconClass: string
  rtlIconClass: string
  className?: string
  style?: CSSProperties
}

const DirectionalIcon = (props: Props) => {
  // Props
  const { ltrIconClass, rtlIconClass, className, style } = props

  // Hooks
  const theme = useTheme()

  return (
    <i
      className={classnames(
        {
          [ltrIconClass]: theme.direction === 'ltr',
          [rtlIconClass]: theme.direction === 'rtl'
        },
        className
      )}
      style={style}
    />
  )
}

export default DirectionalIcon
