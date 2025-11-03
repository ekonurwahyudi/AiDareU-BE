
// MUI Imports
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import HorizontalNav, { Menu, SubMenu, MenuItem } from '@menu/horizontal-menu'
import VerticalNavContent from './VerticalNavContent'
import CustomChip from '@core/components/mui/Chip'

// import { GenerateHorizontalMenu } from '@components/GenerateMenu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useRBAC } from '@/contexts/rbacContext'

// Styled Component Imports
import StyledHorizontalNavExpandIcon from '@menu/styles/horizontal/StyledHorizontalNavExpandIcon'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/horizontal/menuItemStyles'
import menuRootStyles from '@core/styles/horizontal/menuRootStyles'
import verticalNavigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import verticalMenuItemStyles from '@core/styles/vertical/menuItemStyles'
import verticalMenuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// Menu Data Imports
// import menuData from '@/data/navigation/horizontalMenuData'

type RenderExpandIconProps = {
  level?: number
}

type RenderVerticalExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ level }: RenderExpandIconProps) => (
  <StyledHorizontalNavExpandIcon level={level}>
    <i className='tabler-chevron-right' />
  </StyledHorizontalNavExpandIcon>
)

const RenderVerticalExpandIcon = ({ open, transitionDuration }: RenderVerticalExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const HorizontalMenu = () => {
  // Hooks
  const verticalNavOptions = useVerticalNav()
  const theme = useTheme()
  const { hasRole } = useRBAC()

  // Vars
  const { transitionDuration } = verticalNavOptions

  return (
    <HorizontalNav
      switchToVertical
      verticalNavContent={VerticalNavContent}
      verticalNavProps={{
        customStyles: verticalNavigationCustomStyles(verticalNavOptions, theme),
        backgroundColor: 'var(--mui-palette-background-paper)'
      }}
    >
      <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        menuItemStyles={menuItemStyles(theme, 'tabler-circle')}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='tabler-circle text-xs' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
          <MenuItem href='/dashboards/ecommerce' activeUrl='/dashboards' exactMatch={false} icon={<i className='tabler-smart-home' />}>
            Dashboard
          </MenuItem>
          
          <MenuItem href="https://wa.me/6285117756563" target="_blank"
          icon={
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path opacity="0.3" d="M4.05424 15.1982C8.34524 7.76818 13.5782 3.26318 20.9282 2.01418C21.0729 1.98837 21.2216 1.99789 21.3618 2.04193C21.502 2.08597 21.6294 2.16323 21.7333 2.26712C21.8372 2.37101 21.9144 2.49846 21.9585 2.63863C22.0025 2.7788 22.012 2.92754 21.9862 3.07218C20.7372 10.4222 16.2322 15.6552 8.80224 19.9462L4.05424 15.1982ZM3.81924 17.3372L2.63324 20.4482C2.58427 20.5765 2.5735 20.7163 2.6022 20.8507C2.63091 20.9851 2.69788 21.1082 2.79503 21.2054C2.89218 21.3025 3.01536 21.3695 3.14972 21.3982C3.28408 21.4269 3.42387 21.4161 3.55224 21.3672L6.66524 20.1802L3.81924 17.3372ZM16.5002 5.99818C16.2036 5.99818 15.9136 6.08615 15.6669 6.25097C15.4202 6.41579 15.228 6.65006 15.1144 6.92415C15.0009 7.19824 14.9712 7.49984 15.0291 7.79081C15.0869 8.08178 15.2298 8.34906 15.4396 8.55884C15.6494 8.76862 15.9166 8.91148 16.2076 8.96935C16.4986 9.02723 16.8002 8.99753 17.0743 8.884C17.3484 8.77046 17.5826 8.5782 17.7474 8.33153C17.9123 8.08486 18.0002 7.79485 18.0002 7.49818C18.0002 7.10035 17.8422 6.71882 17.5609 6.43752C17.2796 6.15621 16.8981 5.99818 16.5002 5.99818Z" fill="currentColor"/>
              <path d="M4.05423 15.1982L2.24723 13.3912C2.15505 13.299 2.08547 13.1867 2.04395 13.0632C2.00243 12.9396 1.9901 12.8081 2.00793 12.679C2.02575 12.5498 2.07325 12.4266 2.14669 12.3189C2.22013 12.2112 2.31752 12.1219 2.43123 12.0582L9.15323 8.28918C7.17353 10.3717 5.4607 12.6926 4.05423 15.1982ZM8.80023 19.9442L10.6072 21.7512C10.6994 21.8434 10.8117 21.9129 10.9352 21.9545C11.0588 21.996 11.1903 22.0083 11.3195 21.9905C11.4486 21.9727 11.5718 21.9252 11.6795 21.8517C11.7872 21.7783 11.8765 21.6809 11.9402 21.5672L15.7092 14.8442C13.6269 16.8245 11.3061 18.5377 8.80023 19.9442ZM7.04023 18.1832L12.5832 12.6402C12.7381 12.4759 12.8228 12.2577 12.8195 12.032C12.8161 11.8063 12.725 11.5907 12.5653 11.4311C12.4057 11.2714 12.1901 11.1803 11.9644 11.1769C11.7387 11.1736 11.5205 11.2583 11.3562 11.4132L5.81323 16.9562L7.04023 18.1832Z" fill="currentColor"/>
            </svg>
          }>
            Mentoring AI
          </MenuItem>
          
          <MenuItem href='/apps/tokoku/theme-settings' activeUrl='/apps/tokoku/theme-settings' exactMatch={false} 
          icon={
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path opacity="0.3" d="M21.25 18.525L13.05 21.825C12.35 22.125 11.65 22.125 10.95 21.825L2.75 18.525C1.75 18.125 1.75 16.725 2.75 16.325L4.04999 15.825L10.25 18.325C10.85 18.525 11.45 18.625 12.05 18.625C12.65 18.625 13.25 18.525 13.85 18.325L20.05 15.825L21.35 16.325C22.35 16.725 22.35 18.125 21.25 18.525ZM13.05 16.425L21.25 13.125C22.25 12.725 22.25 11.325 21.25 10.925L13.05 7.62502C12.35 7.32502 11.65 7.32502 10.95 7.62502L2.75 10.925C1.75 11.325 1.75 12.725 2.75 13.125L10.95 16.425C11.65 16.725 12.45 16.725 13.05 16.425Z" fill="currentColor"/>
              <path d="M11.05 11.025L2.84998 7.725C1.84998 7.325 1.84998 5.925 2.84998 5.525L11.05 2.225C11.75 1.925 12.45 1.925 13.15 2.225L21.35 5.525C22.35 5.925 22.35 7.325 21.35 7.725L13.05 11.025C12.45 11.325 11.65 11.325 11.05 11.025Z" fill="currentColor"/>
            </svg>
          }>
            Websiteku
          </MenuItem>
          
          <SubMenu
            label="E-Learning"
            icon={
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                  <rect x="0" y="0" width="24" height="24" fill="none" />
                  <path
                    d="M7,15 C7.55228475,15 8,15.4477153 8,16 C8,16.5522847 7.55228475,17 7,17 L6,17 C4.34314575,17 3,15.6568542 3,14 L3,7 C3,5.34314575 4.34314575,4 6,4 L18,4 C19.6568542,4 21,5.34314575 21,7 L21,14 C21,15.6568542 19.6568542,17 18,17 L17,17 C16.4477153,17 16,16.5522847 16,16 C16,15.4477153 16.4477153,15 17,15 L18,15 C18.5522847,15 19,14.5522847 19,14 L19,7 C19,6.44771525 18.5522847,6 18,6 L6,6 C5.44771525,6 5,6.44771525 5,7 L5,14 C5,14.5522847 5.44771525,15 6,15 L7,15 Z"
                    fill="currentColor"
                    fillRule="nonzero"
                  />
                  <polygon
                    points="8 20 16 20 12 15"
                    fill="currentColor"
                    opacity="0.3"
                  />
                </g>
              </svg>
            }
          >
            <MenuItem href="#" icon={<i className='tabler-school' />}
              suffix={<CustomChip label="Coming Soon" size="small" variant="tonal" color="warning" round="true" />}
            >
              Materi Pembelajaran (Cooming Soon)
            </MenuItem>
            {/* <MenuItem href="#" icon={<i className='tabler-search' />}>
              Explore Course
            </MenuItem>
            <MenuItem href="#" icon={<i className='tabler-plus' />}>
              Add Course
            </MenuItem>
            <MenuItem href="#" icon={<i className='tabler-category' />}>
              Add Kategory
            </MenuItem> */}
          </SubMenu>
          
          <SubMenu label="Tokoku" 
          icon={
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path opacity="0.3" d="M18 10V20C18 20.6 18.4 21 19 21C19.6 21 20 20.6 20 20V10H18Z" fill="currentColor"/>
              <path opacity="0.3" d="M11 10V17H6V10H4V20C4 20.6 4.4 21 5 21H12C12.6 21 13 20.6 13 20V10H11Z" fill="currentColor"/>
              <path opacity="0.3" d="M10 10C10 11.1 9.1 12 8 12C6.9 12 6 11.1 6 10H10Z" fill="currentColor"/>
              <path opacity="0.3" d="M18 10C18 11.1 17.1 12 16 12C14.9 12 14 11.1 14 10H18Z" fill="currentColor"/>
              <path opacity="0.3" d="M14 4H10V10H14V4Z" fill="currentColor"/>
              <path opacity="0.3" d="M17 4H20L22 10H18L17 4Z" fill="currentColor"/>
              <path opacity="0.3" d="M7 4H4L2 10H6L7 4Z" fill="currentColor"/>
              <path d="M6 10C6 11.1 5.1 12 4 12C2.9 12 2 11.1 2 10H6ZM10 10C10 11.1 10.9 12 12 12C13.1 12 14 11.1 14 10H10ZM18 10C18 11.1 18.9 12 20 12C21.1 12 22 11.1 22 10H18ZM19 2H5C4.4 2 4 2.4 4 3V4H20V3C20 2.4 19.6 2 19 2ZM12 17C12 16.4 11.6 16 11 16H6C5.4 16 5 16.4 5 17C5 17.6 5.4 18 6 18H11C11.6 18 12 17.6 12 17Z" fill="currentColor"/>
            </svg>
          }
        >
            <MenuItem href="/apps/tokoku/orders" activeUrl='/apps/tokoku/orders' exactMatch={false}  icon={<i className='tabler-package' />}>
              My Order
            </MenuItem>
            <MenuItem href="/apps/tokoku/products" activeUrl='/apps/tokoku/products' exactMatch={false}  icon={<i className='tabler-augmented-reality' />}>
              My Product
            </MenuItem>
            <MenuItem href="/apps/tokoku/customers" activeUrl='/apps/tokoku/customers' exactMatch={false}  icon={<i className='tabler-users' />}>
              List Customer
            </MenuItem>
            <MenuItem href="/apps/settings" icon={<i className='tabler-settings' />}>
              Setting Toko
            </MenuItem>
          </SubMenu>
          
          <MenuItem href="/apps/products-digital" activeUrl='/apps/products-digital' exactMatch={false}  icon={
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path opacity="0.3" d="M8.9 21L7.19999 22.6999C6.79999 23.0999 6.2 23.0999 5.8 22.6999L4.1 21H8.9ZM4 16.0999L2.3 17.8C1.9 18.2 1.9 18.7999 2.3 19.1999L4 20.9V16.0999ZM19.3 9.1999L15.8 5.6999C15.4 5.2999 14.8 5.2999 14.4 5.6999L9 11.0999V21L19.3 10.6999C19.7 10.2999 19.7 9.5999 19.3 9.1999Z" fill="currentColor"/>
              <path d="M21 15V20C21 20.6 20.6 21 20 21H11.8L18.8 14H20C20.6 14 21 14.4 21 15ZM10 21V4C10 3.4 9.6 3 9 3H4C3.4 3 3 3.4 3 4V21C3 21.6 3.4 22 4 22H9C9.6 22 10 21.6 10 21ZM7.5 18.5C7.5 19.1 7.1 19.5 6.5 19.5C5.9 19.5 5.5 19.1 5.5 18.5C5.5 17.9 5.9 17.5 6.5 17.5C7.1 17.5 7.5 17.9 7.5 18.5Z" fill="currentColor"/>
            </svg>
          }>
            Product Digital
          </MenuItem>
          
          <MenuItem href="#" icon={<i className='tabler-brand-github-copilot' />}>
            Join Komunitas
          </MenuItem>
          {hasRole('owner') && (
            <SubMenu label="Master Data"
            icon={
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <rect opacity="0.5" x="7" y="2" width="14" height="16" rx="3" fill="currentColor"/>
      <rect x="3" y="6" width="14" height="16" rx="3" fill="currentColor"/>
              </svg>
            }
          >
              <MenuItem href="#" icon={<i className='tabler-user-screen' />}>
                User Management
              </MenuItem>
              <MenuItem href="#" icon={<i className='tabler-building-store' />}>
                Toko Management
              </MenuItem>
              <MenuItem href="#" icon={<i className='tabler-tournament' />}>
                Menu Management
              </MenuItem>
              <MenuItem href="#" icon={<i className='tabler-world-www' />}>
                Domain Management
              </MenuItem>
              <MenuItem href="#" icon={<i className='tabler-mood-search' />}>
                Customer Management
              </MenuItem>
              <MenuItem href="#" icon={<i className='tabler-album' />}>
                Learning Management
              </MenuItem>
              <MenuItem href="#" icon={<i className='tabler-augmented-reality' />}>
                Product Management
              </MenuItem>
            </SubMenu>
          )}
          
      </Menu>
      {/* <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        menuItemStyles={menuItemStyles(theme, 'tabler-circle')}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='tabler-circle text-xs' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
        <GenerateHorizontalMenu menuData={menuData(dictionary)} />
      </Menu> */}
    </HorizontalNav>
  )
}

export default HorizontalMenu
