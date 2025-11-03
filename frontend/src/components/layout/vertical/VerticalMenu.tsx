
// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'
import CustomChip from '@core/components/mui/Chip'

// import { GenerateVerticalMenu } from '@components/GenerateMenu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// Menu Data Imports
// import menuData from '@/data/navigation/verticalMenuData'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuSection label='Main Navigation'>
          <MenuItem href='/dashboard' icon={<i className='tabler-smart-home' />}>
            Dashboard
          </MenuItem>
          
          <SubMenu label='Master Data' icon={<i className='tabler-database' />}>
            <MenuItem href='/master-data/users' icon={<i className='tabler-users' />}>
              User Management
            </MenuItem>
            <MenuItem href='/master-data/roles' icon={<i className='tabler-shield' />}>
              Role Management
            </MenuItem>
            <MenuItem href='/master-data/permissions' icon={<i className='tabler-key' />}>
              Permission Management
            </MenuItem>
          </SubMenu>

          <SubMenu label='Store Management' icon={<i className='tabler-store' />}>
            <MenuItem href='/stores' icon={<i className='tabler-building-store' />}>
              Stores List
            </MenuItem>
            <MenuItem href='/stores/my-store' icon={<i className='tabler-home' />}>
              My Store
            </MenuItem>
            <MenuItem href='/stores/settings' icon={<i className='tabler-settings' />}>
              Store Settings
            </MenuItem>
          </SubMenu>

          <MenuItem href='/analytics' icon={<i className='tabler-chart-line' />}>
            Analytics
          </MenuItem>
        </MenuSection>

        <MenuSection label='Tools'>
          <MenuItem href='/ui-demo' icon={<i className='tabler-palette' />}>
            🎨 UI Demo
          </MenuItem>
          
          <MenuItem href='/pages/landing' icon={<i className='tabler-file' />}>
            Landing Page Builder
          </MenuItem>
          
          <SubMenu label='Content' icon={<i className='tabler-notebook' />}>
            <MenuItem href='/content/products' icon={<i className='tabler-package' />}>
              Products
            </MenuItem>
            <MenuItem href='/content/orders' icon={<i className='tabler-shopping-cart' />}>
              Orders
            </MenuItem>
          </SubMenu>
        </MenuSection>
      </Menu>
      {/* <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <GenerateVerticalMenu menuData={menuData(dictionary)} />
      </Menu> */}
    </ScrollWrapper>
  )
}

export default VerticalMenu
