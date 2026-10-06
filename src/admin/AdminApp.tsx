import { AdminShell } from './components/AdminShell'
import { currentAdminSection } from './adminNavigation'
import { AnalyticsAdminPage } from './pages/AnalyticsAdminPage'
import { AppointmentsAdminPage } from './pages/AppointmentsAdminPage'
import { CustomersAdminPage } from './pages/CustomersAdminPage'
import { HeroSlidesAdminPage } from './pages/HeroSlidesAdminPage'
import { MobileMoneyAdminPage } from './pages/MobileMoneyAdminPage'
import { OrdersAdminPage } from './pages/OrdersAdminPage'
import { OverviewAdminPage } from './pages/OverviewAdminPage'
import { PaymentsAdminPage } from './pages/PaymentsAdminPage'
import { ProductsAdminPage } from './pages/ProductsAdminPage'
import { ReviewsAdminPage } from './pages/ReviewsAdminPage'
import { ServicesAdminPage } from './pages/ServicesAdminPage'
import { SettingsAdminPage } from './pages/SettingsAdminPage'
import { ShopTilesAdminPage } from './pages/ShopTilesAdminPage'

const pages = {
  overview: OverviewAdminPage,
  appointments: AppointmentsAdminPage,
  homepage: HeroSlidesAdminPage,
  'shop-tiles': ShopTilesAdminPage,
  services: ServicesAdminPage,
  products: ProductsAdminPage,
  orders: OrdersAdminPage,
  reviews: ReviewsAdminPage,
  customers: CustomersAdminPage,
  payments: PaymentsAdminPage,
  'mobile-money': MobileMoneyAdminPage,
  analytics: AnalyticsAdminPage,
  settings: SettingsAdminPage,
}

export function AdminApp() {
  const section = currentAdminSection()
  const Page = pages[section as keyof typeof pages] ?? OverviewAdminPage
  return (
    <AdminShell>
      <Page />
    </AdminShell>
  )
}