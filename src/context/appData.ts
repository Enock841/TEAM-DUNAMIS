import { createContext, useContext } from 'react'
import type { Product, Service, User } from '../data/catalog'

export type AppDataContextValue = {
  products: Product[]
  services: Service[]
  catalogLoading: boolean
  catalogError: string
  user: User | null
  token: string | null
  authLoading: boolean
  wishlistIds: Set<string>
  toggleWishlist: (productId: string) => Promise<void>
  login: (phone: string, password: string) => Promise<User>
  register: (name: string, phone: string, password: string, email?: string, area?: string) => Promise<User>
  updateProfile: (name: string, phone: string, avatarUrl?: string) => Promise<User>
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<string>
  logout: () => void
  refreshCatalog: () => Promise<void>
  cart: Product[]
  addToCart: (product: Product) => void
  removeFromCart: (index: number) => void
  clearCart: () => void
}

export const AppDataContext = createContext<AppDataContextValue | null>(null)

export function useAppData() {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData must be used within AppDataProvider')
  return value
}
