'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Stepper from '@mui/material/Stepper'
import MuiStep from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import type { StepProps } from '@mui/material/Step'

// Third-party Imports 
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import DirectionalIcon from '@components/DirectionalIcon'
import StepperWrapper from '@core/styles/stepper'
import StoreInfoStep from './StoreInfoStep'
import BankAccountStep from './BankAccountStep' 
import SocialMediaStep from './SocialMediaStep'

// Styled Custom Components
const Step = styled(MuiStep)<StepProps>(({ theme }) => ({
  paddingInline: theme.spacing(4),
  paddingBlock: theme.spacing(1),
  '& + i': {
    color: 'var(--mui-palette-text-secondary)'
  },
  '&:first-of-type': {
    paddingInlineStart: 0
  },
  '&:last-of-type': {
    paddingInlineEnd: 0
  },
  '& .MuiStepLabel-iconContainer': {
    display: 'none'
  },
  '&.Mui-completed .step-title, &.Mui-completed .step-subtitle': {
    color: 'var(--mui-palette-text-disabled)'
  },
  '&.Mui-completed + i': {
    color: 'var(--mui-palette-primary-main)'
  },
  [theme.breakpoints.down('md')]: {
    padding: 0,
    ':not(:last-of-type)': {
      marginBlockEnd: theme.spacing(4)
    }
  }
}))

// Vars
const steps = [
  {
    title: 'Informasi Toko',
    icon: 'tabler-building-store',
    subtitle: 'Detail toko Anda'
  },
  {
    title: 'Akun Bank', 
    icon: 'tabler-credit-card',
    subtitle: 'Rekening pembayaran'
  },
  {
    title: 'Social Media',
    icon: 'tabler-brand-instagram',
    subtitle: 'Link media sosial'
  }
]

interface StoreSetupModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

const getStepContent = (
  step: number, 
  handleNext: () => void, 
  handlePrev: () => void, 
  onComplete: () => void,
  storeData: any,
  setStoreData: (data: any) => void
) => {
  switch (step) {
    case 0:
      return (
        <StoreInfoStep 
          handleNext={handleNext} 
          storeData={storeData}
          setStoreData={setStoreData}
        />
      )
    case 1:
      return (
        <BankAccountStep 
          handleNext={handleNext} 
          handlePrev={handlePrev}
          storeData={storeData}
          setStoreData={setStoreData}
        />
      )
    case 2:
      return (
        <SocialMediaStep 
          handlePrev={handlePrev}
          onComplete={onComplete}
          storeData={storeData}
          setStoreData={setStoreData}
        />
      )
    default:
      return null
  }
}

const StoreSetupModal = ({ open, onClose, onComplete }: StoreSetupModalProps) => {
  // States
  const [activeStep, setActiveStep] = useState<number>(0)
  const [storeData, setStoreData] = useState({
    // Store Info
    storeName: '',
    subdomain: '',
    phoneNumber: '',
    category: '',
    description: '',
    // Bank Account
    accountOwner: '',
    accountNumber: '',
    bankName: '',
    // Social Media
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: ''
  })

  // Hooks
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  // Handle Stepper
  const handleNext = () => {
    setActiveStep(activeStep + 1)
  }

  const handlePrev = () => {
    if (activeStep !== 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const handleComplete = () => {
    onComplete()
    onClose()
    // Reset data for next use
    setActiveStep(0)
    setStoreData({
      storeName: '',
      subdomain: '',
      phoneNumber: '',
      category: '',
      description: '',
      accountOwner: '',
      accountNumber: '',
      bankName: '',
      instagram: '',
      facebook: '',
      tiktok: '',
      youtube: ''
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          maxHeight: '90vh',
          margin: { xs: 2, sm: 3 },
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        pb: 1,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography variant="h4" component="h2" sx={{ 
            mb: 0.5, 
            fontWeight: 700,
            color: 'primary.main'
          }}>
            Setup Toko Anda
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Lengkapi informasi toko untuk memulai bisnis online Anda
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ 
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <i className="tabler-x" />
        </IconButton>
      </DialogTitle>
      
      <Divider sx={{ mx: 3 }} />
      
      <DialogContent sx={{ 
        p: { xs: 3, sm: 6 },
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '100%'
      }}>
        <Box sx={{ width: '100%', maxWidth: '800px' }}>
          <StepperWrapper>
            <Stepper
              activeStep={activeStep}
              connector={
                !isSmallScreen ? (
                  <DirectionalIcon
                    ltrIconClass='tabler-chevron-right'
                    rtlIconClass='tabler-chevron-left'
                    className='text-xl'
                    style={{ color: 'var(--mui-palette-primary-main)' }}
                  />
                ) : null
              }
              sx={{
                '& .MuiStepConnector-line': {
                  borderColor: 'divider'
                },
                mb: 4,
                justifyContent: 'center'
              }}
          >
            {steps.map((step, index) => {
              const isActive = activeStep === index
              const isCompleted = activeStep > index
              return (
                <Step key={index}>
                  <StepLabel>
                    <div className='step-label'>
                      <CustomAvatar
                        variant='rounded'
                        skin={isActive ? 'filled' : isCompleted ? 'filled' : 'light'}
                        color={isActive || isCompleted ? 'primary' : 'secondary'}
                        className={classnames({
                          'shadow-primarySm': isActive,
                          'shadow-sm': isCompleted && !isActive
                        })}
                        size={42}
                      >
                        {isCompleted && !isActive ? (
                          <i className="tabler-check text-[20px]" />
                        ) : (
                          <i className={classnames(step.icon, 'text-[20px]')} />
                        )}
                      </CustomAvatar>
                      <div className="ml-3">
                        <Typography 
                          className="step-title" 
                          sx={{ 
                            fontWeight: isActive ? 700 : 600,
                            color: isActive ? 'primary.main' : isCompleted ? 'success.main' : 'text.primary',
                            fontSize: '14px'
                          }}
                        >
                          {step.title}
                        </Typography>
                        <Typography 
                          className="step-subtitle" 
                          sx={{ 
                            fontSize: '12px',
                            color: 'text.secondary',
                            mt: 0.5
                          }}
                        >
                          {step.subtitle}
                        </Typography>
                      </div>
                    </div>
                  </StepLabel>
                </Step>
              )
            })}
          </Stepper>
          
          <Box sx={{ 
            backgroundColor: '#ffffff',
            borderRadius: 2,
            p: { xs: 3, sm: 4 },
            border: '1px solid',
            borderColor: 'divider',
            mt: 2
          }}>
            {getStepContent(activeStep, handleNext, handlePrev, handleComplete, storeData, setStoreData)}
          </Box>
          </StepperWrapper>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default StoreSetupModal