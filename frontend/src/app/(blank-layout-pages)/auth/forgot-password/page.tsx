// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ForgotPasswordV1 from '@views/pages/auth/ForgotPasswordV1'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Lupa Password - AiDareU',
  description: 'Reset password akun Anda'
}

const ForgotPasswordPage = async () => {
  // Vars
  const mode = await getServerMode()

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <ForgotPasswordV1 />
    </div>
  )
}

export default ForgotPasswordPage