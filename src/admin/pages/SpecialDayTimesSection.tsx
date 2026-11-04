import { useCallback, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { fieldClass, Notice, Panel, PrimaryButton } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

function clockLabel(value: string) {
  const parts = value.split(':')
  const hour24 = Number(parts[0])
  const minute = Number(parts[1] || 0)
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return String(hour12).padStart(2, '0') + ':' + String(minute).padStart(2, '0') + ' ' + period
}

function prettyDay(day: string) {
  const parts = day.split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function SpecialDayTimesSection() {
  const loader = useCallback((token: string) => api.adminDaySlots(token), [])
  const { data, setData, loading, error, setError, token } = useAdminResource(loader)
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')
  const [times, setTimes] = useState<string[]>([])
  const [message, setMessage] = useState('')

  function addTime() {
    if (!time) return
    if (!times.includes(time)) setTimes([...times, time].sort())
    setTime('')
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setMessage('')
    setError('')
    if (!day || times.length === 0) {
      setError('Pick a date and add at least one time for that day.')
      return
    }
    try {
      await api.adminSetDaySlots(token, day, times)
      setData(await api.adminDaySlots(token))
      setDay('')
      setTimes([])
      setMessage('Saved. Clients can only book those times on that day.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save those times.')
    }
  }

  async function remove(target: string) {
    if (!token) return
    setMessage('')
    setError('')
    try {
      await api.adminRemoveDaySlots(token, target)
      setData(await api.adminDaySlots(token))
      setMessage('That day goes back to your usual booking hours.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to remove that day.')
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10)

  return (
    <>
      <div className="mt-12">
        <h2 className="font-serif text-3xl text-[#3e2530]">Your own times for one day</h2>
        <p className="mt-2 text-sm text-[#745f68]">Pick a date and choose exactly which times clients can book that day, for example 10:30 AM and 2:00 PM only. Other days keep your usual hours.</p>
      </div>
      {loading && <div className="mt-6"><Notice>Loading...</Notice></div>}
      {error && <div className="mt-6"><Notice error>{error}</Notice></div>}
      {message && <div className="mt-6"><Notice>{message}</Notice></div>}
      {data && (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Panel>
            <form onSubmit={save} className="grid gap-4">
              <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#76515f]">Date
                <input type="date" min={todayIso} value={day} onChange={(e) => setDay(e.target.value)} className={fieldClass} />
              </label>
              <div className="grid gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#76515f]">Add a time
                <div className="flex gap-2">
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={fieldClass} />
                  <button type="button" onClick={addTime} className="rounded-full border border-[#d92c83] px-5 text-xs font-bold uppercase tracking-[0.1em] text-[#d92c83]">Add</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {times.length === 0 && <p className="text-sm text-[#806b74]">No times added yet.</p>}
                {times.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTimes(times.filter((item) => item !== value))}
                    className="rounded-full border border-[#e5cbd6] bg-white px-4 py-2 text-sm font-semibold text-[#604c55]"
                    aria-label={'Remove ' + clockLabel(value)}
                  >
                    {clockLabel(value)} &times;
                  </button>
                ))}
              </div>
              <div><PrimaryButton type="submit">Save this day</PrimaryButton></div>
            </form>
          </Panel>
          <Panel>
            <h3 className="font-serif text-2xl text-[#3e2530]">Days with your own times</h3>
            <div className="mt-4 grid gap-2">
              {data.days.length === 0 && <p className="text-sm text-[#806b74]">None yet.</p>}
              {data.days.map((entry) => (
                <div key={entry.day} className="flex items-start justify-between gap-3 rounded-xl bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold text-[#604c55]">{prettyDay(entry.day)}</p>
                    <p className="mt-1 text-xs text-[#806b74]">{entry.times.map(clockLabel).join(', ')}</p>
                  </div>
                  <button type="button" onClick={() => remove(entry.day)} className="text-xs font-semibold text-[#9f205f] underline underline-offset-4">Remove</button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </>
  )
}
