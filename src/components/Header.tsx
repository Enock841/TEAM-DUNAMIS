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
  ['Appointments', '#/appointments'],
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
  const [, setOverHero] = useState(isHome)
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

  const blendsWithHero = false
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
      className={`fixed inset-x-0 top-0 z-40 transform-gpu border-b border-[#d8c5ce] bg-[#fffdfd]/96 will-change-transform transition-[transform,opacity,background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      } shadow-[0_6px_24px_rgba(29,23,26,0.05)] backdrop-blur-xl`}
    >
      <div className="flex h-8 items-center justify-between bg-[#c992aa] px-5 text-[8px] font-bold uppercase tracking-[0.22em] text-[#44343b] sm:px-8 lg:px-12">
        <span className="hidden sm:inline">Kumasi, Ghana</span>
        <span>Welcome to Beryl&apos;s Beauty Mark</span>
        <a href="#/appointments" className="hidden border-b border-current sm:inline">
          Book an appointment
        </a>
      </div>
      <div className="mx-auto flex h-[74px] max-w-[1480px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
        <a
          href="#/"
          className="shrink-0 font-serif leading-none text-[#1d171a] transition-colors duration-300 lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
          <span className="block text-[25px] font-medium uppercase tracking-[0.1em]">
            Beryl&apos;s
          </span>
          <span
            className="mt-0.5 block text-center text-[7px] font-bold uppercase tracking-[0.44em] text-[#984667]"
          >
            Beauty Mark
          </span>
        </a>

        <nav aria-label="Primary navigation" className="hidden items-center gap-6 lg:flex">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#342a2f] transition duration-300 hover:text-[#984667]"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((open) => !open)
              setMenuOpen(false)
            }}
            aria-label={searchOpen ? 'Close search' : 'Search products and services'}
            aria-expanded={searchOpen}
            className={`flex h-9 items-center justify-center gap-2 rounded-full border px-2.5 transition duration-300 xl:min-w-32 xl:justify-start xl:px-3 ${
              blendsWithHero
                ? 'border-white/25 bg-white/5 text-[#eee3e7] hover:border-white/50 hover:bg-white/10'
                : 'border-[#cdb8c1] bg-white/65 text-[#5f5157] hover:border-[#984667] hover:text-[#984667]'
            }`}
          >
            {searchOpen ? (
              <FiX aria-hidden="true" size={19} />
            ) : (
              <FiSearch aria-hidden="true" size={19} />
            )}
            <span className="hidden truncate text-[11px] font-semibold uppercase tracking-[0.1em] xl:inline">
              Search
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open shopping bag with ${cartCount} items`}
            title="Shopping bag"
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition duration-300 ${
              blendsWithHero
                ? 'border-white/25 bg-white/5 text-[#eee3e7] hover:border-white/50 hover:bg-white/10'
                : 'border-[#cdb8c1] text-[#5f5157] hover:border-[#984667] hover:bg-[#f8e3ec] hover:text-[#984667]'
            }`}
          >
            <FiShoppingBag aria-hidden="true" size={20} strokeWidth={1.8} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#984667] px-1 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </button>
          <a
            href="#/appointments"
            title="Book an appointment"
            className="hidden h-9 items-center justify-center rounded-full border border-[#1d171a] bg-[#1d171a] px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#984667] md:flex"
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
              className={`flex h-9 items-center justify-center gap-1 rounded-full border transition duration-300 ${
                user ? 'w-auto px-3' : 'w-11'
              } ${
                blendsWithHero
                  ? 'border-white/25 bg-white/5 text-[#eee3e7] hover:border-white/50 hover:bg-white/10'
                  : 'border-[#cdb8c1] text-[#5f5157] hover:border-[#984667] hover:bg-[#f8e3ec] hover:text-[#984667]'
              }`}
            >
              <FiUser aria-hidden="true" size={20} strokeWidth={1.8} />
              {user && <FiChevronDown aria-hidden="true" size={14} />}
            </button>

            {user && profileOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-72 overflow-hidden rounded-2xl border border-[#ead3dd] bg-[#fffdfd] text-[#5f5157] shadow-[0_22px_60px_rgba(54,24,38,0.2)]">
                <div className="border-b border-[#d9c7cf] bg-[#f3e3ea] px-5 py-4">
                  <p className="truncate font-serif text-xl text-[#1d171a]">
                    {user.name}
                  </p>
                  <p className="mt-1 text-xs text-[#826d76]">{user.phone}</p>
                  <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#984667]">
                    {user.role}
                  </span>
                </div>
                <nav className="grid p-2" aria-label="Profile navigation">
                  <a
                    href="#/account"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#f3e3ea]"
                  >
                    <FiSettings aria-hidden="true" />
                    Account settings
                  </a>
                  <a
                    href="#/account?tab=bookings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#f3e3ea]"
                  >
                    <FiCalendar aria-hidden="true" />
                    My appointments
                  </a>
                  <a
                    href="#/account?tab=orders"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#f3e3ea]"
                  >
                    <FiPackage aria-hidden="true" />
                    My orders
                  </a>
                  {user.role === 'admin' && (
                    <a
                      href="#/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#f3e3ea]"
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
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#984667] hover:bg-[#f3e3ea]"
                  >
                    <FiLogOut aria-hidden="true" />
                    Sign out
                  </button>
                </nav>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open)
              setSearchOpen(false)
            }}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            className={`flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full transition-colors duration-300 lg:hidden ${
              blendsWithHero ? 'text-[#eee3e7]' : 'text-[#8f3862]'
            }`}
          >
            <span className="h-px w-5 bg-current" />
            <span className="h-px w-5 bg-current" />
            <span className="h-px w-5 bg-current" />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-[#d9c7cf] bg-[#fffdfd]/98 px-5 py-5 shadow-[0_18px_45px_rgba(71,35,51,0.12)] backdrop-blur-xl sm:px-8 lg:px-12">
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
                className="h-14 w-full rounded-full border border-[#cdb8c1] bg-white pl-13 pr-5 text-sm text-[#1d171a] outline-none placeholder:text-[#9d8790] focus:border-[#984667] focus:ring-4 focus:ring-[#984667]/10"
              />
            </div>

            {normalizedQuery && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-[#d9c7cf] bg-white">
                {searchResults.length ? (
                  searchResults.map((item) => (
                    <a
                      key={`${item.kind}-${item.id}`}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-start justify-between gap-4 border-b border-[#f0dfe6] px-5 py-4 transition last:border-0 hover:bg-[#fff5f9]"
                    >
                      <span>
                        <span className="block font-serif text-lg text-[#1d171a]">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-xs text-[#806a73]">
                          {item.category}
                        </span>
                      </span>
                      <span className="mt-1 shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#984667]">
                        {item.kind}
                      </span>
                    </a>
                  ))
                ) : (
                  <p className="px-5 py-6 text-sm text-[#806a73]">
                    No products or services match “{searchQuery}”.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="border-t border-[#d9c7cf] bg-[#fffdfd] px-5 py-6 lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1">
            {links.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 font-serif text-xl text-[#1d171a] transition hover:bg-[#f8e3ec]"
              >
                {label}
              </a>
            ))}
            {user ? (
              <>
                <a
                  href="#/account"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 font-serif text-xl text-[#1d171a] transition hover:bg-[#f8e3ec] sm:hidden"
                >
                  My account
                </a>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                  }}
                  className="rounded-xl px-4 py-3 text-left font-serif text-xl text-[#984667] transition hover:bg-[#f8e3ec] sm:hidden"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onOpenAccount()
                  setMenuOpen(false)
                }}
                className="rounded-xl px-4 py-3 text-left font-serif text-xl text-[#1d171a] transition hover:bg-[#f8e3ec] sm:hidden"
              >
                Account
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
