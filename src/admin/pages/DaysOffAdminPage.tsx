import { useCallback, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { Notice, PageHeader, Panel, PrimaryButton } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

export function DaysOffAdminPage() {
  const loader = useCallback((token: string) => api.adminDaysOff(token), [])
  const { data, setData, loading, error, setError, token } = useAdminResource(loader)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [weeklyDraft, setWeeklyDraft] = useState<number[] | null>(null)

  const closedDays = useMemo(
    () => new Map((data?.days ?? []).map((entry) => [entry.day, entry.reason] as const)),
    [data],
  )
  const savedWeekdays = data?.weekdays ?? []
  const draftWeekdays = weeklyDraft ?? savedWeekdays

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayIso = isoDate(now.getFullYear(), now.getMonth(), now.getDate())

  function changeMonth(step: number) {
    const next = new Date(year, month + step, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  function toggleWeekday(weekday: number) {
    setWeeklyDraft((current) => {
      const base = current ?? savedWeekdays
      return base.includes(weekday) ? base.filter((item) => item !== weekday) : [...base, weekday].sort()
    })
  }

  async function saveWeekdays() {
    if (!token || !data) return
    setBusy(true)
    setMessage('')
    try {
      const result = await api.adminSetClosedWeekdays(token, draftWeekdays)
      setData({ ...data, weekdays: result.weekdays })
      setWeeklyDraft(null)
      setMessage('Weekly closed days saved.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save weekly closed days.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleDay(dayIso: string, dayOfWeek: number) {
    if (!token || !data) return
    setMessage('')
    if (savedWeekdays.includes(dayOfWeek)) {
      setMessage(`${weekdayNames[dayOfWeek]}s are already closed every week. Change that under "Weekly closed days" above.`)
      return
    }
    setBusy(true)
    try {
      if (closedDays.has(dayIso)) {
        await api.adminRemoveDayOff(token, dayIso)
        setData({ ...data, days: data.days.filter((entry) => entry.day !== dayIso) })
        setMessage('That day is open for bookings again.')
      } else {
        const reason = window.prompt(
          'Optional note for yourself (for example: Holiday). Leave blank to skip, or press Cancel to stop.',
          '',
        )
        if (reason === null) return
        const result = await api.adminAddDayOff(token, dayIso, reason.trim() || undefined)
        const days = [...data.days.filter((entry) => entry.day !== dayIso), { day: dayIso, reason: result.reason }].sort((a, b) =>
          a.day.localeCompare(b.day),
        )
        setData({ ...data, days })
        setMessage(
          result.existingBookings > 0
            ? `That day is now closed to new bookings. Note: ${result.existingBookings} booking${result.existingBookings === 1 ? '' : 's'} already exist on it. Open Appointments to move or cancel them.`
            : 'That day is now closed to new bookings.',
        )
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update this day.')
    } finally {
      setBusy(false)
    }
  }

  const upcoming = (data?.days ?? []).filter((entry) => entry.day >= todayIso)

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title="Days off"
        description="Close days when you are not working. Clients cannot book a closed day."
      />
      {loading && <div className="mt-8"><Notice>Loading calendar...</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      {message && <div className="mt-8"><Notice>{message}</Notice></div>}

      {data && (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6">
            <Panel>
              <h2 className="font-serif text-2xl text-[#3e2530]">Weekly closed days</h2>
              <p className="mt-2 text-xs text-[#806b74]">Tick the days of the week you never work, then save.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {weekdayNames.map((name, index) => (
                  <label key={name} className="flex items-center gap-2 rounded-full border border-[#ead7df] px-4 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draftWeekdays.includes(index)}
                      onChange={() => toggleWeekday(index)}
                      className="h-4 w-4 accent-[#d92c83]"
                    />
                    {name}
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <PrimaryButton type="button" onClick={saveWeekdays} disabled={busy || weeklyDraft === null}>
                  Save weekly closed days
                </PrimaryButton>
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => changeMonth(-1)} className="rounded-full border border-[#e5cbd6] px-4 py-2 text-sm font-bold">Previous</button>
                <h2 className="font-serif text-2xl text-[#3e2530]">{monthNames[month]} {year}</h2>
                <button type="button" onClick={() => changeMonth(1)} className="rounded-full border border-[#e5cbd6] px-4 py-2 text-sm font-bold">Next</button>
              </div>
              <p className="mt-3 text-xs text-[#806b74]">Tap a day to close it. Tap a closed day again to open it.</p>
              <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase text-[#8f707d]">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => <span key={index}>{label}</span>)}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstWeekday }).map((_, index) => <span key={'blank-' + index} />)}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1
                  const dayIso = isoDate(year, month, day)
                  const dayOfWeek = new Date(year, month, day).getDay()
                  const isPast = dayIso < todayIso
                  const weeklyClosed = savedWeekdays.includes(dayOfWeek)
                  const specificClosed = closedDays.has(dayIso)
                  let cls = 'flex h-12 items-center justify-center rounded-lg text-sm font-semibold transition '
                  if (isPast) cls += 'cursor-not-allowed bg-[#f6eef2] text-[#c7a9b6]'
                  else if (specificClosed) cls += 'bg-[#d92c83] text-white'
                  else if (weeklyClosed) cls += 'bg-[#e9dce3] text-[#8f707d]'
                  else cls += 'border border-[#ecd8e1] bg-white text-[#604c55] hover:border-[#d92c83]'
                  return (
                    <button
                      key={dayIso}
                      type="button"
                      disabled={isPast || busy}
                      onClick={() => toggleDay(dayIso, dayOfWeek)}
                      title={specificClosed ? closedDays.get(dayIso) || 'Closed' : weeklyClosed ? 'Closed every week' : 'Open'}
                      className={cls}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-semibold text-[#8f707d]">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-[#ecd8e1] bg-white" /> Open</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#d92c83]" /> Closed day</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#e9dce3]" /> Closed every week</span>
              </div>
            </Panel>
          </div>

          <Panel>
            <h2 className="font-serif text-2xl text-[#3e2530]">Upcoming closed days</h2>
            <div className="mt-4 space-y-3">
              {upcoming.map((entry) => (
                <div key={entry.day} className="flex items-center justify-between rounded-xl bg-[#fbf4f7] p-3">
                  <div>
                    <strong className="text-sm">{new Date(entry.day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    {entry.reason && <span className="block text-xs text-[#806b74]">{entry.reason}</span>}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleDay(entry.day, new Date(entry.day + 'T00:00:00').getDay())}
                    className="text-xs font-bold uppercase tracking-[0.08em] text-red-600 underline disabled:opacity-40"
                  >
                    Open again
                  </button>
                </div>
              ))}
              {upcoming.length === 0 && <p className="text-sm text-[#806b74]">No special closed days yet.</p>}
            </div>
          </Panel>
        </div>
      )}
    </>
  )
}