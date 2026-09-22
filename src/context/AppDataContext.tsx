import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Product, Service, User } from '../data/catalog'
import { api } from '../lib/api'
import { AppDataContext } from './appData'

const tokenStorageKey = 'beryl-auth-token'
const userStorageKey = 'beryl-auth-user'
const cartStorageKey = 'beryl-cart'

function storedUser() {
  try {
    const value = sessionStorage.getItem(userStorageKey)
    return value ? (JSON.parse(value) as User) : null
  } catch {
    return null
  }
}

function storedCart(): Product[] {
  try {
    const value = localStorage.getItem(cartStorageKey)
    return value ? (JSON.parse(value) as Product[]) : []
  } catch {
    return []
  }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(tokenStorageKey),
  )
  const [user, setUser] = useState<User | null>(storedUser)
  const [authLoading, setAuthLoading] = useState(() => Boolean(token))
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [cart, setCart] = useState<Product[]>(storedCart)

  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart))
    } catch {
      // ignore storage errors
    }
  }, [cart])

  function addToCart(product: Product) {
    setCart((items) => [...items, product])
  }

  function removeFromCart(index: number) {
    setCart((items) => items.filter((_, itemIndex) => itemIndex !== index))
  }

  function clearCart() {
    setCart([])
  }

  async function refreshCatalog() {
    setCatalogLoading(true)
    setCatalogError('')
    try {
      const [nextProducts, nextServices] = await Promise.all([
        api.products(),
        api.services(),
      ])
      setProducts(nextProducts)
      setServices(nextServices)
    } catch (error) {
      setCatalogError(
        error instanceof Error
          ? error.message
          : 'The salon catalogue is temporarily unavailable.',
      )
    } finally {
      setCatalogLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([api.products(), api.services()])
      .then(([nextProducts, nextServices]) => {
        setProducts(nextProducts)
        setServices(nextServices)
      })
      .catch((error: unknown) => {
        setCatalogError(
          error instanceof Error
            ? error.message
            : 'The salon catalogue is temporarily unavailable.',
        )
      })
      .finally(() => setCatalogLoading(false))
  }, [])

  useEffect(() => {
    if (!token) return
    api
      .me(token)
      .then(({ user: verifiedUser }) => {
        sessionStorage.setItem(userStorageKey, JSON.stringify(verifiedUser))
        setUser(verifiedUser)
      })
      .catch(() => {
        sessionStorage.removeItem(tokenStorageKey)
        sessionStorage.removeItem(userStorageKey)
        setToken(null)
        setUser(null)
      })
      .finally(() => setAuthLoading(false))
  }, [token])

  useEffect(() => {
    if (!token) {
      setWishlistIds(new Set())
      return
    }
    api
      .wishlistIds(token)
      .then((ids) => setWishlistIds(new Set(ids)))
      .catch(() => setWishlistIds(new Set()))
  }, [token])

  async function toggleWishlist(productId: string) {
    if (!token) throw new Error('Sign in to save items to your wishlist.')
    const isSaved = wishlistIds.has(productId)
    if (isSaved) {
      await api.removeFromWishlist(token, productId)
      setWishlistIds((current) => {
        const next = new Set(current)
        next.delete(productId)
        return next
      })
    } else {
      await api.addToWishlist(token, productId)
      setWishlistIds((current) => new Set(current).add(productId))
    }
  }

  function saveSession(nextUser: User, nextToken: string) {
    sessionStorage.setItem(tokenStorageKey, nextToken)
    sessionStorage.setItem(userStorageKey, JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }

  async function login(phone: string, password: string) {
    const result = await api.login(phone, password)
    saveSession(result.user, result.token)
    return result.user
  }

  async function register(name: string, phone: string, password: string, email?: string, area?: string) {
    const result = await api.register(name, phone, password, email, area)
    saveSession(result.user, result.token)
    return result.user
  }

  async function updateProfile(name: string, phone: string, avatarUrl?: string) {
    if (!token) throw new Error('Sign in to update your profile.')
    const result = await api.updateProfile(token, { name, phone, avatarUrl })
    sessionStorage.setItem(userStorageKey, JSON.stringify(result.user))
    setUser(result.user)
    return result.user
  }

  async function changePassword(
    currentPassword: string,
    newPassword: string,
  ) {
    if (!token) throw new Error('Sign in to change your password.')
    const result = await api.changePassword(token, {
      currentPassword,
      newPassword,
    })
    return result.message
  }

  function logout() {
    sessionStorage.removeItem(tokenStorageKey)
    sessionStorage.removeItem(userStorageKey)
    setToken(null)
    setUser(null)
  }

  const value = {
    products,
    services,
    catalogLoading,
    catalogError,
    user,
    token,
    authLoading,
    wishlistIds,
    toggleWishlist,
    login,
    register,
    updateProfile,
    changePassword,
    logout,
    refreshCatalog,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
  }

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  )
}