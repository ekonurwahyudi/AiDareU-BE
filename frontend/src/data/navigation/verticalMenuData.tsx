// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

const verticalMenuData = (): VerticalMenuDataType[] => [
  {
    label: 'Dashboards',
    icon: 'tabler-smart-home',
    children: [
      {
        label: 'eCommerce',
        icon: 'tabler-circle',
        href: '/dashboards/ecommerce'
      }
    ]
  },
  {
    label: 'E-learning',
    icon: 'tabler-school',
    children: [
      {
        label: 'My Courses',
        icon: 'tabler-circle',
        href: '/apps/academy/my-courses'
      }
    ]
  },
  {
    label: 'Users Management',
    icon: 'tabler-user',
    children: [
      {
        label: 'List',
        icon: 'tabler-circle',
        href: '/apps/user/list'
      }
    ]
  }
]

export default verticalMenuData
