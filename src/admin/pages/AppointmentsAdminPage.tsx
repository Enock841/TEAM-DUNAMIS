import { useCallback, useState } from 'react'
import { api, type AdminBooking } from '../../lib/api'
import { fieldClass, Notice, PageHeader, Panel, PrimaryButton } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

const statusStyle: Record<string, string> = {
  pending: 'bg-[#fbe7d0] text-[#8a5a1f]',
  confirmed: 'bg-[#dcefe3] text-[#2f7d55]',
  completed: 'bg-[#e4e1f0] text-[#5a4e8a]',
  cancelled: 'bg-[#f3ecee] text-[#75636b]',
}

export function AppointmentsAdminPage() {
  const loader = useCallback((token: string) => api.adminBookings(token), [])
  const { data = [], loading, error, setError, reload, token } = useAdminResource(loader)
  const [drafts, setDrafts] = useState<Record<string, { date: string; time: string }>>({})
  const [showReschedule, setShowReschedule] = useState<Record<string, boolean>>({})

  async function status(booking: AdminBooking, next: string) {
    if (!token) return
    try {
      await api.updateBookingStatus(token, booking.id, next)
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Update failed.')
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
                  <p className="font-serif text-xl text-[#1d171a]">{booking.user.name}</p>
                  <p className="mt-1 text-sm text-[#6b5a62]">
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

              <div className="mt-5 flex flex-wrap gap-2 border-t border-[#f0dfe6] pt-5">
                {booking.status === 'pending' && (
                  <PrimaryButton onClick={() => status(booking, 'confirmed')}>Approve</PrimaryButton>
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
              </div>

              {isRescheduling && (
                <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-[#fff9fb] p-4">
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
                    className="rounded-full bg-[#984667] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white"
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