import { useCallback, useState } from 'react'
import { api } from '../../lib/api'
import { Notice, PageHeader, Panel } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

function stars(rating: number) {
  return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating)
}

export function FeedbackAdminPage() {
  const loader = useCallback((token: string) => api.adminFeedback(token), [])
  const { data, setData, loading, error, setError, token } = useAdminResource(loader)
  const [busyId, setBusyId] = useState('')

  async function remove(id: string) {
    if (!token) return
    if (!window.confirm('Delete this feedback?')) return
    setBusyId(id)
    try {
      await api.adminDeleteFeedback(token, id)
      setData(await api.adminFeedback(token))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete feedback.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Feedback"
        description="What clients say about the app. Ratings come from the Feedback button on the website."
      />
      {loading && <div className="mt-8"><Notice>Loading feedback...</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      {data && (
        <div className="mt-8 grid gap-6">
          <Panel>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#76515f]">Average rating</p>
            <p className="mt-2 font-serif text-4xl text-[#3e2530]">
              {data.total ? data.average.toFixed(1) : '0.0'} <span className="text-2xl text-[#e8a317]">&#9733;</span>
            </p>
            <p className="mt-1 text-sm text-[#806b74]">{data.total} {data.total === 1 ? 'response' : 'responses'}</p>
          </Panel>
          {data.items.length === 0 && <Notice>No feedback yet.</Notice>}
          {data.items.map((item) => (
            <Panel key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg text-[#e8a317]" aria-label={item.rating + ' out of 5'}>{stars(item.rating)}</p>
                  <p className="mt-1 text-xs text-[#806b74]">
                    {item.name || 'Anonymous'}
                    {item.contact ? ' \u00b7 ' + item.contact : ''}
                    {' \u00b7 '}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => remove(item.id)}
                  className="text-xs font-semibold text-[#9f205f] underline underline-offset-4 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
              {item.message && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#604c55]">{item.message}</p>}
            </Panel>
          ))}
        </div>
      )}
    </>
  )
}
