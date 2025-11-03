// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ResetPasswordV1 from '@views/pages/auth/ResetPasswordV1'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Reset Password - AiDareU',
  description: 'Set password baru untuk akun Anda'
}

const ResetPasswordPage = async () => {
  // Vars
  const mode = await getServerMode()

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <ResetPasswordV1 />
    </div>
  )
}

export default ResetPasswordPage