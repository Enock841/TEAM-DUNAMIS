import { useCallback } from 'react'
import { api } from '../../lib/api'
import { Notice, PageHeader, Panel } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

const statusStyle = {
  pending: 'bg-[#fbe7d0] text-[#8a5a1f]',
  approved: 'bg-[#dcefe3] text-[#2f7d55]',
  rejected: 'bg-[#f3ecee] text-[#75636b]',
}

export function ReviewsAdminPage() {
  const loader = useCallback((token) => api.adminReviews(token), [])
  const { data, loading, error, setError, reload, token } = useAdminResource(loader)
  const reviews = data ?? []

  async function change(id, status) {
    if (!token) return
    try {
      await api.updateReviewStatus(token, id, status)
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update review.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Client voices"
        title="Reviews"
        description="Approve real client photos and videos before they appear on the site."
      />
      <div className="mt-8 space-y-4">
        {loading && <Notice>Loading reviews...</Notice>}
        {error && <Notice error>{error}</Notice>}
        {!loading && reviews.length === 0 && <Notice>No reviews submitted yet.</Notice>}

        {reviews.map((review) => {
          const style = statusStyle[review.status] ?? statusStyle.pending
          return (
            <Panel key={review.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-xl text-[#1d171a]">{review.customerName}</p>
                  <p className="mt-1 text-xs text-[#6b5a62]">{review.serviceName}</p>
                  <div className="mt-2 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={n <= review.rating ? 'text-[#984667]' : 'text-[#e6d3da]'}>
                        star
                      </span>
                    ))}
                  </div>
                </div>
                <span className={'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] ' + style}>
                  {review.status}
                </span>
              </div>

              {review.comment && (
                <p className="mt-4 text-sm leading-6 text-[#5b4750]">{review.comment}</p>
              )}

              {review.mediaUrl && review.mediaType === 'photo' && (
                <img src={review.mediaUrl} alt="" className="mt-4 h-48 w-full max-w-sm rounded-2xl object-cover" />
              )}
              {review.mediaUrl && review.mediaType === 'video' && (
                <video src={review.mediaUrl} controls className="mt-4 h-48 w-full max-w-sm rounded-2xl object-cover" />
              )}

              {review.status === 'pending' && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#f0dfe6] pt-5">
                  <button onClick={() => change(review.id, 'approved')} className="rounded-full border border-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-emerald-700">
                    Approve
                  </button>
                  <button onClick={() => change(review.id, 'rejected')} className="rounded-full border border-red-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-red-600">
                    Reject
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