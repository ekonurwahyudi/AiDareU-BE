'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import MuiButton from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import type { ButtonProps } from '@mui/material/Button'

// Component Imports
import UpgradePlan from '@components/dialogs/upgrade-plan'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import Link from 'next/link'

const Button = styled(MuiButton)<ButtonProps>(() => ({
  backgroundColor: 'var(--mui-palette-common-white) !important',
  color: 'var(--mui-palette-primary-main) !important'
}))

const UserPlan = () => {
  // Vars
  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Coming Soon'
  }

  return (
    // <Card>
    //   <CardContent className='flex flex-col gap-6 bg-gradient-to-tr	from-primary to-[#9E95F5]'>
    //     <div className='flex items-center justify-between'>
    //       <div className='flex flex-col gap-4'>
    //         <Typography variant='h5' color='common.white'>
    //           Upgrade to premium
    //         </Typography>
    //         <Typography color='common.white'>Upgrade customer to premium membership to access pro features.</Typography>
    //       </div>
    //       <img src='/images/apps/ecommerce/3d-rocket.png' className='-mis-7 -mbe-7' />
    //     </div>
    //     <OpenDialogOnElementClick element={Button} elementProps={buttonProps} dialog={UpgradePlan} />
    //   </CardContent>
    // </Card>
   
      <Card>
        <CardContent className='flex flex-col gap-6 bg-gradient-to-tr from-primary to-[#9E95F5]'>
          <div className='flex items-center justify-between'>
            <div className='flex flex-col gap-4'>
              <Typography variant='h5' color='common.white'>
                Upgrade to premium
              </Typography>
              <Typography color='common.white'>
                Upgrade customer to premium membership to access pro features.
              </Typography>
            </div>
            <img src='/images/apps/ecommerce/3d-rocket.png' className='-mis-7 -mbe-7' />
          </div>

          <Link href="#" className='text-center'>
            <Button variant="contained" color="primary">
              Coming Soon
            </Button>
          </Link>
        </CardContent>
      </Card>

  )
}

export default UserPlan
