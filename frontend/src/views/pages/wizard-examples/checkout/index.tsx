'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MuiStepper from '@mui/material/Stepper'
import { styled } from '@mui/material/styles'
import type { StepperProps } from '@mui/material/Stepper'

// Component Imports
import StepCart from './StepCart'
import StepConfirmation from './StepConfirmation'
import DirectionalIcon from '@components/DirectionalIcon'

// Styled Component Imports
import StepperWrapper from '@core/styles/stepper'

// Types
interface CheckoutData {
  customerInfo: {
    name: string
    phone: string
    email: string
    address: string
    province: string
    city: string
    district: string
  }
  payment: any
  shipping: any
}

interface CheckoutWizardProps {
  primaryColor?: string
}

// Vars
const steps = [
  {
    title: 'Informasi',
    icon: (
      <svg id='wizardcart' xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'>
        <g>
          <path d='M60 8V0H0V8H2V48H1C0.448 48 0 48.447 0 49C0 49.553 0.448 50 1 50H2H29V52C29 52.047 29.021 52.088 29.027 52.134C27.293 52.571 26 54.131 26 56C26 58.206 27.794 60 30 60C32.206 60 34 58.206 34 56C34 54.131 32.707 52.571 30.973 52.134C30.979 52.088 31 52.047 31 52V50H58H59C59.552 50 60 49.553 60 49C60 48.447 59.552 48 59 48H58V8H60ZM32 56C32 57.103 31.103 58 30 58C28.897 58 28 57.103 28 56C28 54.897 28.897 54 30 54C31.103 54 32 54.897 32 56ZM2 2H58V6H2V2ZM56 48H4V8H56V48Z' />
          <path d='M50 41H35C34.448 41 34 41.447 34 42C34 42.553 34.448 43 35 43H50C50.552 43 51 42.553 51 42C51 41.447 50.552 41 50 41Z' />
          <path d='M10 36H20C20.552 36 21 35.553 21 35C21 34.447 20.552 34 20 34H10C9.448 34 9 34.447 9 35C9 35.553 9.448 36 10 36Z' />
          <path d='M30 36H45C45.552 36 46 35.553 46 35C46 34.447 45.552 34 45 34H30C29.448 34 29 34.447 29 35C29 35.553 29.448 36 30 36Z' />
          <path d='M24.29 34.29C24.11 34.479 24 34.729 24 35C24 35.26 24.11 35.52 24.29 35.71C24.48 35.89 24.74 36 25 36C25.26 36 25.52 35.89 25.71 35.71C25.89 35.52 26 35.26 26 35C26 34.74 25.89 34.479 25.71 34.29C25.34 33.92 24.66 33.92 24.29 34.29Z' />
          <path d='M30 41H15C14.448 41 14 41.447 14 42C14 42.553 14.448 43 15 43H30C30.552 43 31 42.553 31 42C31 41.447 30.552 41 30 41Z' />
          <path d='M10 43C10.26 43 10.52 42.89 10.71 42.71C10.89 42.52 11 42.26 11 42C11 41.74 10.89 41.479 10.71 41.3C10.34 40.92 9.67 40.92 9.29 41.29C9.11 41.479 9 41.74 9 42C9 42.26 9.11 42.52 9.29 42.71C9.48 42.89 9.74 43 10 43Z' />
          <path d='M49.29 34.29C49.11 34.479 49 34.729 49 35C49 35.26 49.11 35.52 49.29 35.71C49.48 35.89 49.74 36 50 36C50.26 36 50.52 35.89 50.71 35.71C50.89 35.52 51 35.26 51 35C51 34.74 50.89 34.479 50.71 34.29C50.34 33.92 49.67 33.92 49.29 34.29Z' />
          <path d='M50 20H35C34.448 20 34 20.447 34 21C34 21.553 34.448 22 35 22H50C50.552 22 51 21.553 51 21C51 20.447 50.552 20 50 20Z' />
          <path d='M50 27H40C39.448 27 39 27.447 39 28C39 28.553 39.448 29 40 29H50C50.552 29 51 28.553 51 28C51 27.447 50.552 27 50 27Z' />
          <path d='M30 29H32C32.552 29 33 28.553 33 28C33 27.447 32.552 27 32 27H30C29.448 27 29 27.447 29 28C29 28.553 29.448 29 30 29Z' />
          <path d='M30 15H45C45.552 15 46 14.553 46 14C46 13.447 45.552 13 45 13H30C29.448 13 29 13.447 29 14C29 14.553 29.448 15 30 15Z' />
          <path d='M50 15C50.26 15 50.52 14.89 50.71 14.71C50.9 14.52 51 14.26 51 14C51 13.74 50.9 13.479 50.71 13.29C50.33 12.92 49.66 12.92 49.29 13.29C49.11 13.479 49 13.74 49 14C49 14.26 49.11 14.52 49.29 14.71C49.48 14.89 49.74 15 50 15Z' />
          <path d='M30.29 20.29C30.11 20.479 30 20.729 30 21C30 21.26 30.11 21.52 30.29 21.71C30.48 21.89 30.74 22 31 22C31.26 22 31.52 21.89 31.71 21.71C31.89 21.52 32 21.26 32 21C32 20.729 31.89 20.479 31.71 20.29C31.33 19.92 30.67 19.92 30.29 20.29Z' />
          <path d='M35.29 27.29C35.11 27.479 35 27.74 35 28C35 28.26 35.11 28.52 35.29 28.71C35.48 28.89 35.74 29 36 29C36.26 29 36.52 28.89 36.71 28.71C36.89 28.52 37 28.26 37 28C37 27.74 36.89 27.479 36.71 27.29C36.34 26.92 35.66 26.92 35.29 27.29Z' />
          <path d='M25 13H9V29H25V13ZM23 27H11V15H23V27Z' />
        </g>
        <defs>
          <clipPath id='clip0_7904_84890'>
            <rect width='60' height='60' />
          </clipPath>
        </defs>
      </svg>
    )
  },
  {
    title: 'Konfirmasi Order',
    icon: (
      <svg id='wizardConfirm' xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'>
        <g>
          <path d='M8 16H23C23.552 16 24 15.553 24 15C24 14.447 23.552 14 23 14H8C7.448 14 7 14.447 7 15C7 15.553 7.448 16 8 16Z' />
          <path d='M8 13H17C17.552 13 18 12.553 18 12C18 11.447 17.552 11 17 11H8C7.448 11 7 11.447 7 12C7 12.553 7.448 13 8 13Z' />
          <path d='M24 18C24 17.447 23.552 17 23 17H8C7.448 17 7 17.447 7 18C7 18.553 7.448 19 8 19H23C23.552 19 24 18.553 24 18Z' />
          <path d='M60 4H31V1C31 0.447 30.552 0 30 0C29.448 0 29 0.447 29 1V4H0V46H27.586L15.293 58.293C14.902 58.684 14.902 59.316 15.293 59.707C15.488 59.902 15.744 60 16 60C16.256 60 16.512 59.902 16.707 59.707L29 47.414V57C29 57.553 29.448 58 30 58C30.552 58 31 57.553 31 57V47.414L43.293 59.707C43.488 59.902 43.744 60 44 60C44.256 60 44.512 59.902 44.707 59.707C45.098 59.316 45.098 58.684 44.707 58.293L32.414 46H60V4ZM58 44H2V6H58V44Z' />
          <path d='M41 20H45.586L33.6 31.986L25.307 23.693C24.916 23.302 24.284 23.302 23.893 23.693L11.293 36.293C10.902 36.684 10.902 37.316 11.293 37.707C11.488 37.902 11.744 38 12 38C12.256 38 12.512 37.902 12.707 37.707L24.6 25.814L32.893 34.107C33.088 34.302 33.344 34.4 33.6 34.4C33.856 34.4 34.112 34.302 34.307 34.107L47 21.414V26C47 26.553 47.447 27 48 27C48.553 27 49 26.553 49 26V19C49 18.87 48.974 18.74 48.923 18.618C48.822 18.373 48.627 18.178 48.382 18.077C48.26 18.026 48.13 18 48 18H41C40.448 18 40 18.447 40 19C40 19.553 40.448 20 41 20Z' />
        </g>
        <defs>
          <clipPath id='clip0_7904_84930'>
            <rect width='60' height='60' />
          </clipPath>
        </defs>
      </svg>
    )
  }
]

// Styled Components
const Stepper = styled(MuiStepper)<StepperProps>(({ theme }) => ({
  justifyContent: 'center',
  [theme.breakpoints.down('md')]: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: theme.spacing(1.5),
    '& .MuiStep-root': {
      padding: 0
    }
  },
  '& .MuiStep-root': {
    '& + i': {
      display: 'none',
      color: 'var(--mui-palette-text-secondary) !important'
    },
    '& .MuiStepLabel-label': {
      display: 'flex',
      cursor: 'pointer',
      alignItems: 'center',
      paddingBlock: theme.spacing(5),
      svg: {
        marginInline: theme.spacing(1.5),
        fill: 'var(--mui-palette-text-primary)',
        [theme.breakpoints.down('md')]: {
          width: '40px',
          height: '40px',
          marginInline: theme.spacing(1)
        }
      },
      '&.Mui-active, &.Mui-completed': {
        '& .MuiTypography-root': {
          color: 'var(--primary-color, var(--mui-palette-primary-main))'
        },
        '& svg': {
          fill: 'var(--primary-color, var(--mui-palette-primary-main))'
        }
      },
      [theme.breakpoints.down('md')]: {
        paddingBlock: theme.spacing(2),
        paddingInline: theme.spacing(2),
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        transition: 'all 0.3s ease',
        '&.Mui-active': {
          backgroundColor: 'rgba(var(--primary-color-rgb, 233, 30, 99), 0.08)',
          borderColor: 'var(--primary-color, #E91E63)'
        },
        '& .MuiTypography-root': {
          fontSize: '0.875rem',
          fontWeight: 500
        }
      }
    },
    '&.Mui-completed + i': {
      color: 'var(--primary-color, var(--mui-palette-primary-main)) !important'
    },

    [theme.breakpoints.up('md')]: {
      paddingBottom: 0,
      '& + svg': {
        display: 'block'
      },
      '& .MuiStepLabel-label': {
        display: 'block',
        backgroundColor: 'transparent',
        border: 'none'
      }
    }
  }
}))

const getStepContent = (
  step: number,
  handleNext: () => void,
  checkoutData: CheckoutData | null,
  setCheckoutData: (data: CheckoutData) => void,
  orderUuid: string | null,
  primaryColor?: string
) => {
  switch (step) {
    case 0:
      return <StepCart handleNext={handleNext} setCheckoutData={setCheckoutData} primaryColor={primaryColor} />
    case 1:
      return <StepConfirmation checkoutData={checkoutData} orderUuid={orderUuid} primaryColor={primaryColor} />
    default:
      return null
  }
}

const CheckoutWizard = ({ primaryColor = '#E91E63' }: CheckoutWizardProps) => {
  // States
  const [activeStep, setActiveStep] = useState<number>(0)
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [orderUuid, setOrderUuid] = useState<string | null>(null)

  const handleNext = (data?: CheckoutData, uuid?: string) => {
    if (data) {
      setCheckoutData(data)
    }
    if (uuid) {
      setOrderUuid(uuid)
    }
    setActiveStep(activeStep + 1)
  }

  return (
    <Card
      sx={{
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        mx: { xs: 0, sm: 1, md: 2 }
      }}
    >
      <CardContent sx={{ px: { xs: 3, sm: 4, md: 6 }, py: { xs: 3, md: 4 } }}>
        <StepperWrapper>
          <Stepper
            activeStep={activeStep}
            connector={
              <DirectionalIcon
                ltrIconClass='tabler-chevron-right'
                rtlIconClass='tabler-chevron-left'
                className='mli-12 hidden md:block text-xl text-textDisabled'
              />
            }
          >
            {steps.map((step, index) => {
              return (
                <Step key={index} onClick={() => setActiveStep(index)}>
                  <StepLabel icon={<></>} className='text-center'>
                    {step.icon}
                    <Typography className='step-title'>{step.title}</Typography>
                  </StepLabel>
                </Step>
              )
            })}
          </Stepper>
        </StepperWrapper>
      </CardContent>
      <Divider />

      <CardContent sx={{ px: { xs: 3, sm: 4, md: 6 }, py: { xs: 3, md: 4 } }}>
        {getStepContent(activeStep, handleNext, checkoutData, setCheckoutData, orderUuid, primaryColor)}
      </CardContent>
    </Card>
  )
}

export default CheckoutWizard
