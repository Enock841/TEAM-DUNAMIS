import { useEffect, useState } from 'react'
import { api, type Review } from '../lib/api'

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(function () {
    api.reviews()
      .then(function (data) {
        setReviews(data)
      })
      .catch(function (err) {
        setError(err instanceof Error ? err.message : 'Unable to load reviews.')
      })
      .finally(function () {
        setLoading(false)
      })
  }, [])

  return (
    <main className="bg-[#fffdfd]">
      <section className="border-b border-[#d9c7cf] bg-[#ead2dd] px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#984667]">Client voices</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-[#1d171a] sm:text-6xl">
            Real results, real clients
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#5f5157]">
            Every review here comes from a real client with a completed appointment, approved by our team before it goes live.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          {loading && <p className="text-center text-sm text-[#5f5157]">Loading reviews...</p>}
          {error && <p className="text-center text-sm text-[#8b435f]">{error}</p>}
          {!loading && !error && reviews.length === 0 && (
            <p className="text-center text-sm text-[#5f5157]">No reviews yet, be the first to share your experience after your visit.</p>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map(function (review) {
              return (
                <article key={review.id} className="overflow-hidden rounded-[1.75rem] border border-[#d9c7cf] bg-white">
                  {review.mediaUrl && review.mediaType === 'photo' && (
                    <img src={review.mediaUrl} alt="" className="h-56 w-full object-cover" />
                  )}
                  {review.mediaUrl && review.mediaType === 'video' && (
                    <video src={review.mediaUrl} controls className="h-56 w-full object-cover" />
                  )}
                  <div className="p-6">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(function (n) {
                        const starClass = n <= review.rating ? 'text-[#984667]' : 'text-[#e6d3da]'
                        return <span key={n} className={starClass}>star</span>
                      })}
                    </div>
                    {review.comment && (
                      <p className="mt-4 text-sm leading-7 text-[#5b4750]">{review.comment}</p>
                    )}
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#75636b]">
                      {review.customerName} - {review.serviceName}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}