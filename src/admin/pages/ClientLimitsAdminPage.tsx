import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { fieldClass, Notice, Panel, PrimaryButton } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

function prettyDay(day: string) {
  const parts = day.split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function ClientLimitsSection() {
  const loader = useCallback((token: string) => api.adminLimits(token), [])
  const { data, setData, loading, error, setError, token } = useAdminResource(loader)
  const [defaultMax, setDefaultMax] = useState('0')
  const [day, setDay] = useState('')
  const [dayMax, setDayMax] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (data) setDefaultMax(String(data.defaultMax || 0))
  }, [data])

  async function saveDefault(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setMessage('')
    setError('')
    const value = Math.floor(Number(defaultMax) || 0)
    try {
      await api.adminSetDefaultLimit(token, value)
      setData(await api.adminLimits(token))
      setMessage(value === 0 ? 'No daily limit. Clients can book as many times as are free.' : 'Saved. Beryl will take up to ' + value + ' clients a day.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save the limit.')
    }
  }

  async function addDay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setMessage('')
    setError('')
    const value = Math.floor(Number(dayMax))
    if (!day || !value || value < 1) {
      setError('Pick a date and enter how many clients you can take that day (at least 1). To close a day completely, use Days off.')
      return
    }
    try {
      await api.adminSetDayLimit(token, day, value)
      setData(await api.adminLimits(token))
      setDay('')
      setDayMax('')
      setMessage('Saved. That day now allows up to ' + value + ' clients.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save that day.')
    }
  }

  async function removeDay(target: string) {
    if (!token) return
    setMessage('')
    setError('')
    try {
      await api.adminRemoveDayLimit(token, target)
      setData(await api.adminLimits(token))
      setMessage('That day goes back to the usual limit.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to remove that day.')
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10)

  return (
    <>
      <div className="mt-12">
        <h2 className="font-serif text-3xl text-[#3e2530]">Client limits</h2>
        <p className="mt-2 text-sm text-[#745f68]">Choose how many clients you can take in a day. Set a different number for a particular day when you need to.</p>
      </div>
      {loading && <div className="mt-8"><Notice>Loading limits...</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      {message && <div className="mt-8"><Notice>{message}</Notice></div>}
      {data && (
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <Panel>
            <h2 className="font-serif text-2xl text-[#3e2530]">Clients every day</h2>
            <p className="mt-2 text-xs text-[#806b74]">This is the usual number of clients for any day. Enter 0 for no limit. Once a day is full, clients cannot book it.</p>
            <form onSubmit={saveDefault} className="mt-5 grid gap-4">
              <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#76515f]">Clients per day
                <input type="number" min="0" max="100" value={defaultMax} onChange={(e) => setDefaultMax(e.target.value)} className={fieldClass} />
              </label>
              <div><PrimaryButton type="submit">Save</PrimaryButton></div>
            </form>
          </Panel>
          <Panel>
            <h2 className="font-serif text-2xl text-[#3e2530]">A particular day</h2>
            <p className="mt-2 text-xs text-[#806b74]">Use a different number for one date, for example a shorter day. To close a day completely, use Days off.</p>
            <form onSubmit={addDay} className="mt-5 grid gap-4">
              <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#76515f]">Date
                <input type="date" min={todayIso} value={day} onChange={(e) => setDay(e.target.value)} className={fieldClass} />
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#76515f]">Clients that day
                <input type="number" min="1" max="100" value={dayMax} onChange={(e) => setDayMax(e.target.value)} className={fieldClass} />
              </label>
              <div><PrimaryButton type="submit">Save this day</PrimaryButton></div>
            </form>
            <div className="mt-6 grid gap-2">
              {data.days.length === 0 && <p className="text-sm text-[#806b74]">No particular days set.</p>}
              {data.days.map((entry) => (
                <div key={entry.day} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
                  <p className="text-sm text-[#604c55]">{prettyDay(entry.day)}: <strong>{entry.maxClients}</strong> {entry.maxClients === 1 ? 'client' : 'clients'}</p>
                  <button type="button" onClick={() => removeDay(entry.day)} className="text-xs font-semibold text-[#9f205f] underline underline-offset-4">Remove</button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </>
  )
}
