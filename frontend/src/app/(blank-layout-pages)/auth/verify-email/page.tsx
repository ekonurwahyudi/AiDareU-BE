// Next Imports
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

// Component Imports
import TwoStepsV1 from '@views/pages/auth/TwoStepsV1'
import { authOptions } from '@/libs/auth'

const VerifyEmailPage = async () => {
  // Allow access to this page even if not authenticated
  // since they need to verify their email first
  
  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <TwoStepsV1 />
    </div>
  )
}

export default VerifyEmailPage