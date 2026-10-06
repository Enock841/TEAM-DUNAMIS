import { useEffect, useState, type ReactNode } from 'react'
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { useAppData } from '../../context/appData'
import { api } from '../../lib/api'
import { adminNavigation, currentAdminSection } from '../adminNavigation'

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout, token } = useAppData()
  const [open, setOpen] = useState(false)
  const active = currentAdminSection()
  const [waiting, setWaiting] = useState(0)

  useEffect(() => {
    if (!token) return
    let current = true
    function check() {
      api
        .adminPayments(token as string)
        .then((payments) => {
          if (current) setWaiting(payments.filter((payment) => payment.status === 'awaiting_confirmation').length)
        })
        .catch(() => {})
    }
    check()
    const timer = window.setInterval(check, 60000)
    return () => {
      current = false
      window.clearInterval(timer)
    }
  }, [token, active])

  function signOut() {
    logout()
    window.location.hash = '#/'
  }

  return (
    <div className="min-h-screen bg-[#f8f3f5] lg:grid lg:grid-cols-[270px_1fr]">
      <header className="sticky top-0 z-40 flex h-18 items-center justify-between border-b border-[#ead7df] bg-[#fffaf8] px-5 lg:hidden">
        <a href="#/dashboard" className="font-serif text-xl text-[#3e2530]">
          Beryl&apos;s Admin
        </a>
        <button
          type="button"
          aria-label="Toggle admin navigation"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfcbd4]"
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </header>

      <aside
        className={`${open ? 'fixed inset-x-0 top-18 z-30 flex' : 'hidden'} bottom-0 flex-col bg-[#3e2130] p-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:p-6`}
      >
        <a href="#/" className="font-serif text-2xl tracking-[0.08em]">
          BERYL&apos;S
          <span className="mt-1 block text-[9px] font-bold tracking-[0.28em] text-[#f2a7c9]">
            BEAUTY MARK · ADMIN
          </span>
        </a>
        <nav className="mt-9 grid gap-1 overflow-y-auto" aria-label="Admin navigation">
          {adminNavigation.map(([id, label, Icon]) => (
            <a
              key={id}
              href={id === 'overview' ? '#/dashboard' : `#/dashboard/${id}`}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                active === id
                  ? 'bg-[#d92c83] text-white'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
              {id === 'mobile-money' && waiting > 0 && (
                <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-[#3e2130]">{waiting}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-5">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="mt-1 text-xs text-white/50">{user?.phone}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#f2a7c9]"
          >
            <FiLogOut /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-14">
        <div className="mx-auto max-w-[1500px]">{children}</div>
      </main>
    </div>
  )
}
