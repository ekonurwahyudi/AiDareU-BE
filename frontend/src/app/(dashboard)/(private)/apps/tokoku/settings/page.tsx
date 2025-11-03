// React Imports
import type { ReactElement } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// Component Imports
import Settings from '@/views/apps/tokoku/settings'

const StoreDetailsTab = dynamic(() => import('@/views/apps/tokoku/settings/store-details'))
const PaymentsTab = dynamic(() => import('@/views/apps/tokoku/settings/payments'))
const CheckoutTab = dynamic(() => import('@/views/apps/tokoku/settings/checkout'))
const ShippingDeliveryTab = dynamic(() => import('@/views/apps/tokoku/settings/ShippingDelivery'))
const LocationsTab = dynamic(() => import('@/views/apps/tokoku/settings/locations'))
const NotificationsTab = dynamic(() => import('@/views/apps/tokoku/settings/Notifications'))

// Vars
const tabContentList = (): { [key: string]: ReactElement } => ({
  'store-details': <StoreDetailsTab />,
  payments: <PaymentsTab />,
  checkout: <CheckoutTab />,
  'shipping-delivery': <ShippingDeliveryTab />,
  locations: <LocationsTab />,
  notifications: <NotificationsTab />
})

const eCommerceSettings = () => {
  return <Settings tabContentList={tabContentList()} />
}

export default eCommerceSettings
