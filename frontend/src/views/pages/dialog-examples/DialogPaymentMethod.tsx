// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { ButtonProps } from '@mui/material/Button'

// Component Imports
import PaymentMethod from '@components/dialogs/payment-method'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

const DialogPaymentMethod = () => {
  // Vars
  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Show'
  }

  return (
    <Card>
      <CardContent className='flex flex-col items-center text-center gap-4'>
        <i className='tabler-credit-card text-[34px] text-textPrimary' />
        <Typography variant='h5'>Payment Methods</Typography>
        <Typography color='text.primary'>
          Select from available payment methods with this easy to use dialog.
        </Typography>
        <OpenDialogOnElementClick element={Button} elementProps={buttonProps} dialog={PaymentMethod} />
      </CardContent>
    </Card>
  )
}

export default DialogPaymentMethod