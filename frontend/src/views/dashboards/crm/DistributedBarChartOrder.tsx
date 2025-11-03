'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Vars
const series = [{ data: [77, 55, 23, 43, 77, 55, 89] }]

interface DistributedBarChartOrderProps {
  orders?: number
  growth?: number
}

const DistributedBarChartOrder = ({ orders = 0, growth = 0 }: DistributedBarChartOrderProps) => {
  // Hooks
  const theme = useTheme()

  // Format number for display
  const formatNumber = (num: number) => {
    const safeNum = Number(num) || 0

    if (safeNum >= 1000000) return `${(safeNum / 1000000).toFixed(1)}M`
    if (safeNum >= 1000) return `${(safeNum / 1000).toFixed(1)}k`

    return safeNum.toString()
  }

  // Safe growth value
  const safeGrowth = Number(growth) || 0

  // Vars
  const actionSelectedColor = 'var(--mui-palette-action-selected)'

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: false,
      parentHeightOffset: 0,
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    tooltip: { enabled: false },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ['var(--mui-palette-primary-main)'],
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
        borderRadius: 3,
        horizontal: false,
        columnWidth: '32%',
        colors: {
          backgroundBarRadius: 5,
          backgroundBarColors: [
            actionSelectedColor,
            actionSelectedColor,
            actionSelectedColor,
            actionSelectedColor,
            actionSelectedColor
          ]
        }
      }
    },
    grid: {
      show: false,
      padding: {
        left: -3,
        right: 5,
        top: 15,
        bottom: 18
      }
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: { show: false },
    responsive: [
      {
        breakpoint: 1350,
        options: {
          plotOptions: {
            bar: { columnWidth: '45%' }
          }
        }
      },
      {
        breakpoint: theme.breakpoints.values.lg,
        options: {
          plotOptions: {
            bar: { columnWidth: '20%' }
          }
        }
      },
      {
        breakpoint: 600,
        options: {
          plotOptions: {
            bar: { columnWidth: '15%' }
          }
        }
      }
    ]
  }

  return (
    <Card>
      <CardHeader title='Total Order' className='pbe-0' />
      <CardContent className='flex flex-col'>
        <AppReactApexCharts type='bar' height={84} width='100%' options={options} series={series} />
        <div className='flex items-center justify-between flex-wrap gap-x-4 gap-y-0.5'>
          <Typography variant='h4' color='text.primary'>
            {formatNumber(orders || 0)}
          </Typography>
          <Typography variant='body2' color={safeGrowth >= 0 ? 'success.main' : 'error.main'}>
            {safeGrowth > 0 ? '+' : ''}
            {safeGrowth.toFixed(1)}%
          </Typography>
        </div>
      </CardContent>
    </Card>
  )
}

export default DistributedBarChartOrder
