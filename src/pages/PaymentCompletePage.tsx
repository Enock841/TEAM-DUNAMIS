import { useEffect, useRef, useState } from 'react'
import { useAppData } from '../context/appData'
import { api } from '../lib/api'

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms) })
}

export function PaymentCompletePage() {
  const { token, clearCart } = useAppData()
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking')
  const [amount, setAmount] = useState<number | null>(null)
  const [resumeBookingServiceId, setResumeBookingServiceId] = useState('')
  const hasRun = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1])
    const reference = params.get('reference') || params.get('trxref')
    if (!reference) {
      setStatus('failed')
      return
    }
    if (hasRun.current) return
    hasRun.current = true
    let cancelled = false

    async function run() {
      const attemptDelaysMs = [0, 2500, 4000, 5000]

      for (let i = 0; i < attemptDelaysMs.length; i++) {
        if (cancelled) return
        if (attemptDelaysMs[i] > 0) await wait(attemptDelaysMs[i])
        if (cancelled) return
        try {
          const result = await api.verifyPayment(token as string, reference as string)
          if (result.status === 'success') {
            if (result.amount) setAmount(result.amount)
            if (result.type === 'order') {
              clearCart()
              try {
                const raw = localStorage.getItem('paidExtensionOrder')
                if (raw) {
                  const parsed = JSON.parse(raw)
                  if (parsed && parsed.serviceId) setResumeBookingServiceId(parsed.serviceId)
                }
              } catch {
                // ignore a corrupted or missing marker
              }
            }
            setStatus('success')
            return
          }
        } catch {
          // keep retrying, Paystack may just need a moment
        }
      }

      if (!cancelled) setStatus('failed')
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [token])

  if (status === 'checking') {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-[#745f68]" role="status">
          Confirming your payment...
        </p>
      </main>
    )
  }
  if (status === 'success') {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d92c83]">
          Payment confirmed
        </p>
        <h1 className="mt-4 font-serif text-4xl text-[#3e2530]">Thank you</h1>
        <p className="mt-4 text-sm text-[#745f68]">
          {amount
            ? 'Your payment of GHC ' + amount.toLocaleString() + ' was successful.'
            : 'Your payment was successful.'}
        </p>
        <p className="mt-2 text-sm text-[#745f68]">
          Thank you for shopping with us, we are so excited for you to receive this! Keep an eye on your email, including your spam or junk folder just in case, we will keep you updated every step of the way, from approval to delivery.
        </p>
        {resumeBookingServiceId ? (
          <a
            href={'#/book?service=' + resumeBookingServiceId}
            className="mt-8 rounded-full bg-[#dc2d83] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white"
          >
            Continue your booking
          </a>
        ) : (
          <a
            href="#/account"
            className="mt-8 rounded-full bg-[#dc2d83] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white"
          >
            View my account
          </a>
        )}
      </main>
    )
  }
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d92c83]">
        Still confirming
      </p>
      <h1 className="mt-4 font-serif text-4xl text-[#3e2530]">Almost there</h1>
      <p className="mt-4 text-sm text-[#745f68]">
        This is taking a little longer than usual to confirm. If money left your account, it will show as paid in your account shortly, please check there in a moment.
      </p>
      <a
        href="#/account"
        className="mt-8 rounded-full border border-[#d92c83] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#d92c83]"
      >
        Go to my account
      </a>
    </main>
  )
}