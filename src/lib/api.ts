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
  bookedTimeSlots?: string[]
}

export type AdminBooking = {
  id: string
  date: string
  timeSlot: string
  status: string
  user: Pick<User, 'id' | 'name' | 'phone'>
  service: { id: string; name: string }
  category: { id: string; name: string }
  customLengthRequest?: string
  customLengthPrice?: number
  customLengthStatus?: string
  referenceImageUrl?: string
  lengthLabel?: string
  notes?: string
  confirmedPrice?: number
  amountPaid?: number
  extensionProductName?: string
  extensionQuantity?: number
  extensionProductPrice?: number
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
  aboutImageUrl?: string
  updatedAt?: string
}

export type WishlistItem = {
  id: string
  name: string
  description: string
  price: number
  stockQty: number
  category: string
  images: string[]
  addedAt: string
}

export type ProductVariant = {
  id: string
  productId: string
  label: string
  price: number
  stockQty: number
  imageUrl?: string
  sortOrder: number
  isActive?: boolean
  option1Name?: string
  option1Value?: string
  option2Name?: string
  option2Value?: string
}

export type GiftCard = {
  id: string
  code: string
  amount: number
  balance: number
  status: string
}

export type AdminStaff = {
  id: string
  name: string
  phone: string
  email?: string
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
  confirmationCode?: string
  customLengthRequest?: string
  customLengthPrice?: number
  customLengthStatus?: string
  isPaid?: boolean
  confirmedPrice?: number
  amountPaid?: number
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
    let message = payload?.error ?? 'Unable to complete your request'
    const fieldErrors = payload?.details?.fieldErrors
    if (fieldErrors) {
      const firstField = Object.keys(fieldErrors).find((key) => fieldErrors[key]?.length)
      if (firstField) message = fieldErrors[firstField][0]
    }
    throw new ApiError(response.status, message)
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
  customerName: string
  serviceName: string
}

export type ReviewableBooking = {
  bookingId: string
  serviceName: string
  date: string
}

export type ReviewableOrder = {
  orderId: string
  productNames: string
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
  aboutImageUrl?: string
}

export type ServiceLengthOption = {
  id: string
  serviceId: string
  label: string
  priceMin: number
  priceMax: number
  sortOrder: number
  imageUrl?: string
}

export const api = {
  monthAvailability(serviceId: string, year: number, month: number) {
    const query = new URLSearchParams({ serviceId, year: String(year), month: String(month) })
    return request<{ dailyCap: number; bookedByDate: Record<string, number> }>(
      '/bookings/month-availability?' + query,
    )
  },
  approveCustomLength(token: string, bookingId: string, price: number) {
    return request<{ booking: unknown }>('/bookings/' + bookingId + '/approve-custom-length', {
      method: 'PUT',
      token,
      body: JSON.stringify({ price }),
    })
  },
  serviceLengthOptions(serviceId: string) {
    return request<ServiceLengthOption[]>('/service-length-options/service/' + serviceId)
  },
  createServiceLengthOption(
    token: string,
    body: { serviceId: string; label: string; priceMin: number; priceMax: number; sortOrder: number; imageUrl?: string },
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
  myReviewable(token: string) {
    return request<{ bookings: ReviewableBooking[]; orders: ReviewableOrder[] }>('/reviews/mine', { token })
  },
  myReviewableBookings(token: string) {
    return request<ReviewableBooking[]>('/reviews/mine', { token })
  },
  createReview(
    token: string,
    body: { bookingId?: string; orderId?: string; rating: number; comment?: string; mediaUrl?: string; mediaType?: 'photo' | 'video' },
  ) {
    return request<{ review: Review }>('/reviews', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
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
  updateProfile(token: string, body: { name: string; phone: string; avatarUrl?: string }) {
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
    body: { serviceId: string; date: string; timeSlot: string; referenceImageUrl?: string; lengthLabel?: string; customLengthRequest?: string; notes?: string; contactEmail?: string; extensionProductId?: string; extensionProductName?: string; extensionQuantity?: number; extensionProductPrice?: number },
  ) {
    return request<{ booking: { id: string; status: string; confirmationCode: string } }>('/bookings', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  verifyBookingCode(token: string, code: string) {
    return request<{
      booking: {
        id: string
        date: string
        timeSlot: string
        status: string
        confirmationCode: string
        customerName: string
        customerPhone: string
        serviceName: string
      }
    }>('/bookings/verify-code', {
      method: 'POST',
      token,
      body: JSON.stringify({ code }),
    })
  },
  createOrder(
    token: string | undefined,
    items: Array<{ productId: string; quantity: number; variantId?: string }>,
    delivery: { name: string; phone: string; address: string; notes?: string; email?: string },
    giftCardCode?: string,
  ) {
    return request<{
      order: { id: string; totalAmount: number; status: string; giftCardCode?: string; giftCardDiscount?: number }
    }>('/orders', {
      method: 'POST',
      token,
      body: JSON.stringify({ items, delivery, giftCardCode }),
    })
  },
  initiatePayment(
    token: string | undefined,
    body: { type: 'booking' | 'order' | 'gift_card'; refId: string; momoNumber: string },
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
  verifyPayment(token: string | undefined, reference: string) {
    return request<{ reference: string; status: string; amount?: number }>(
      `/payments/${reference}/verify`,
      { token },
    )
  },
  adminBookings(token: string) {
    return request<AdminBooking[]>('/bookings', { token })
  },
  settleBookingBalance(token: string, id: string) {
    return request<{ booking: unknown }>('/payments/bookings/' + id + '/settle-balance', {
      method: 'PUT',
      token,
    })
  },
  updateBookingStatus(token: string, id: string, status: string, price?: number) {
    return request<{ booking: AdminBooking }>(`/bookings/${id}/status`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ status, price }),
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
  wishlist(token: string) {
    return request<WishlistItem[]>('/wishlist', { token })
  },
  wishlistIds(token: string) {
    return request<string[]>('/wishlist/ids', { token })
  },
  addToWishlist(token: string, productId: string) {
    return request<{ ok: boolean }>('/wishlist', {
      method: 'POST',
      token,
      body: JSON.stringify({ productId }),
    })
  },
  removeFromWishlist(token: string, productId: string) {
    return request<null>('/wishlist/' + productId, { method: 'DELETE', token })
  },
  productVariants(productId: string) {
    return request<ProductVariant[]>('/product-variants/' + productId)
  },
  adminProductVariants(token: string, productId: string) {
    return request<ProductVariant[]>('/product-variants/' + productId + '/admin', { token })
  },
  createProductVariant(
    token: string,
    body: {
      productId: string
      label?: string
      price: number
      stockQty: number
      imageUrl?: string
      sortOrder?: number
      option1Name?: string
      option1Value?: string
      option2Name?: string
      option2Value?: string
    },
  ) {
    return request<{ variant: ProductVariant }>('/product-variants', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  updateProductVariant(token: string, id: string, body: Partial<ProductVariant>) {
    return request<{ variant: ProductVariant }>('/product-variants/' + id, {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    })
  },
  deleteProductVariant(token: string, id: string) {
    return request<null>('/product-variants/' + id, { method: 'DELETE', token })
  },
  purchaseGiftCard(
    token: string,
    body: { amount: number; purchaserName: string; purchaserEmail: string; recipientName?: string; recipientEmail?: string; message?: string },
  ) {
    return request<{ giftCard: GiftCard }>('/gift-cards', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    })
  },
  checkGiftCard(code: string) {
    return request<{ giftCard: GiftCard }>('/gift-cards/' + code)
  },
  categories() {
    return request<Array<{ id: string; name: string; dailyCap: number; imageUrl: string }>>(
      '/categories',
    )
  },
  updateCategory(
    token: string,
    id: string,
    body: { dailyCap?: number; imageUrl?: string },
  ) {
    return request<{ category: { id: string; name: string; dailyCap: number; imageUrl: string } }>(
      '/categories/' + id,
      {
        method: 'PUT',
        token,
        body: JSON.stringify(body),
      },
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
    body: { name: string; phone: string; email: string; password: string },
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