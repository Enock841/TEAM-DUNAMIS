import { useCallback, useEffect, useState } from 'react'
import { useAppData } from '../context/appData'
import {
  api,
  type CustomerBooking,
  type CustomerOrder,
  type ReviewableBooking,
} from '../lib/api'
import { ReviewMediaField } from '../components/ReviewMediaField'

const tabs = [
  ['profile', 'Profile'],
  ['bookings', 'Appointments'],
  ['orders', 'Orders'],
  ['security', 'Security'],
]

export function AccountPage(props: { onRequireAuth: () => void }) {
  const onRequireAuth = props.onRequireAuth
  const appData = useAppData()
  const authLoading = appData.authLoading
  const changePassword = appData.changePassword
  const token = appData.token
  const updateProfile = appData.updateProfile
  const user = appData.user

  const params = new URLSearchParams(window.location.hash.split('?')[1])
  const requestedTab = params.get('tab') || 'profile'
  let activeTab = 'profile'
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i][0] === requestedTab) {
      activeTab = requestedTab
    }
  }

  const [bookings, setBookings] = useState<CustomerBooking[]>([])
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [reviewable, setReviewable] = useState<ReviewableBooking[]>([])
  const [recordsLoading, setRecordsLoading] = useState(Boolean(token))
  const [recordsError, setRecordsError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const [reviewingId, setReviewingId] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState<'photo' | 'video' | undefined>(undefined)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')

  const loadRecords = useCallback(function () {
    if (!token) return
    setRecordsLoading(true)
    Promise.all([api.myBookings(token), api.myOrders(token), api.myReviewableBookings(token)])
      .then(function (results) {
        setBookings(results[0])
        setOrders(results[1])
        setReviewable(results[2])
      })
      .catch(function (err) {
        setRecordsError(err instanceof Error ? err.message : 'Unable to load your account.')
      })
      .finally(function () {
        setRecordsLoading(false)
      })
  }, [token])

  useEffect(function () {
    loadRecords()
  }, [loadRecords])

  function openReview(bookingId) {
    setReviewingId(bookingId)
    setRating(5)
    setComment('')
    setMediaUrl('')
    setMediaType(undefined)
    setReviewMessage('')
  }

  async function submitReview() {
    if (!token || !reviewingId) return
    setReviewSubmitting(true)
    setReviewMessage('')
    try {
      await api.createReview(token, {
        bookingId: reviewingId,
        rating: rating,
        comment: comment.trim() || undefined,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType,
      })
      setReviewingId('')
      loadRecords()
    } catch (err) {
      setReviewMessage(err instanceof Error ? err.message : 'Unable to submit your review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await updateProfile(String(form.get('name')), String(form.get('phone')))
      setMessage('Your profile has been updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setBusy(false)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    const nextPassword = String(form.get('newPassword'))
    const confirmation = String(form.get('confirmPassword'))
    if (nextPassword !== confirmation) {
      setMessage('The new passwords do not match.')
      setBusy(false)
      return
    }
    try {
      const result = await changePassword(String(form.get('currentPassword')), nextPassword)
      event.currentTarget.reset()
      setMessage(result)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Password update failed.')
    } finally {
      setBusy(false)
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-[620px] bg-[#fffdfd] px-6 py-20 text-center">
        <p>Checking your account...</p>
      </main>
    )
  }

  if (!token || !user) {
    return (
      <main className="flex min-h-[620px] items-center bg-[#fffdfd] px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#984667]">Client account</p>
          <h1 className="mt-4 font-serif text-5xl text-[#1d171a]">Sign in to continue</h1>
          <p className="mt-5 text-base leading-8 text-[#5f5157]">
            View your appointments, orders and account settings after signing in.
          </p>
          <button type="button" onClick={onRequireAuth} className="mt-8 rounded-full bg-[#984667] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white">
            Sign in or register
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[720px] bg-[#fffdfd] px-5 py-12 sm:px-10 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#984667]">Client account</p>
          <h1 className="mt-3 font-serif text-5xl text-[#1d171a]">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="mt-3 text-sm text-[#5f5157]">Manage your details and review your activity.</p>
        </div>

        <div className="mt-9 grid gap-8 lg:grid-cols-[240px_1fr]">
          <nav aria-label="Account sections" className="flex gap-2 overflow-x-auto lg:flex-col">
            {tabs.map(function (tab) {
              const value = tab[0]
              const label = tab[1]
              const linkHref = '#/account?tab=' + value
              const linkClass = activeTab === value
                ? 'shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition bg-[#1d171a] text-white'
                : 'shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition border border-[#d9c7cf] bg-white text-[#5f5157] hover:border-[#984667]'
              return (
                <a key={value} href={linkHref} className={linkClass}>
                  {label}
                </a>
              )
            })}
          </nav>

          <section className="rounded-[1.75rem] border border-[#d9c7cf] bg-white p-6 shadow-[0_16px_50px_rgba(76,35,53,0.06)] sm:p-9">
            {activeTab === 'profile' && (
              <div>
                <h2 className="font-serif text-3xl text-[#1d171a]">Profile details</h2>
                <form onSubmit={saveProfile} className="mt-7 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">Full name</span>
                    <input required name="name" minLength={2} defaultValue={user.name} autoComplete="name" className="h-13 w-full rounded-xl border border-[#cdb8c1] px-4 outline-none focus:border-[#984667]" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">Phone number</span>
                    <input required name="phone" type="tel" minLength={7} maxLength={20} defaultValue={user.phone} autoComplete="tel" className="h-13 w-full rounded-xl border border-[#cdb8c1] px-4 outline-none focus:border-[#984667]" />
                  </label>
                  <button type="submit" disabled={busy} className="w-fit rounded-full bg-[#984667] px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50 sm:col-span-2">
                    {busy ? 'Saving...' : 'Save changes'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h2 className="font-serif text-3xl text-[#1d171a]">My appointments</h2>

                {reviewable.length > 0 && (
                  <div className="mt-7 rounded-2xl border border-dashed border-[#984667] bg-[#fff9fb] p-5">
                    <p className="text-sm font-semibold text-[#1d171a]">
                      You have {reviewable.length} completed appointment(s) you can review
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {reviewable.map(function (item) {
                        return (
                          <button key={item.bookingId} type="button" onClick={function () { openReview(item.bookingId) }} className="rounded-full bg-[#984667] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white">
                            Review {item.serviceName}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {reviewingId && (
                  <div className="mt-5 rounded-2xl border border-[#d9c7cf] bg-white p-5">
                    <p className="font-serif text-xl text-[#1d171a]">Share your experience</p>
                    <div className="mt-4 flex gap-1">
                      {[1, 2, 3, 4, 5].map(function (n) {
                        const starClass = n <= rating ? 'text-[#984667]' : 'text-[#e6d3da]'
                        return (
                          <button key={n} type="button" onClick={function () { setRating(n) }} className={starClass}>
                            star
                          </button>
                        )
                      })}
                    </div>
                    <textarea
                      value={comment}
                      onChange={function (e) { setComment(e.target.value) }}
                      placeholder="Tell us how it went"
                      className="mt-4 h-24 w-full rounded-xl border border-[#cdb8c1] p-3 text-sm outline-none focus:border-[#984667]"
                    />
                    <div className="mt-4">
                      <ReviewMediaField
                        onChange={function (url, type) {
                          setMediaUrl(url)
                          setMediaType(type)
                        }}
                      />
                    </div>
                    {reviewMessage && <p className="mt-3 text-xs text-[#984667]">{reviewMessage}</p>}
                    <div className="mt-5 flex gap-3">
                      <button type="button" onClick={function () { submitReview() }} disabled={reviewSubmitting} className="rounded-full bg-[#984667] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50">
                        {reviewSubmitting ? 'Submitting...' : 'Submit review'}
                      </button>
                      <button type="button" onClick={function () { setReviewingId('') }} className="text-sm text-[#5f5157]">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-7 space-y-4">
                  {recordsLoading && <p>Loading appointments...</p>}
                  {!recordsLoading && bookings.length === 0 && <p className="text-sm text-[#5f5157]">You have no appointments yet.</p>}
                  {!recordsLoading && bookings.map(function (booking) {
                    return (
                      <article key={booking.id} className="grid gap-3 rounded-2xl bg-[#fff9fb] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <h3 className="font-serif text-xl text-[#1d171a]">{booking.serviceName}</h3>
                          <p className="mt-2 text-sm text-[#5f5157]">
                            {new Date(booking.date).toLocaleDateString()} - {booking.timeSlot}
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-[#e7cbd7] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#984667]">
                          {booking.status}
                        </span>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="font-serif text-3xl text-[#1d171a]">My orders</h2>
                <div className="mt-7 space-y-4">
                  {recordsLoading && <p>Loading orders...</p>}
                  {!recordsLoading && orders.length === 0 && <p className="text-sm text-[#5f5157]">You have no orders yet.</p>}
                  {!recordsLoading && orders.map(function (order) {
                    const itemsText = order.items.map(function (item) {
                      return item.quantity + ' x ' + item.name
                    }).join(', ')
                    return (
                      <article key={order.id} className="rounded-2xl border border-[#d9c7cf] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-[#937781]">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                            <p className="mt-1 font-serif text-xl text-[#1d171a]">
                              GHC {Number(order.totalAmount).toLocaleString()}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#e7cbd7] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#984667]">
                            {order.status.replaceAll('_', ' ')}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-[#5f5157]">{itemsText}</p>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="font-serif text-3xl text-[#1d171a]">Change password</h2>
                <form onSubmit={savePassword} className="mt-7 max-w-xl space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">Current password</span>
                    <input required name="currentPassword" type="password" minLength={6} autoComplete="current-password" className="h-13 w-full rounded-xl border border-[#cdb8c1] px-4 outline-none focus:border-[#984667]" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">New password</span>
                    <input required name="newPassword" type="password" minLength={6} autoComplete="new-password" className="h-13 w-full rounded-xl border border-[#cdb8c1] px-4 outline-none focus:border-[#984667]" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">Confirm new password</span>
                    <input required name="confirmPassword" type="password" minLength={6} autoComplete="new-password" className="h-13 w-full rounded-xl border border-[#cdb8c1] px-4 outline-none focus:border-[#984667]" />
                  </label>
                  <button type="submit" disabled={busy} className="rounded-full bg-[#984667] px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50">
                    {busy ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              </div>
            )}

            {(message || recordsError) && (
              <p role="status" className="mt-6 rounded-xl bg-[#f3e3ea] px-4 py-3 text-sm text-[#7a4258]">
                {message || recordsError}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
