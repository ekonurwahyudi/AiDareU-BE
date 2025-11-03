// Next Imports
import { cookies } from 'next/headers'

// Third-party Imports
import 'server-only'

// Type Imports
import type { Settings } from '@core/contexts/settingsContext'
import type { SystemMode } from '@core/types'

// Config Imports
import themeConfig from '@configs/themeConfig'

export const getSettingsFromCookie = async (): Promise<Settings> => {
  const cookieStore = await cookies()

  const cookieName = themeConfig.settingsCookieName

  return JSON.parse(cookieStore.get(cookieName)?.value || '{}')
}

export const getMode = async () => {
  const settingsCookie = await getSettingsFromCookie()

  // Get mode from cookie or fallback to theme config
 const _mode = settingsCookie.mode || themeConfig.mode

  // Coerce 'system' ke 'light' agar aplikasi tidak pernah memakai mode system
  const normalizedMode = _mode === 'system' ? 'light' : _mode

  return normalizedMode
}

export const getSystemMode = async (): Promise<SystemMode> => {
  const cookieStore = await cookies()

  // Directly return the system color preference since app no longer uses 'system' mode
  const colorPrefCookie = (cookieStore.get('colorPref')?.value || 'light') as SystemMode

  return colorPrefCookie
}

export const getServerMode = async () => {
  const mode = await getMode()

  // Mode is already normalized to 'light' | 'dark'
  return mode
}

export const getSkin = async () => {
  const settingsCookie = await getSettingsFromCookie()

  return settingsCookie.skin || 'default'
}
