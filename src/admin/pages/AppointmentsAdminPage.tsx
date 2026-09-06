import { useCallback, useState } from 'react'
import { api, type AdminBooking } from '../../lib/api'
import { fieldClass, Notice, PageHeader, Panel, PrimaryButton } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

const statusStyle: Record<string, string> = {
  pending: 'bg-[#fbe7d0] text-[#8a5a1f]',
  confirmed: 'bg-[#dcefe3] text-[#2f7d55]',
  completed: 'bg-[#e4e1f0] text-[#5a4e8a]',
  cancelled: 'bg-[#f3ecee] text-[#8f7480]',
}

export function AppointmentsAdminPage() {
  const loader = useCallback((token: string) => api.adminBookings(token), [])
  const { data = [], loading, error, setError, reload, token } = useAdminResource(loader)
  const [drafts, setDrafts] = useState<Record<string, { date: string; time: string }>>({})
  const [showReschedule, setShowReschedule] = useState<Record<string, boolean>>({})

  const [codeInput, setCodeInput] = useState('')
  const [codeResult, setCodeResult] = useState<any>(null)
  const [codeError, setCodeError] = useState('')
  const [codeChecking, setCodeChecking] = useState(false)
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({})
  const [approvingId, setApprovingId] = useState('')
  const [approvalPriceDrafts, setApprovalPriceDrafts] = useState<Record<string, string>>({})

  async function checkCode() {
    if (!token || !codeInput.trim()) return
    setCodeChecking(true)
    setCodeError('')
    setCodeResult(null)
    try {
      const result = await api.verifyBookingCode(token, codeInput.trim())
      setCodeResult(result.booking)
    } catch (reason) {
      setCodeError(reason instanceof Error ? reason.message : 'No appointment found with that code.')
    } finally {
      setCodeChecking(false)
    }
  }

  async function settleFromCode(bookingId: string) {
    if (!token || !window.confirm('Confirm you have genuinely received the rest of the payment from this client, in cash or Mobile Money?')) return
    try {
      await api.settleBookingBalance(token, bookingId)
      setCodeResult(function (current: any) {
        return current ? { ...current, amountPaid: current.confirmedPrice } : current
      })
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to mark this as settled.')
    }
  }

  async function status(booking: AdminBooking, next: string, price?: number) {
    if (!token) return
    try {
      await api.updateBookingStatus(token, booking.id, next, price)
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Update failed.')
    }
  }

  async function settleBalance(booking: AdminBooking) {
    if (!token || !window.confirm('Confirm you have genuinely received the rest of the payment from this client, in cash or Mobile Money?')) return
    try {
      await api.settleBookingBalance(token, booking.id)
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to mark this as settled.')
    }
  }

  function extensionTotalFor(booking: AdminBooking) {
    return (booking.extensionProductPrice || 0) * (booking.extensionQuantity || 0)
  }

  async function approveWithPrice(booking: AdminBooking) {
    const servicePrice = Number(approvalPriceDrafts[booking.id])
    if (!servicePrice || servicePrice <= 0) {
      setError('Enter a real price before approving.')
      return
    }
    const finalPrice = servicePrice + extensionTotalFor(booking)
    await status(booking, 'confirmed', finalPrice)
  }

  async function approveCustomLengthPrice(booking: AdminBooking) {
    if (!token) return
    const price = Number(priceDrafts[booking.id])
    if (!price || price <= 0) {
      setError('Enter a valid price before approving.')
      return
    }
    setApprovingId(booking.id)
    try {
      await api.approveCustomLength(token, booking.id, price)
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to approve this price.')
    } finally {
      setApprovingId('')
    }
  }

  async function removeBooking(booking: AdminBooking) {
    if (!token || !window.confirm('Delete this appointment permanently? This cannot be undone.')) return
    try {
      await api.deleteBooking(token, booking.id)
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete this appointment.')
    }
  }

  async function reschedule(booking: AdminBooking) {
    if (!token) return
    const draft = drafts[booking.id]
    if (!draft?.date || !draft.time) return setError('Choose a new date and time.')
    try {
      await api.rescheduleBooking(token, booking.id, draft.date, draft.time)
      await reload()
      setShowReschedule((all) => ({ ...all, [booking.id]: false }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Reschedule failed.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Appointments"
        title="Manage bookings"
        description="Approve, complete, reschedule or cancel customer appointments."
      />

      <Panel className="mt-6">
        <p className="font-serif text-xl text-[#3e2530]">Verify a client's code</p>
        <p className="mt-1 text-sm text-[#806b74]">
          Ask the client for their appointment code and check it here to confirm you have the right person.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="e.g. 7F3KQ2"
            className={fieldClass + ' max-w-xs uppercase tracking-[0.15em]'}
          />
          <PrimaryButton onClick={() => checkCode()}>
            {codeChecking ? 'Checking...' : 'Verify code'}
          </PrimaryButton>
        </div>
        {codeError && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{codeError}</p>
        )}
        {codeResult && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Match found</p>
            <p className="mt-2 font-serif text-xl text-[#3e2530]">{codeResult.customerName}</p>
            <p className="mt-1 text-sm text-[#745f68]">{codeResult.customerPhone}</p>
            <p className="mt-2 text-sm text-[#3e2530]">
              {codeResult.serviceName} on {String(codeResult.date).slice(0, 10)} at {codeResult.timeSlot}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-[#a82061]">
              Current status: {codeResult.status}
            </p>
            {codeResult.confirmedPrice != null && (
              <div className="mt-3 rounded-xl bg-white p-3">
                <p className="text-xs text-[#745f68]">
                  Total GHC {codeResult.confirmedPrice}, paid so far GHC {codeResult.amountPaid || 0}, remaining GHC {codeResult.confirmedPrice - (codeResult.amountPaid || 0)}
                </p>
                {(codeResult.amountPaid || 0) > 0 && (codeResult.amountPaid || 0) < codeResult.confirmedPrice && (
                  <button
                    onClick={() => settleFromCode(codeResult.id)}
                    className="mt-2 rounded-full border border-emerald-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700"
                  >
                    Mark remaining balance as settled in person
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Panel>

      <div className="mt-8 space-y-4">
        {loading && <Notice>Loading appointments...</Notice>}
        {error && <Notice error>{error}</Notice>}

        {data?.map((booking) => {
          const style = statusStyle[booking.status] ?? statusStyle.pending
          const isRescheduling = showReschedule[booking.id]

          return (
            <Panel key={booking.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-xl text-[#3e2530]">{booking.user.name}</p>
                  <p className="mt-1 text-sm text-[#806b74]">
                    {booking.service.name} at {booking.timeSlot} on {booking.date.slice(0, 10)}
                  </p>
                  <p className="mt-1 text-xs text-[#a08a94]">{booking.user.phone}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] ${style}`}
                >
                  {booking.status}
                </span>
              </div>

              {(booking.referenceImageUrl || booking.notes || booking.lengthLabel || booking.extensionProductName) && (
                <div className="mt-4 flex flex-wrap gap-4 rounded-2xl bg-[#fff7fa] p-4">
                  {booking.referenceImageUrl && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a08a94]">Reference photo</p>
                      <a href={booking.referenceImageUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={booking.referenceImageUrl}
                          alt=""
                          className="mt-2 h-40 w-40 rounded-xl object-cover transition hover:opacity-90"
                        />
                      </a>
                      <p className="mt-1.5 text-[10px] font-semibold text-[#a08a94]">Click to view full size</p>
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    {booking.lengthLabel && (
                      <p className="text-sm text-[#3e2530]">
                        <span className="font-bold">Length:</span> {booking.lengthLabel}
                      </p>
                    )}
                    {booking.extensionProductName && (
                      <p className="text-sm font-semibold text-[#a52261]">
                        <span className="font-bold">Extension requested:</span> {booking.extensionQuantity}x {booking.extensionProductName}
                        {booking.extensionProductPrice != null && (
                          <> (GHC {booking.extensionProductPrice} each, GHC {(booking.extensionProductPrice * (booking.extensionQuantity || 1)).toLocaleString()} total)</>
                        )}
                      </p>
                    )}
                    {booking.notes && (
                      <p className="text-sm text-[#3e2530]">
                        <span className="font-bold">Notes:</span> {booking.notes}
                      </p>
                    )}
                    {booking.confirmedPrice != null && (
                      <div className="mt-2 rounded-xl bg-white p-3">
                        <p className="text-xs text-[#745f68]">
                          Total GHC {booking.confirmedPrice}, paid so far GHC {booking.amountPaid || 0}, remaining GHC {booking.confirmedPrice - (booking.amountPaid || 0)}
                        </p>
                        {(booking.amountPaid || 0) > 0 && (booking.amountPaid || 0) < booking.confirmedPrice && (
                          <button
                            onClick={() => settleBalance(booking)}
                            className="mt-2 rounded-full border border-emerald-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700"
                          >
                            Mark remaining balance as settled in person
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {booking.customLengthRequest && (
                <div className="mt-4 rounded-2xl border border-[#e6a94a] bg-[#fdf2e0] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8a5a1f]">
                    Custom length or style requested
                  </p>
                  <p className="mt-2 text-sm text-[#3e2530]">{booking.customLengthRequest}</p>

                  {booking.customLengthStatus === 'approved' ? (
                    <p className="mt-3 text-sm font-bold text-emerald-700">
                      Approved at GHC {booking.customLengthPrice}
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Set a real price, GHC"
                        value={priceDrafts[booking.id] ?? ''}
                        onChange={(e) =>
                          setPriceDrafts((all) => ({ ...all, [booking.id]: e.target.value }))
                        }
                        className={fieldClass + ' max-w-[180px]'}
                      />
                      <PrimaryButton onClick={() => approveCustomLengthPrice(booking)}>
                        {approvingId === booking.id ? 'Saving...' : 'Approve with this price'}
                      </PrimaryButton>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2 border-t border-[#f0dfe6] pt-5">
                {booking.status === 'pending' && (
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        placeholder={extensionTotalFor(booking) > 0 ? 'Service price only, GHC' : 'Set the real price, GHC'}
                        value={approvalPriceDrafts[booking.id] ?? ''}
                        onChange={(e) =>
                          setApprovalPriceDrafts((all) => ({ ...all, [booking.id]: e.target.value }))
                        }
                        className={fieldClass + ' max-w-[180px]'}
                      />
                      <PrimaryButton onClick={() => approveWithPrice(booking)}>Approve</PrimaryButton>
                    </div>
                    {extensionTotalFor(booking) > 0 && (
                      <p className="mt-2 text-xs font-semibold text-[#a52261]">
                        Plus GHC {extensionTotalFor(booking)} for the extension, real total the client will pay: GHC {(Number(approvalPriceDrafts[booking.id]) || 0) + extensionTotalFor(booking)}
                      </p>
                    )}
                  </div>
                )}
                {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                  <button
                    onClick={() => status(booking, 'completed')}
                    className="rounded-full border border-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-emerald-700"
                  >
                    Mark completed
                  </button>
                )}
                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <button
                    onClick={() => status(booking, 'cancelled')}
                    className="rounded-full border border-red-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-red-600"
                  >
                    Cancel
                  </button>
                )}
                {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                  <button
                    onClick={() =>
                      setShowReschedule((all) => ({ ...all, [booking.id]: !all[booking.id] }))
                    }
                    className="rounded-full border border-[#d99eb7] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-[#9f205f]"
                  >
                    {isRescheduling ? 'Hide reschedule' : 'Reschedule'}
                  </button>
                )}
                {(booking.status === 'completed' || booking.status === 'cancelled') && (
                  <button
                    onClick={() => removeBooking(booking)}
                    className="rounded-full border border-[#c7a9b6] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-[#8f707d]"
                  >
                    Delete
                  </button>
                )}
              </div>

              {isRescheduling && (
                <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-[#fff7fa] p-4">
                  <div>
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#956f80]">
                      New date
                    </span>
                    <input
                      type="date"
                      className={fieldClass}
                      value={drafts[booking.id]?.date ?? booking.date.slice(0, 10)}
                      onChange={(e) =>
                        setDrafts((all) => ({
                          ...all,
                          [booking.id]: {
                            date: e.target.value,
                            time: all[booking.id]?.time ?? booking.timeSlot,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#956f80]">
                      New time
                    </span>
                    <input
                      type="time"
                      className={fieldClass}
                      value={drafts[booking.id]?.time ?? booking.timeSlot}
                      onChange={(e) =>
                        setDrafts((all) => ({
                          ...all,
                          [booking.id]: {
                            date: all[booking.id]?.date ?? booking.date.slice(0, 10),
                            time: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <button
                    onClick={() => reschedule(booking)}
                    className="rounded-full bg-[#dc2d83] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white"
                  >
                    Save new schedule
                  </button>
                </div>
              )}
            </Panel>
          )
        })}
      </div>
    </>
  )
}