// Next Imports
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

// Component Imports
import RegisterV1 from '@views/pages/auth/RegisterV1'
import { authOptions } from '@/libs/auth'

const RegistrasiPage = async () => {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/dashboards/ecommerce')
  }

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <RegisterV1 />
    </div>
  )
}

export default RegistrasiPage