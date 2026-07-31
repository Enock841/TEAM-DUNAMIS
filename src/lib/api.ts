import type { Product, Service, User } from '../data/catalog'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not configured')
}

type ApiOptions = RequestInit & {
  token?: string | null
}

type AuthResponse = {
  user: User
  token: string
}

export type Availability = {
  date: string
  serviceId: string
  categoryId: string
  dailyCap: number
  bookedCount: number
  slotsRemaining: number
  available: boolean
}

export type AdminBooking = {
  id: string
  date: string
  timeSlot: string
  status: string
  user: Pick<User, 'id' | 'name' | 'phone'>
  service: { id: string; name: string }
  category: { id: string; name: string }
}

export type AdminOrder = {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  deliveryName?: string
  deliveryPhone?: string
  deliveryAddress?: string
  deliveryNotes?: string
  user: Pick<User, 'id' | 'name' | 'phone'>
  items: Array<{
    productId: string
    name: string
    quantity: number
    unitPrice: number
  }>
}

export type AdminCustomer = {
  id: string
  name: string
  phone: string
  createdAt: string
  bookingCount: number
  orderCount: number
  totalSpent: number | string
}

export type AdminPayment = {
  id: string
  reference: string
  paymentType: 'booking' | 'order'
  amount: number | string
  status: 'pending' | 'success' | 'failed'
  momoNumber: string
  createdAt: string
  customer: Pick<User, 'id' | 'name' | 'phone'>
}

export type AdminAnalytics = {
  metrics: {
    customers: number
    appointments: number
    orders: number
    revenue: number | string
  }
  popularServices: Array<{ name: string; bookings: number }>
  bestSellingProducts: Array<{ name: string; units: number }>
  revenueTrend: Array<{ month: string; amount: number | string }>
}

export type AdminSettings = {
  businessName: string
  phone: string
  address: string
  openingHours: Record<string, string>
  notifications: Record<string, boolean>
  paymentMethods: Record<string, boolean>
  updatedAt?: string
}

export type AdminStaff = {
  id: string
  name: string
  phone: string
  isActive: boolean
  createdAt: string
}

export type CustomerBooking = {
  id: string
  date: string
  timeSlot: string
  status: string
  serviceName: string
  categoryName: string
}

export type CustomerOrder = {
  id: string
  status: string
  totalAmount: number | string
  createdAt: string
  items: Array<{
    productId: string
    name: string
    quantity: number
    unitPrice: number | string
  }>
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error ?? 'Unable to complete your request',
    )
  }

  return payload as T
}

function normalizeProduct(product: Omit<Product, 'price' | 'image'> & {
  price: number | string
}) {
  return {
    ...product,
    price: Number(product.price),
    image: product.images[0] ?? '',
  } satisfies Product
}

function normalizeService(
  service: Omit<Service, 'durationMinutes' | 'priceMin' | 'priceMax'> & {
    durationMinutes: number | string
    priceMin: number | string
    priceMax: number | string
  },
) {
  return {
    ...service,
    durationMinutes: Number(service.durationMinutes),
    priceMin: Number(service.priceMin),
    priceMax: Number(service.priceMax),
  } satisfies Service
}

export type HeroSlide = {
  id: string
  eyebrow: string
  title: string
  subtitle: string
  imageUrl: string
  sortOrder: number
  isActive?: boolean
}

export type Review = {
  id: string
  rating: number
  comment: string
  mediaUrl?: string
  mediaType?: 'photo' | 'video'
  status?: string
  createdAt: string
  updatedAt?: string
  customerName: string
  serviceName: string
}

export type ReviewableBooking = {
  bookingId: string
  serviceName: string
  date: string
}

export type ShopCategoryTile = {
  id: string
  title: string
  label: string
  copy: string
  imageUrl: string
  href: string
  sortOrder: number
  isActive?: boolean
}

export type BusinessInfo = {
  businessName: string
  phone: string
  address: string
  openingHours: Record<string, string>
}

export type ServiceLengthOption = {
  id: string
  serviceId: string
  label: string
  priceMin: number
  priceMax: number
  sortOrder: number
}

export const api = {
  newsletterSubscribe(email: string) {
    return request<{ message: string }>('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
  serviceLengthOptions(serviceId: string) {
    return request<ServiceLengthOption[]>('/service-length-options/service/' + serviceId)
  },
  createServiceLengthOption(
    token: string,
    body: { serviceId: string; label: string; priceMin: number; priceMax: number; sortOrder: number },
  ) {
    return request<{ option: ServiceLengthOption }>('/service-length-options', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  updateServiceLengthOption(token: string, id: string, body: Partial<ServiceLengthOption>) {
    return request<{ option: ServiceLengthOption }>('/service-length-options/' + id, {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    })
  },
  deleteServiceLengthOption(token: string, id: string) {
    return request<null>('/service-length-options/' + id, { method: 'DELETE', token })
  },
  businessInfo() {
    return request<BusinessInfo>('/business-info')
  },
  shopCategoryTiles() {
    return request<ShopCategoryTile[]>('/shop-category-tiles')
  },
  adminShopCategoryTiles(token: string) {
    return request<ShopCategoryTile[]>('/shop-category-tiles/admin', { token })
  },
  createShopCategoryTile(
    token: string,
    body: { title: string; label: string; copy: string; imageUrl: string; href: string; sortOrder: number },
  ) {
    return request<{ tile: ShopCategoryTile }>('/shop-category-tiles', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  updateShopCategoryTile(token: string, id: string, body: Partial<ShopCategoryTile>) {
    return request<{ tile: ShopCategoryTile }>('/shop-category-tiles/' + id, {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    })
  },
  deleteShopCategoryTile(token: string, id: string) {
    return request<null>('/shop-category-tiles/' + id, { method: 'DELETE', token })
  },
  heroSlides() {
    return request<HeroSlide[]>('/hero-slides')
  },
  adminHeroSlides(token: string) {
    return request<HeroSlide[]>('/hero-slides/admin', { token })
  },
  createHeroSlide(
    token: string,
    body: { eyebrow: string; title: string; subtitle: string; imageUrl: string; sortOrder: number },
  ) {
    return request<{ slide: HeroSlide }>('/hero-slides', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  updateHeroSlide(token: string, id: string, body: Partial<HeroSlide>) {
    return request<{ slide: HeroSlide }>(`/hero-slides/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    })
  },
  deleteHeroSlide(token: string, id: string) {
    return request<null>(`/hero-slides/${id}`, { method: 'DELETE', token })
  },
  reviews() {
    return request<Review[]>('/reviews')
  },
  adminReviews(token: string) {
    return request<Review[]>('/reviews/admin', { token })
  },
  myReviewableBookings(token: string) {
    return request<ReviewableBooking[]>('/reviews/mine', { token })
  },
  createReview(
    token: string,
    body: { bookingId?: string; rating: number; comment?: string; mediaUrl?: string | null; mediaType?: 'photo' | 'video' | null },
  ) {
    return request<{ review: Review }>('/reviews', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  myReview(token: string) {
    return request<{ review: Review | null }>('/reviews/my-review', { token })
  },
  updateReview(
    token: string,
    id: string,
    body: { rating: number; comment?: string; mediaUrl?: string | null; mediaType?: 'photo' | 'video' | null },
  ) {
    return request<{ review: Review }>(`/reviews/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    })
  },
  deleteReview(token: string, id: string) {
    return request<null>(`/reviews/${id}`, {
      method: 'DELETE',
      token,
    })
  },
  updateReviewStatus(token: string, id: string, status: 'approved' | 'rejected') {
    return request<{ review: Review }>(`/reviews/${id}/status`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ status }),
    })
  },
  async products() {
    const data = await request<
      Array<Omit<Product, 'price' | 'image'> & { price: number | string }>
    >('/products')
    return data.map(normalizeProduct)
  },
  async services() {
    const data = await request<
      Array<
        Omit<Service, 'durationMinutes' | 'priceMin' | 'priceMax'> & {
          durationMinutes: number | string
          priceMin: number | string
          priceMax: number | string
        }
      >
    >('/services')
    return data.map(normalizeService)
  },
  login(phone: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    })
  },
  register(name: string, phone: string, password: string, email?: string, area?: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password, email, area }),
    })
  },
  me(token: string) {
    return request<{ user: User }>('/auth/me', { token })
  },
  updateProfile(token: string, body: { name: string; phone: string }) {
    return request<{ user: User }>('/auth/me', {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    })
  },
  changePassword(
    token: string,
    body: { currentPassword: string; newPassword: string },
  ) {
    return request<{ message: string }>('/auth/password', {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    })
  },
  availability(serviceId: string, date: string) {
    const query = new URLSearchParams({ serviceId, date })
    return request<Availability>(`/bookings/availability?${query}`)
  },
  createBooking(
    token: string,
    body: { serviceId: string; date: string; timeSlot: string; referenceImageUrl?: string; lengthLabel?: string },
  ) {
    return request<{ booking: { id: string; status: string } }>('/bookings', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  createOrder(
    token: string,
    items: Array<{ productId: string; quantity: number }>,
    delivery: { name: string; phone: string; address: string; notes?: string },
  ) {
    return request<{
      order: { id: string; totalAmount: number; status: string }
    }>('/orders', {
      method: 'POST',
      token,
      body: JSON.stringify({ items, delivery }),
    })
  },
  initiatePayment(
    token: string,
    body: { type: 'booking' | 'order'; refId: string; momoNumber: string },
  ) {
    return request<{
      paymentReference: string
      amount: number
      status: string
      authorizationUrl: string
    }>('/payments/initiate', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  verifyPayment(token: string, reference: string) {
    return request<{ reference: string; status: string; amount?: number }>(
      `/payments/${reference}/verify`,
      { token },
    )
  },
  adminBookings(token: string) {
    return request<AdminBooking[]>('/bookings', { token })
  },
  updateBookingStatus(token: string, id: string, status: string) {
    return request<{ booking: AdminBooking }>(`/bookings/${id}/status`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ status }),
    })
  },
  rescheduleBooking(token: string, id: string, date: string, timeSlot: string) {
    return request<{ booking: AdminBooking }>(`/bookings/${id}/schedule`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ date, timeSlot }),
    })
  },
  adminOrders(token: string) {
    return request<AdminOrder[]>('/orders', { token })
  },
  updateOrderStatus(token: string, id: string, status: string) {
    return request<{ order: AdminOrder }>(`/orders/${id}/status`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ status }),
    })
  },
  categories() {
    return request<Array<{ id: string; name: string; dailyCap: number }>>(
      '/categories',
    )
  },
  createService(token: string, body: Omit<Service, 'id' | 'category'> & {
    categoryId: string
  }) {
    return request<{ service: Service }>('/services', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  updateService(token: string, id: string, body: Partial<Service> & {
    categoryId?: string
  }) {
    return request<{ service: Service }>(`/services/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    })
  },
  deleteService(token: string, id: string) {
    return request<null>(`/services/${id}`, { method: 'DELETE', token })
  },
  createProduct(token: string, body: Omit<Product, 'id' | 'image' | 'inStock'>) {
    return request<{ product: Product }>('/products', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  updateProduct(token: string, id: string, body: Partial<Product>) {
    return request<{ product: Product }>(`/products/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    })
  },
  deleteProduct(token: string, id: string) {
    return request<null>(`/products/${id}`, { method: 'DELETE', token })
  },
  adminCustomers(token: string) {
    return request<AdminCustomer[]>('/admin/customers', { token })
  },
  adminCustomer(token: string, id: string) {
    return request<AdminCustomer & {
      bookings: CustomerBooking[]
      orders: CustomerOrder[]
    }>(`/admin/customers/${id}`, { token })
  },
  adminPayments(token: string) {
    return request<AdminPayment[]>('/admin/payments', { token })
  },
  adminAnalytics(token: string) {
    return request<AdminAnalytics>('/admin/analytics', { token })
  },
  adminSettings(token: string) {
    return request<AdminSettings>('/admin/settings', { token })
  },
  updateAdminSettings(token: string, body: Partial<AdminSettings>) {
    return request<AdminSettings>('/admin/settings', {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    })
  },
  adminStaff(token: string) {
    return request<AdminStaff[]>('/admin/staff', { token })
  },
  createAdminStaff(
    token: string,
    body: { name: string; phone: string; password: string },
  ) {
    return request<{ staff: AdminStaff }>('/admin/staff', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  updateAdminStaffStatus(token: string, id: string, isActive: boolean) {
    return request<{ staff: AdminStaff }>(`/admin/staff/${id}/status`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ isActive }),
    })
  },
  myBookings(token: string) {
    return request<CustomerBooking[]>('/bookings/me', { token })
  },
  myOrders(token: string) {
    return request<CustomerOrder[]>('/orders/me', { token })
  },
}
