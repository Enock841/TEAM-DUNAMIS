import { useState, type ReactNode } from 'react'
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { useAppData } from '../../context/appData'
import { adminNavigation, currentAdminSection } from '../adminNavigation'

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAppData()
  const [open, setOpen] = useState(false)
  const active = currentAdminSection()

  function signOut() {
    logout()
    window.location.hash = '#/'
  }

  return (
    <div className="min-h-screen bg-[#f4e7ec] lg:grid lg:grid-cols-[248px_1fr]">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#bfaab3] bg-[#fffdfd] px-5 lg:hidden">
        <a href="#/dashboard" className="font-serif text-2xl font-medium uppercase tracking-[0.08em] text-[#1d171a]">
          Beryl&apos;s <span className="text-[#984667]">Admin</span>
        </a>
        <button
          type="button"
          aria-label="Toggle admin navigation"
          aria-expanded={open}
          aria-controls="admin-navigation-panel"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cdb8c1]"
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </header>

      <aside
        id="admin-navigation-panel"
        className={`${open ? 'fixed inset-x-0 top-16 z-30 flex' : 'hidden'} bottom-0 flex-col border-r border-[#8f6175] bg-[#1d171a] p-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:p-5`}
      >
        <a href="#/" className="border-b border-white/15 pb-5 font-serif text-3xl font-medium uppercase tracking-[0.08em]">
          BERYL&apos;S
          <span className="mt-1 block text-[9px] font-bold tracking-[0.28em] text-[#d9abbf]">
            BEAUTY MARK · ADMIN
          </span>
        </a>
        <nav className="mt-5 grid gap-0.5 overflow-y-auto" aria-label="Admin navigation">
          {adminNavigation.map(([id, label, Icon]) => (
            <a
              key={id}
              href={id === 'overview' ? '#/dashboard' : `#/dashboard/${id}`}
              onClick={() => setOpen(false)}
              aria-current={active === id ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 border-l-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                active === id
                  ? 'border-[#d9abbf] bg-[#c992aa]/20 text-white'
                  : 'border-transparent text-white/60 hover:border-white/30 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </a>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-5">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="mt-1 text-xs text-white/50">{user?.phone}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#d9abbf]"
          >
            <FiLogOut /> Sign out
          </button>
        </div>
      </aside>

      <main className="campaign-grid min-w-0 px-5 py-8 sm:px-8 lg:px-9 lg:py-9 xl:px-12">
        <div className="mx-auto max-w-[1540px]">{children}</div>
      </main>
    </div>
  )
}
