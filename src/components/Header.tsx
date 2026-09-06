import { useEffect, useRef, useState } from 'react'
import {
  FiCalendar,
  FiChevronDown,
  FiLogOut,
  FiPackage,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { useAppData } from '../context/appData'
import logoPink from '../assets/beryls-logo-pink.png'
import logoWhite from '../assets/beryls-logo-white.png'

type HeaderProps = {
  cartCount: number
  isHome: boolean
  onOpenCart: () => void
  onOpenAccount: () => void
}

const links = [
  ['Home', '#/'],
  ['Services', '#/services'],
  ['Shop', '#/shop'],
  ['Hair Extensions', '#/shop?category=Extensions'],
  ['Appointments', '#/appointments'],
  ['About', '#/about'],
]

export function Header({
  cartCount,
  isHome,
  onOpenCart,
  onOpenAccount,
}: HeaderProps) {
  const { products, services, user, logout } = useAppData()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [visible, setVisible] = useState(true)
  const [overHero, setOverHero] = useState(isHome)
  const lastScrollPosition = useRef(window.scrollY)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [profileOpen])

  useEffect(() => {
    const updateHeroState = () => {
      if (!isHome) {
        setOverHero(false)
        return
      }

      const hero = document.querySelector<HTMLElement>('[data-home-hero]')
      const headerHeight = window.innerWidth >= 640 ? 96 : 80
      setOverHero(Boolean(hero && hero.getBoundingClientRect().bottom > headerHeight))
    }

    const handleScroll = () => {
      const currentPosition = window.scrollY
      updateHeroState()
      const scrollDelta = currentPosition - lastScrollPosition.current

      if (Math.abs(scrollDelta) < 4) return

      if (menuOpen) {
        setVisible(true)
      } else if (
        currentPosition > lastScrollPosition.current &&
        currentPosition > 96
      ) {
        setVisible(false)
      } else if (currentPosition < lastScrollPosition.current) {
        setVisible(true)
      }

      lastScrollPosition.current = currentPosition
    }

    updateHeroState()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updateHeroState)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateHeroState)
    }
  }, [isHome, menuOpen])

  const blendsWithHero = isHome && overHero && !menuOpen && !searchOpen

  const iconClass = blendsWithHero
    ? 'border-white/50 text-white hover:border-white hover:bg-white/15'
    : 'border-[#e4bdce] text-[#604c55] hover:border-[#d92c83] hover:bg-[#f8e3ec] hover:text-[#d92c83]'

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const searchItems = [
    ...products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      kind: 'Product',
      href: `#/shop?search=${product.id}`,
    })),
    ...services.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category.name,
      description: service.description,
      kind: 'Service',
      href: `#/services?search=${service.id}`,
    })),
  ]
  const searchResults = normalizedQuery
    ? searchItems
        .filter((item) =>
          `${item.name} ${item.category} ${item.description}`
            .toLowerCase()
            .includes(normalizedQuery),
        )
        .slice(0, 6)
    : []

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transform-gpu border-b will-change-transform transition-[transform,opacity,background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      } ${
        blendsWithHero
          ? 'border-transparent bg-transparent'
          : 'border-[#ecd7e0] bg-[#fffaf8]/88 shadow-[0_8px_30px_rgba(71,35,51,0.06)] backdrop-blur-xl'
      }`}
    >
      {!blendsWithHero && (
        <div className="bg-[#dc2d83] py-2 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-white sm:text-[11px]">
          Premium Virgin Hair &bull; Nationwide Delivery &bull; Book Your Appointment Today
        </div>
      )}

      <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-5 sm:h-24 sm:px-8 lg:px-12">
        {/* LEFT: menu toggle */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open)
              setSearchOpen(false)
            }}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            className={`flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full transition ${
              blendsWithHero ? 'text-white' : 'text-[#8f3862]'
            }`}
          >
            <span className="h-0.5 w-6 rounded-full bg-current" />
            <span className="h-0.5 w-6 rounded-full bg-current" />
            <span className="h-0.5 w-6 rounded-full bg-current" />
          </button>
        </div>

        <a
          href="#/"
          className={`shrink-0 font-serif leading-none transition ${
            blendsWithHero ? 'text-white' : 'text-[#3e2530]'
          }`}
        >
          <span className="block text-[16px] font-semibold uppercase tracking-[0.2em] sm:text-[20px] sm:tracking-[0.24em]">
            Beryl&apos;s
          </span>
          <span
            className={`block text-[7px] font-bold uppercase tracking-[0.3em] sm:text-[9px] ${
              blendsWithHero ? 'text-[#f7b4d2]' : 'text-[#d92c83]'
            }`}
          >
            Beauty Mark
          </span>
        </a>

        {/* RIGHT: actions */}
        <div className="ml-auto flex items-center justify-end gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((open) => !open)
              setMenuOpen(false)
            }}
            aria-label={searchOpen ? 'Close search' : 'Search products and services'}
            aria-expanded={searchOpen}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${iconClass}`}
          >
            {searchOpen ? (
              <FiX aria-hidden="true" size={19} />
            ) : (
              <FiSearch aria-hidden="true" size={19} />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open shopping bag with ${cartCount} items`}
            title="Shopping bag"
            className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition ${iconClass}`}
          >
            <FiShoppingBag aria-hidden="true" size={20} strokeWidth={1.8} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d92c83] px-1 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </button>

          <a
            href="#/appointments"
            title="Book an appointment"
            className="hidden h-11 items-center justify-center rounded-full bg-[#d92c83] px-5 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#b92068] lg:flex"
          >
            Book
          </a>

          <div ref={profileMenuRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => {
                if (user) setProfileOpen((open) => !open)
                else onOpenAccount()
                setSearchOpen(false)
              }}
              aria-label={user ? `Open profile menu for ${user.name}` : 'Open account'}
              aria-expanded={user ? profileOpen : undefined}
              title={user ? user.name : 'Account'}
              className={`flex h-11 items-center justify-center gap-1 rounded-full border transition ${iconClass} ${
                user ? 'w-auto px-3' : 'w-11'
              }`}
            >
              {user && user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <FiUser aria-hidden="true" size={20} strokeWidth={1.8} />
              )}
              {user && <FiChevronDown aria-hidden="true" size={14} />}
            </button>

            {user && profileOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-72 overflow-hidden rounded-2xl border border-[#ead3dd] bg-[#fffaf8] text-[#604c55] shadow-[0_22px_60px_rgba(54,24,38,0.2)]">
                <div className="border-b border-[#eadbe1] bg-[#f8e7ee] px-5 py-4">
                  <p className="truncate font-serif text-xl text-[#3e2530]">
                    {user.name}
                  </p>
                  <p className="mt-1 text-xs text-[#826d76]">{user.phone}</p>
                  <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#b32368]">
                    {user.role}
                  </span>
                </div>
                <nav className="grid p-2" aria-label="Profile navigation">
                  <a
                    href="#/account"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#f8e7ee]"
                  >
                    <FiSettings aria-hidden="true" />
                    Account settings
                  </a>
                  <a
                    href="#/account?tab=bookings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#f8e7ee]"
                  >
                    <FiCalendar aria-hidden="true" />
                    My appointments
                  </a>
                  <a
                    href="#/account?tab=orders"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#f8e7ee]"
                  >
                    <FiPackage aria-hidden="true" />
                    My orders
                  </a>
                  {user.role === 'admin' && (
                    <a
                      href="#/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#f8e7ee]"
                    >
                      <FiSettings aria-hidden="true" />
                      Admin dashboard
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setProfileOpen(false)
                      window.location.hash = '#/'
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#a52261] hover:bg-[#f8e7ee]"
                  >
                    <FiLogOut aria-hidden="true" />
                    Sign out
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Main navigation"
          className="border-t border-[#ecd7e0] bg-[#fffaf8] px-5 py-5 shadow-[0_18px_45px_rgba(71,35,51,0.12)] sm:px-8 lg:px-12"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {links.map(function (item) {
                return (
                  <a
                    key={item[0]}
                    href={item[1]}
                    onClick={function () { setMenuOpen(false) }}
                    className="rounded-xl px-3 py-3 text-sm font-bold uppercase tracking-[0.1em] text-[#604c55] hover:bg-[#f8e3ec] hover:text-[#d92c83]"
                  >
                    {item[0]}
                  </a>
                )
              })}
            </div>

            <div className="mt-3 border-t border-[#ecd7e0] pt-3">
              {user ? (
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                  <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#a08a94] sm:col-span-2 lg:col-span-3">
                    {user.name}
                  </p>
                  <a
                    href="#/account"
                    onClick={function () { setMenuOpen(false) }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#604c55] hover:bg-[#f8e3ec]"
                  >
                    <FiSettings aria-hidden="true" />
                    Account settings
                  </a>
                  <a
                    href="#/account?tab=bookings"
                    onClick={function () { setMenuOpen(false) }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#604c55] hover:bg-[#f8e3ec]"
                  >
                    <FiCalendar aria-hidden="true" />
                    My appointments
                  </a>
                  <a
                    href="#/account?tab=orders"
                    onClick={function () { setMenuOpen(false) }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#604c55] hover:bg-[#f8e3ec]"
                  >
                    <FiPackage aria-hidden="true" />
                    My orders
                  </a>
                  {user.role === 'admin' && (
                    <a
                      href="#/dashboard"
                      onClick={function () { setMenuOpen(false) }}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#604c55] hover:bg-[#f8e3ec]"
                    >
                      <FiSettings aria-hidden="true" />
                      Admin dashboard
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={function () {
                      logout()
                      setMenuOpen(false)
                      window.location.hash = '#/'
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#a52261] hover:bg-[#f8e3ec]"
                  >
                    <FiLogOut aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={function () {
                    setMenuOpen(false)
                    onOpenAccount()
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-[#d92c83] px-3 py-3 text-sm font-bold text-white sm:w-auto sm:px-6"
                >
                  <FiUser aria-hidden="true" />
                  Sign in or create account
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {searchOpen && (
        <div className="border-t border-[#ecd7e0] bg-[#fffaf8]/98 px-5 py-5 shadow-[0_18px_45px_rgba(71,35,51,0.12)] backdrop-blur-xl sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <label htmlFor="site-search" className="sr-only">
              Search products and services
            </label>
            <div className="relative">
              <FiSearch
                aria-hidden="true"
                size={20}
                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#a46c84]"
              />
              <input
                id="site-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search wigs, braids, treatments..."
                autoFocus
                className="h-14 w-full rounded-full border border-[#e4bdce] bg-white pl-14 pr-5 text-sm text-[#3e2530] outline-none placeholder:text-[#9d8790] focus:border-[#d92c83] focus:ring-4 focus:ring-[#d92c83]/10"
              />
            </div>

            {normalizedQuery && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-[#ecd7e0] bg-white">
                {searchResults.length ? (
                  searchResults.map((item) => (
                    <a
                      key={`${item.kind}-${item.id}`}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-start justify-between gap-4 border-b border-[#f0dfe6] px-5 py-4 transition last:border-0 hover:bg-[#fff5f9]"
                    >
                      <span>
                        <span className="block font-serif text-lg text-[#3e2530]">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-xs text-[#806a73]">
                          {item.category}
                        </span>
                      </span>
                      <span className="mt-1 shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#d92c83]">
                        {item.kind}
                      </span>
                    </a>
                  ))
                ) : (
                  <p className="px-5 py-6 text-sm text-[#806a73]">
                    No products or services match that search.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}