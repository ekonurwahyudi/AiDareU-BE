// Next Imports
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

// Component Imports
import RegisterV1 from '@views/pages/auth/RegisterV1'
import { authOptions } from '@/libs/auth'

const RegisterPage = async () => {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/dashboard')
  }

  return <RegisterV1 />
}

export default RegisterPage