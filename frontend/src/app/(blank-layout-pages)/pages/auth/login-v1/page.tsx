// Component Imports
import LoginV1 from '@views/pages/auth/LoginV1'
import { getSystemMode } from '@core/utils/serverHelpers'

const LoginV1Page = async () => {
  const systemMode = await getSystemMode()

  return (
    <div className='flex bs-full justify-center'>
      <div className='flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden'>
        <LoginV1 mode={systemMode} />
      </div>
    </div>
  )
}

export default LoginV1Page
