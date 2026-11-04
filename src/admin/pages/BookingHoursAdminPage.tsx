import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { fieldClass, Notice, PageHeader, Panel, PrimaryButton } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

function toLabel(minutes: number) {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return String(hour12).padStart(2, '0') + ':' + String(minute).padStart(2, '0') + ' ' + period
}

function toMinutes(value: string) {
  const parts = value.split(':')
  return Number(parts[0]) * 60 + Number(parts[1] || 0)
}

export function BookingHoursAdminPage() {
  const loader = useCallback((token: string) => api.adminSettings(token), [])
  const { data, setData, loading, error, setError, token } = useAdminResource(loader)
  const [start, setStart] = useState('08:00')
  const [end, setEnd] = useState('18:00')
  const [interval, setIntervalMinutes] = useState('60')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!data) return
    setStart(data.bookingStartTime || '08:00')
    setEnd(data.bookingEndTime || '18:00')
    setIntervalMinutes(String(data.bookingIntervalMinutes || 60))
  }, [data])

  const preview: string[] = []
  const startMin = toMinutes(start)
  const endMin = toMinutes(end)
  const step = Number(interval) || 60
  if (!isNaN(startMin) && !isNaN(endMin) && endMin >= startMin) {
    for (let m = startMin; m <= endMin; m += step) preview.push(toLabel(m))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setMessage('')
    if (!start || !end || start >= end) {
      setError('The last appointment must be later than the first appointment.')
      return
    }
    try {
      const saved = await api.updateAdminSettings(token, {
        bookingStartTime: start,
        bookingEndTime: end,
        bookingIntervalMinutes: Number(interval) || 60,
      })
      setData(saved)
      setError('')
      setMessage('Booking hours saved. Clients will see the new times straight away.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save booking hours.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title="Booking hours"
        description="Choose the times clients can book each day. Bookings already made keep their times."
      />
      {loading && <div className="mt-8"><Notice>Loading booking hours...</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      {message && <div className="mt-8"><Notice>{message}</Notice></div>}
      {data && (
        <form onSubmit={save} className="mt-8 grid gap-6 xl:grid-cols-2">
          <Panel>
            <h2 className="font-serif text-2xl text-[#3e2530]">Your hours</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#76515f]">First appointment
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass} />
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#76515f]">Last appointment
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={fieldClass} />
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#76515f]">Time between appointments
                <select value={interval} onChange={(e) => setIntervalMinutes(e.target.value)} className={fieldClass}>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every 1 hour</option>
                  <option value="90">Every 1 hour 30 minutes</option>
                  <option value="120">Every 2 hours</option>
                </select>
              </label>
            </div>
            <div className="mt-6"><PrimaryButton type="submit">Save booking hours</PrimaryButton></div>
          </Panel>
          <Panel>
            <h2 className="font-serif text-2xl text-[#3e2530]">What clients will see</h2>
            <p className="mt-2 text-xs text-[#806b74]">These are the times offered on the booking page.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {preview.length === 0 && <p className="text-sm text-[#806b74]">Choose a first and last time to see the list.</p>}
              {preview.map((label) => (
                <span key={label} className="rounded-full border border-[#e5cbd6] bg-white px-4 py-2 text-sm font-semibold text-[#604c55]">{label}</span>
              ))}
            </div>
          </Panel>
        </form>
      )}
    </>
  )
}
