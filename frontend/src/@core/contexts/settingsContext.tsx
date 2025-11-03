'use client'

// React Imports
import type { ReactNode } from 'react'
import { createContext, useMemo, useState } from 'react'

// Type Imports
import type { Mode, Skin, Layout, LayoutComponentWidth } from '@core/types'

// Config Imports
import themeConfig from '@configs/themeConfig'
import primaryColorConfig from '@configs/primaryColorConfig'

// Hook Imports
import { useObjectCookie } from '@core/hooks/useObjectCookie'

// Settings type
export type Settings = {
  mode?: Mode
  skin?: Skin
  semiDark?: boolean
  layout?: Layout
  navbarContentWidth?: LayoutComponentWidth
  contentWidth?: LayoutComponentWidth
  footerContentWidth?: LayoutComponentWidth
  primaryColor?: string
}

// UpdateSettingsOptions type
type UpdateSettingsOptions = {
  updateCookie?: boolean
}

// SettingsContextProps type
type SettingsContextProps = {
  settings: Settings
  updateSettings: (settings: Partial<Settings>, options?: UpdateSettingsOptions) => void
  isSettingsChanged: boolean
  resetSettings: () => void
  updatePageSettings: (settings: Partial<Settings>) => () => void
}

type Props = {
  children: ReactNode
  settingsCookie: Settings | null
  mode?: Mode
}

// Initial Settings Context
export const SettingsContext = createContext<SettingsContextProps | null>(null)

// Settings Provider
export const SettingsProvider = (props: Props) => {
  // Initial Settings
  const normalizeMode = (mode?: Mode): Mode => (mode === 'system' ? 'light' : mode || 'light')
  const normalizeLayout = (layout?: Layout): Layout => 'horizontal'

  const initialSettings: Settings = {
    mode: normalizeMode(themeConfig.mode),
    skin: themeConfig.skin,
    semiDark: themeConfig.semiDark,
    layout: normalizeLayout(themeConfig.layout),
    navbarContentWidth: themeConfig.navbar.contentWidth,
    contentWidth: themeConfig.contentWidth,
    footerContentWidth: themeConfig.footer.contentWidth,
    primaryColor: '#FF3B30'
  }

  const updatedInitialSettings = {
    ...initialSettings,
    mode: normalizeMode(props.mode || themeConfig.mode)
  }

  // Cookies
  const [settingsCookie, updateSettingsCookie] = useObjectCookie<Settings>(
    themeConfig.settingsCookieName,
    JSON.stringify(props.settingsCookie) !== '{}' ? props.settingsCookie : updatedInitialSettings
  )

  // State
  const [_settingsState, _updateSettingsState] = useState<Settings>(
    JSON.stringify(settingsCookie) !== '{}'
      ? { ...settingsCookie, mode: normalizeMode(settingsCookie.mode), layout: normalizeLayout(settingsCookie.layout as Layout) }
      : updatedInitialSettings
  )

  const updateSettings = (settings: Partial<Settings>, options?: UpdateSettingsOptions) => {
    const { updateCookie = true } = options || {}

    _updateSettingsState(prev => {
      // Normalisasi agar tidak pernah menyimpan 'system' & paksa layout horizontal
      const newSettings = { ...prev, ...settings }
      newSettings.mode = normalizeMode(newSettings.mode as Mode)
      newSettings.layout = normalizeLayout(newSettings.layout as Layout)

      // Update cookie jika diperlukan
      if (updateCookie) updateSettingsCookie(newSettings)

      return newSettings
    })
  }

  /**
   * Updates the settings for page with the provided settings object.
   * Updated settings won't be saved to cookie hence will be reverted once navigating away from the page.
   *
   * @param settings - The partial settings object containing the properties to update.
   * @returns A function to reset the page settings.
   *
   * @example
   * useEffect(() => {
   *     return updatePageSettings({ theme: 'dark' });
   * }, []);
   */
  const updatePageSettings = (settings: Partial<Settings>): (() => void) => {
    updateSettings(settings, { updateCookie: false })

    // Returns a function to reset the page settings
    return () => updateSettings(settingsCookie, { updateCookie: false })
  }

  const resetSettings = () => {
    updateSettings(initialSettings)
  }

  const isSettingsChanged = useMemo(
    () => JSON.stringify(initialSettings) !== JSON.stringify(_settingsState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_settingsState]
  )

  return (
    <SettingsContext.Provider
      value={{
        settings: _settingsState,
        updateSettings,
        isSettingsChanged,
        resetSettings,
        updatePageSettings
      }}
    >
      {props.children}
    </SettingsContext.Provider>
  )
}
