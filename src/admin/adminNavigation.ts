import {
  FiBarChart2,
  FiCalendar,
  FiCreditCard,
  FiGrid,
  FiImage,
  FiPackage,
  FiScissors,
  FiSettings,
  FiSlash,
  FiSmartphone,
  FiShoppingBag,
  FiStar,
  FiUsers,
} from 'react-icons/fi'

export const adminNavigation = [
  ['overview', 'Overview', FiGrid],
  ['appointments', 'Appointments', FiCalendar],
  ['days-off', 'Days off', FiSlash],
  ['homepage', 'Homepage', FiImage],
  ['shop-tiles', 'Shop tiles', FiPackage],
  ['services', 'Services', FiScissors],
  ['products', 'Products', FiPackage],
  ['orders', 'Orders', FiShoppingBag],
  ['reviews', 'Reviews', FiStar],
  ['customers', 'Customers', FiUsers],
  ['payments', 'Paystack history', FiCreditCard],
  ['mobile-money', 'Mobile Money', FiSmartphone],
  ['analytics', 'Analytics', FiBarChart2],
  ['settings', 'Settings', FiSettings],
] as const

export function currentAdminSection() {
  return (
    window.location.hash.replace(/^#\//, '').split('?')[0].split('/')[1] ||
    'overview'
  )
}