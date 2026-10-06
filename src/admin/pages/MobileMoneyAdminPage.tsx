import { useCallback, useState } from 'react'
import { api, type AdminPayment } from '../../lib/api'
import { Notice, PageHeader } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

function money(value: number | string | null | undefined) {
  return `GHC${Number(value ?? 0).toLocaleString()}`
}

function typeLabel(type: string) {
  if (type === 'gift_card') return 'Gift card'
  if (type === 'booking') return 'Booking deposit'
  return 'Shop order'
}

export function MobileMoneyAdminPage() {
  const loader = useCallback((token: string) => api.adminPayments(token), [])
  const { data, loading, error, setError, reload, token } = useAdminResource(loader)
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')

  const rows = (data ?? [])
    .filter((payment) => payment.method === 'manual_momo')
    .sort((a, b) => {
      const aWaiting = a.status === 'awaiting_confirmation' ? 0 : 1
      const bWaiting = b.status === 'awaiting_confirmation' ? 0 : 1
      if (aWaiting !== bWaiting) return aWaiting - bWaiting
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  const waiting = rows.filter((payment) => payment.status === 'awaiting_confirmation').length

  async function confirm(payment: AdminPayment) {
    if (!token) return
    const ok = window.confirm(
      `Have you seen ${money(payment.claimedAmount ?? payment.amount)} from ${payment.payerName || 'this client'} arrive in your Mobile Money? Confirming marks their order or booking as paid.`,
    )
    if (!ok) return
    setBusyId(payment.id)
    setMessage('')
    try {
      await api.adminConfirmManualPayment(token, payment.reference)
      setMessage('Payment confirmed. The client has been marked as paid.')
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to confirm this payment.')
    } finally {
      setBusyId('')
    }
  }

  async function reject(payment: AdminPayment) {
    if (!token) return
    const reason = window.prompt(
      'Optional note to the client (for example: "I did not receive this amount"). Leave blank to skip, or press Cancel to stop.',
      '',
    )
    if (reason === null) return
    setBusyId(payment.id)
    setMessage('')
    try {
      await api.adminRejectManualPayment(token, payment.reference, reason.trim() || undefined)
      setMessage('Payment rejected. The client has been told.')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reject this payment.')
    } finally {
      setBusyId('')
    }
  }

  async function remove(payment: AdminPayment) {
    if (!token) return
    const extra =
      payment.status === 'success'
        ? ' This payment was confirmed, so deleting it will also lower your revenue totals.'
        : ''
    const ok = window.confirm(`Delete this Mobile Money record? This cannot be undone.${extra}`)
    if (!ok) return
    setBusyId(payment.id)
    try {
      await api.adminDeletePayment(token, payment.id)
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete this record.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Mobile Money"
        title="Mobile Money payments"
        description="Clients who paid you directly by Mobile Money appear here with their screenshot. Check your phone, then confirm or reject."
      />
      {loading && <div className="mt-8"><Notice>Loading Mobile Money payments...</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      {message && <div className="mt-8"><Notice>{message}</Notice></div>}
      {!loading && (
        <p className="mt-6 text-sm font-semibold text-[#3e2530]">
          {waiting > 0
            ? `${waiting} payment${waiting === 1 ? '' : 's'} waiting for your confirmation`
            : 'Nothing is waiting for your confirmation.'}
        </p>
      )}
      <div className="mt-4 grid gap-4">
        {rows.map((payment) => {
          const isWaiting = payment.status === 'awaiting_confirmation'
          const mismatch =
            payment.claimedAmount != null && Number(payment.claimedAmount) !== Number(payment.amount)
          return (
            <div key={payment.id} className="grid gap-4 rounded-2xl border border-[#ead7df] bg-white p-4 sm:grid-cols-[140px_1fr]">
              {payment.proofImageUrl ? (
                <a href={payment.proofImageUrl} target="_blank" rel="noreferrer" aria-label="Open screenshot in a new tab">
                  <img src={payment.proofImageUrl} alt="Payment screenshot" className="h-40 w-full rounded-xl object-cover sm:w-[140px]" />
                </a>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl bg-[#fbf4f7] text-xs text-[#806b74]">No screenshot</div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-base text-[#3e2530]">{payment.payerName || 'Unknown name'}</strong>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isWaiting
                        ? 'bg-amber-100 text-amber-800'
                        : payment.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isWaiting ? 'Waiting' : payment.status === 'success' ? 'Confirmed' : 'Rejected'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#5d4650]">
                  {typeLabel(payment.paymentType)} for {payment.customer?.name ?? 'a guest'}
                  {payment.customer?.phone ? `, ${payment.customer.phone}` : ''}
                </p>
                <p className="mt-1 text-sm text-[#5d4650]">
                  Client says they sent <strong>{money(payment.claimedAmount ?? payment.amount)}</strong>. Amount due: <strong>{money(payment.amount)}</strong>.
                </p>
                {mismatch && (
                  <p className="mt-1 text-xs font-bold text-red-600">The amount they typed is different from the amount due. Check your phone carefully.</p>
                )}
                <p className="mt-1 text-xs text-[#8f707d]">{new Date(payment.createdAt).toLocaleString()}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {isWaiting && (
                    <>
                      <button
                        type="button"
                        onClick={() => confirm(payment)}
                        disabled={busyId === payment.id}
                        className="rounded-xl bg-[#d92c83] px-5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(payment)}
                        disabled={busyId === payment.id}
                        className="rounded-xl border border-[#dc2d83] px-5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#dc2d83] disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(payment)}
                    disabled={busyId === payment.id}
                    className="text-xs font-bold uppercase tracking-[0.08em] text-red-600 underline disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {!loading && rows.length === 0 && (
          <p className="rounded-2xl border border-[#ead7df] bg-white p-6 text-sm text-[#806b74]">No Mobile Money payments yet.</p>
        )}
      </div>
    </>
  )
}