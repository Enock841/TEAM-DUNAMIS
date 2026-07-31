import { useEffect, type ReactNode } from 'react'
import { useAppData } from '../context/appData'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { authLoading, token, user } = useAppData()
  const isAdmin = Boolean(token && user?.role === 'admin')

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.hash = '#/staff-login'
    }
  }, [authLoading, isAdmin])

  if (authLoading) {
    return (
      <main className="flex min-h-[620px] items-center justify-center bg-[#fffdfd] px-6">
        <p className="text-sm text-[#5f5157]" role="status">
          Verifying staff access…
        </p>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-[620px] items-center justify-center bg-[#fffdfd] px-6">
        <p className="text-sm text-[#5f5157]" role="status">
          Redirecting to secure staff login…
        </p>
      </main>
    )
  }

  return children
}
