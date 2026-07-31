import { useEffect, useState } from 'react'
import { useAppData } from '../context/appData'
import { api } from '../lib/api'

export function PaymentVerifier() {
  const { token } = useAppData()
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference') || params.get('trxref')
    if (!reference) return

    let cancelled = false
    async function run() {
      try {
        const result = await api.verifyPayment(token as string, reference as string)
        if (cancelled) return
        setNotice(
          result.status === 'success'
            ? 'Payment confirmed, thank you.'
            : 'We could not confirm that payment. If money left your account, please contact the salon.',
        )
      } catch {
        if (!cancelled) {
          setNotice('We could not confirm that payment. If money left your account, please contact the salon.')
        }
      } finally {
        const cleanUrl = window.location.pathname + window.location.hash
        window.history.replaceState({}, '', cleanUrl)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [token])

  if (!notice) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[100] bg-[#1d171a] px-4 py-3 text-center text-sm text-white">
      {notice}
      <button
        type="button"
        onClick={() => setNotice(null)}
        className="ml-4 underline"
      >
        Dismiss
      </button>
    </div>
  )
}