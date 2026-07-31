import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ReviewMediaField } from '../components/ReviewMediaField'
import { useAppData } from '../context/appData'
import { api, type Review } from '../lib/api'

type ReviewsPageProps = {
  onRequireAuth: () => void
}

const statusLabels: Record<string, string> = {
  approved: 'Published',
  pending: 'Awaiting approval',
  rejected: 'Needs changes',
}

export function ReviewsPage({ onRequireAuth }: ReviewsPageProps) {
  const { token, authLoading } = useAppData()
  const [reviews, setReviews] = useState<Review[]>([])
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [myReviewLoading, setMyReviewLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null)

  const loadReviews = useCallback(() => {
    setLoading(true)
    setError('')
    return api
      .reviews()
      .then(setReviews)
      .catch((reason) => {
        setError(
          reason instanceof Error ? reason.message : 'Unable to load reviews.',
        )
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  useEffect(() => {
    if (!token) {
      setMyReview(null)
      setEditing(false)
      return
    }

    setMyReviewLoading(true)
    api
      .myReview(token)
      .then(({ review }) => {
        setMyReview(review)
        if (!review) {
          setRating(5)
          setComment('')
          setMediaUrl('')
          setMediaType(null)
        }
      })
      .catch((reason) => {
        setMessage(
          reason instanceof Error
            ? reason.message
            : 'Unable to load your review.',
        )
      })
      .finally(() => setMyReviewLoading(false))
  }, [token])

  function beginEdit() {
    if (!myReview) return
    setRating(myReview.rating)
    setComment(myReview.comment)
    setMediaUrl(myReview.mediaUrl ?? '')
    setMediaType(myReview.mediaType ?? null)
    setMessage('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setMessage('')
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      onRequireAuth()
      return
    }

    setSubmitting(true)
    setMessage('')
    const body = {
      rating,
      comment: comment.trim(),
      mediaUrl: mediaUrl || null,
      mediaType: mediaUrl ? mediaType : null,
    }

    try {
      const result = myReview
        ? await api.updateReview(token, myReview.id, body)
        : await api.createReview(token, body)
      setMyReview(result.review)
      setEditing(false)
      setMessage(
        myReview
          ? 'Your review was updated and returned for approval.'
          : 'Thank you. Your review was submitted for approval.',
      )
      await loadReviews()
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : 'Unable to save your review.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteReview() {
    if (
      !token ||
      !myReview ||
      !window.confirm('Delete your review? This cannot be undone.')
    ) {
      return
    }

    setSubmitting(true)
    setMessage('')
    try {
      await api.deleteReview(token, myReview.id)
      setMyReview(null)
      setEditing(false)
      setRating(5)
      setComment('')
      setMediaUrl('')
      setMediaType(null)
      setMessage('Your review was deleted.')
      await loadReviews()
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Unable to delete your review.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const showForm = Boolean(token) && (!myReview || editing)

  return (
    <main className="bg-[#fffdfd]">
      <section className="campaign-grid border-b border-[#d9c7cf] bg-[#c992aa] px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="editorial-kicker text-[#4b313d]">Client voices</p>
          <h1 className="text-display-soft mt-4 font-serif text-6xl font-light uppercase leading-[0.9] sm:text-7xl">
            Real results, real clients
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#55434b]">
            Share your Beryl&apos;s experience once you are signed in. Every
            review is moderated before it appears publicly.
          </p>
        </div>
      </section>

      <section className="border-b border-[#e4cbd5] bg-[#f7e4ec] px-6 py-14 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="editorial-kicker text-[#984667]">Your review</p>
            <h2 className="text-display-soft mt-3 font-serif text-5xl font-light uppercase leading-[0.95]">
              Tell us how we did
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#5b4750]">
              Each client account can leave one review. You can return here to
              edit or delete it at any time.
            </p>
          </div>

          <div className="border border-[#dcb9c8] bg-[#fff9fb] p-6 sm:p-8">
            {(authLoading || myReviewLoading) && (
              <p className="text-sm text-[#5b4750]">Loading your review…</p>
            )}

            {!authLoading && !token && (
              <div>
                <p className="font-serif text-3xl text-[#342b2f]">
                  Sign in to leave a review
                </p>
                <p className="mt-3 text-sm leading-6 text-[#5b4750]">
                  Reviews are connected to client accounts so every person can
                  submit and manage their own feedback.
                </p>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="mt-6 bg-[#1d171a] px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white"
                >
                  Sign in or create account
                </button>
              </div>
            )}

            {!myReviewLoading && token && myReview && !editing && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="flex gap-1 text-xl text-[#984667]"
                    aria-label={`${myReview.rating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= myReview.rating
                            ? 'text-[#984667]'
                            : 'text-[#e6d3da]'
                        }
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="border border-[#dcb9c8] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#654656]">
                    {statusLabels[myReview.status ?? 'pending'] ??
                      myReview.status}
                  </span>
                </div>
                {myReview.comment && (
                  <p className="mt-5 text-sm leading-7 text-[#5b4750]">
                    {myReview.comment}
                  </p>
                )}
                {myReview.mediaUrl &&
                  (myReview.mediaType === 'video' ? (
                    <video
                      src={myReview.mediaUrl}
                      controls
                      className="mt-5 h-52 w-full object-cover"
                    />
                  ) : (
                    <img
                      src={myReview.mediaUrl}
                      alt="Your review upload"
                      className="mt-5 h-52 w-full object-cover"
                    />
                  ))}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={beginEdit}
                    className="bg-[#984667] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white"
                  >
                    Edit review
                  </button>
                  <button
                    type="button"
                    onClick={deleteReview}
                    disabled={submitting}
                    className="border border-[#984667] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#984667] disabled:opacity-50"
                  >
                    Delete review
                  </button>
                </div>
              </div>
            )}

            {!myReviewLoading && showForm && (
              <form onSubmit={submitReview}>
                <fieldset>
                  <legend className="text-xs font-bold uppercase tracking-[0.14em] text-[#5b4750]">
                    Your rating
                  </legend>
                  <div className="mt-3 flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`${star} star${star === 1 ? '' : 's'}`}
                        aria-pressed={rating === star}
                        className={`text-3xl transition ${
                          star <= rating ? 'text-[#984667]' : 'text-[#dcc4ce]'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="mt-6 block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#5b4750]">
                    Your experience
                  </span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="Tell us about your visit…"
                    className="w-full resize-y border border-[#cdb8c1] bg-white px-4 py-3 text-sm text-[#342b2f] outline-none focus:border-[#984667]"
                  />
                </label>
                <div className="mt-5">
                  <ReviewMediaField
                    value={mediaUrl}
                    mediaType={mediaType}
                    onChange={(url, type) => {
                      setMediaUrl(url)
                      setMediaType(type)
                    }}
                    onClear={() => {
                      setMediaUrl('')
                      setMediaType(null)
                    }}
                  />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#1d171a] px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
                  >
                    {submitting
                      ? 'Saving…'
                      : myReview
                        ? 'Save changes'
                        : 'Submit review'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#654656]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {message && (
              <p
                role="status"
                className="mt-5 border-t border-[#e2c7d2] pt-4 text-sm text-[#7d3855]"
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between gap-5 border-b border-[#e2c7d2] pb-5">
            <div>
              <p className="editorial-kicker text-[#984667]">Published stories</p>
              <h2 className="text-display-soft mt-2 font-serif text-4xl uppercase sm:text-5xl">
                What clients are saying
              </h2>
            </div>
            {!loading && !error && (
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#765762]">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            )}
          </div>

          {loading && (
            <p className="text-center text-sm text-[#5f5157]">
              Loading reviews…
            </p>
          )}
          {error && (
            <p className="text-center text-sm text-[#8b435f]">{error}</p>
          )}
          {!loading && !error && reviews.length === 0 && (
            <p className="border border-[#e2c7d2] px-6 py-12 text-center text-sm text-[#5f5157]">
              No published reviews yet. Sign in above to share your experience.
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="overflow-hidden border border-[#d9c7cf] bg-white"
              >
                {review.mediaUrl && review.mediaType === 'photo' && (
                  <img
                    src={review.mediaUrl}
                    alt=""
                    className="h-56 w-full object-cover"
                  />
                )}
                {review.mediaUrl && review.mediaType === 'video' && (
                  <video
                    src={review.mediaUrl}
                    controls
                    className="h-56 w-full object-cover"
                  />
                )}
                <div className="p-6">
                  <div
                    className="flex gap-1"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= review.rating
                            ? 'text-[#984667]'
                            : 'text-[#e6d3da]'
                        }
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {review.comment && (
                    <p className="mt-4 text-sm leading-7 text-[#5b4750]">
                      {review.comment}
                    </p>
                  )}
                  <p className="mt-5 border-t border-[#ecd6df] pt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#654656]">
                    {review.customerName} · {review.serviceName}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
