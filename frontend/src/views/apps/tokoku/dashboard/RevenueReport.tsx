'use client'

// React Imports
import { useState } from 'react'
import type { MouseEvent } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// Third Party Imports
import type { ApexOptions } from 'apexcharts'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Vars
const yearOptions = [new Date().getFullYear() - 1, new Date().getFullYear() - 2, new Date().getFullYear() - 3]

interface RevenueData {
  date: string
  revenue: number
  orders: number
}

interface RevenueReportProps {
  revenueData?: RevenueData[]
}

const RevenueReport = ({ revenueData = [] }: RevenueReportProps) => {
  // Safe data with fallback
  const safeRevenueData = Array.isArray(revenueData) ? revenueData : []

  // Process revenue data for chart
  const processedData =
    safeRevenueData.length > 0
      ? safeRevenueData
      : [
          { date: 'Jan', revenue: 0, orders: 0 },
          { date: 'Feb', revenue: 0, orders: 0 },
          { date: 'Mar', revenue: 0, orders: 0 },
          { date: 'Apr', revenue: 0, orders: 0 },
          { date: 'May', revenue: 0, orders: 0 },
          { date: 'Jun', revenue: 0, orders: 0 },
          { date: 'Jul', revenue: 0, orders: 0 },
          { date: 'Aug', revenue: 0, orders: 0 },
          { date: 'Sep', revenue: 0, orders: 0 }
        ]

  const categories = processedData.map(item => {
    if (item?.date?.includes('-')) {
      // If date format is YYYY-MM-DD, format to short month
      const date = new Date(item.date)

      return date.toLocaleString('en-US', { month: 'short' })
    }

    return item?.date || 'N/A'
  })

  const revenueValues = processedData.map(item => Math.round((item?.revenue || 0) / 1000)) // Convert to thousands
  const orderValues = processedData.map(item => item?.orders || 0)

  const barSeries = [
    { name: 'Revenue (k)', data: revenueValues },
    { name: 'Orders', data: orderValues }
  ]
  // States
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // Hooks
  const theme = useTheme()

  // Vars
  const disabledText = 'var(--mui-palette-text-disabled)'

  const barOptions: ApexOptions = {
    chart: {
      stacked: true,
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    stroke: {
      width: 6,
      colors: ['var(--mui-palette-background-paper)']
    },
    colors: ['var(--mui-palette-primary-main)', 'var(--mui-palette-warning-main)'],
    legend: {
      offsetY: -4,
      offsetX: -35,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '13px',
      fontFamily: theme.typography.fontFamily,
      labels: { colors: 'var(--mui-palette-text-secondary)' },
      itemMargin: {
        horizontal: 9
      },
      markers: {
        width: 12,
        height: 12,
        radius: 10,
        offsetY: 1,
        offsetX: theme.direction === 'rtl' ? 7 : -4
      }
    },
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 7,
        columnWidth: '40%',
        borderRadiusApplication: 'around',
        borderRadiusWhenStacked: 'all'
      }
    },
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      yaxis: {
        lines: { show: false }
      },
      padding: {
        left: -6,
        right: -11,
        bottom: -11
      }
    },
    xaxis: {
      axisTicks: { show: false },
      crosshairs: { opacity: 0 },
      axisBorder: { show: false },
      categories: categories,
      labels: {
        style: {
          colors: disabledText,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      }
    },
    yaxis: {
      tickAmount: 5,
      labels: {
        offsetX: -14,
        style: {
          colors: disabledText,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      }
    },
    responsive: [
      {
        breakpoint: theme.breakpoints.values.xl,
        options: {
          plotOptions: {
            bar: { columnWidth: '48%' }
          }
        }
      },
      {
        breakpoint: 1380,
        options: {
          plotOptions: {
            bar: { columnWidth: '55%' }
          }
        }
      },
      {
        breakpoint: theme.breakpoints.values.lg,
        options: {
          plotOptions: {
            bar: { borderRadius: 7 }
          }
        }
      },
      {
        breakpoint: theme.breakpoints.values.md,
        options: {
          plotOptions: {
            bar: { columnWidth: '50%' }
          }
        }
      },
      {
        breakpoint: 680,
        options: {
          plotOptions: {
            bar: { columnWidth: '60%' }
          }
        }
      },
      {
        breakpoint: theme.breakpoints.values.sm,
        options: {
          plotOptions: {
            bar: { columnWidth: '55%' }
          }
        }
      },
      {
        breakpoint: 450,
        options: {
          plotOptions: {
            bar: { borderRadius: 6, columnWidth: '65%' }
          }
        }
      }
    ]
  }

  return (
    <Card>
      <CardHeader title='Revenue Report' />
      <CardContent>
        <AppReactApexCharts type='bar' height={320} width='100%' series={barSeries} options={barOptions} />
      </CardContent>
    </Card>
  )
}

export default RevenueReport
