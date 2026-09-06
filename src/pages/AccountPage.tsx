import { useEffect, useState, type FormEvent } from 'react'
import { useAppData } from '../context/appData'
import {
  api,
  type CustomerBooking,
  type CustomerOrder,
  type ReviewableBooking,
  type ReviewableOrder,
  type WishlistItem,
} from '../lib/api'
import { productImage } from '../data/catalog'
import { ReviewMediaField } from '../components/ReviewMediaField'
import { ImageUploadField } from '../admin/components/ImageUploadField'

type AccountPageProps = {
  onRequireAuth: () => void
  onAdd: (product: any) => void
}

const tabs = [
  ['profile', 'Profile'],
  ['bookings', 'Appointments'],
  ['orders', 'Orders'],
  ['wishlist', 'Wishlist'],
  ['security', 'Security'],
]

const ratingLabels = {
  1: 'Awful',
  2: 'Not good',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
}

function ReviewForm(props) {
  return (
    <div className="mt-5 rounded-2xl border border-[#ead4de] bg-white p-5">
      <p className="font-serif text-xl text-[#3e2530]">Share your experience with {props.reviewingLabel}</p>
      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(function (n) {
          const starClass = n <= props.rating ? 'text-[#dc2d83]' : 'text-[#e6d3da]'
          return (
            <button
              key={n}
              type="button"
              onClick={function () { props.setRating(n) }}
              aria-label={n + ' star' + (n === 1 ? '' : 's')}
              className={starClass + ' text-2xl leading-none transition hover:scale-110'}
            >
              &#9733;
            </button>
          )
        })}
        {props.rating > 0 && (
          <span className="ml-2 text-sm font-semibold text-[#745f68]">{ratingLabels[props.rating]}</span>
        )}
      </div>
      <textarea
        value={props.comment}
        onChange={function (e) { props.setComment(e.target.value) }}
        placeholder="Optional, tell us how it went in more detail"
        className="mt-4 h-24 w-full rounded-xl border border-[#dfbdcb] p-3 text-sm outline-none focus:border-[#dc2d83]"
      />
      <div className="mt-4">
        <ReviewMediaField
          onChange={function (url, type) {
            props.setMediaUrl(url)
            props.setMediaType(type)
          }}
        />
      </div>
      {props.reviewMessage && <p className="mt-3 text-xs text-[#b32269]">{props.reviewMessage}</p>}
      <div className="mt-5 flex gap-3">
        <button type="button" onClick={function () { props.submitReview() }} disabled={props.reviewSubmitting} className="rounded-full bg-[#dc2d83] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50">
          {props.reviewSubmitting ? 'Submitting...' : 'Submit review'}
        </button>
        <button type="button" onClick={function () { props.setReviewingId('') }} className="text-sm text-[#745f68]">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function AccountPage(props) {
  const onAdd = props.onAdd
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

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [bookings, setBookings] = useState<CustomerBooking[]>([])
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [reviewableBookings, setReviewableBookings] = useState<ReviewableBooking[]>([])
  const [reviewableOrders, setReviewableOrders] = useState<ReviewableOrder[]>([])
  const [recordsLoading, setRecordsLoading] = useState(Boolean(token))
  const [recordsError, setRecordsError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const [reviewingId, setReviewingId] = useState('')
  const [reviewingType, setReviewingType] = useState<'booking' | 'order'>('booking')
  const [reviewingLabel, setReviewingLabel] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState<'photo' | 'video' | undefined>(undefined)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')

  function loadRecords() {
    if (!token) return
    setRecordsLoading(true)
    Promise.all([api.myBookings(token), api.myOrders(token), api.myReviewable(token)])
      .then(function (results) {
        setBookings(results[0])
        setOrders(results[1])
        setReviewableBookings(results[2].bookings)
        setReviewableOrders(results[2].orders)
      })
      .catch(function (err) {
        setRecordsError(err instanceof Error ? err.message : 'Unable to load your account.')
      })
      .finally(function () {
        setRecordsLoading(false)
      })
  }

  useEffect(function () {
    loadRecords()
  }, [token])

  useEffect(function () {
    if (!token || activeTab !== 'wishlist') return
    setWishlistLoading(true)
    api.wishlist(token)
      .then(setWishlistItems)
      .catch(function () {})
      .finally(function () { setWishlistLoading(false) })
  }, [token, activeTab])

  async function removeWishlistItem(productId) {
    if (!token) return
    try {
      await api.removeFromWishlist(token, productId)
      setWishlistItems(function (items) { return items.filter(function (item) { return item.id !== productId }) })
    } catch {}
  }

  const [payingId, setPayingId] = useState('')
  const [payMessage, setPayMessage] = useState('')

  async function payForBooking(bookingId) {
    if (!token) return
    setPayingId(bookingId)
    setPayMessage('')
    try {
      const payment = await api.initiatePayment(token, {
        type: 'booking',
        refId: bookingId,
        momoNumber: user.phone,
      })
      window.location.href = payment.authorizationUrl
    } catch (err) {
      setPayMessage(err instanceof Error ? err.message : 'Unable to start payment.')
      setPayingId('')
    }
  }

  function openReview(id, type, label) {
    setReviewingId(id)
    setReviewingType(type)
    setReviewingLabel(label)
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
        bookingId: reviewingType === 'booking' ? reviewingId : undefined,
        orderId: reviewingType === 'order' ? reviewingId : undefined,
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

  const [avatarUrl, setAvatarUrl] = useState(user ? user.avatarUrl || '' : '')

  async function saveProfile(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await updateProfile(String(form.get('name')), String(form.get('phone')), avatarUrl || undefined)
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
      <main className="min-h-[620px] bg-[#fffaf8] px-6 py-20 text-center">
        <p>Checking your account...</p>
      </main>
    )
  }

  if (!token || !user) {
    return (
      <main className="flex min-h-[620px] items-center bg-[#fffaf8] px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d92c83]">Client account</p>
          <h1 className="mt-4 font-serif text-5xl text-[#3e2530]">Sign in to continue</h1>
          <p className="mt-5 text-base leading-8 text-[#745f68]">
            View your appointments, orders and account settings after signing in.
          </p>
          <button type="button" onClick={onRequireAuth} className="mt-8 rounded-full bg-[#dc2d83] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white">
            Sign in or register
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[720px] bg-[#fffaf8] px-5 py-12 sm:px-10 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d92c83]">Client account</p>
          <h1 className="mt-3 font-serif text-5xl text-[#3e2530]">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="mt-3 text-sm text-[#745f68]">Manage your details and review your activity.</p>
        </div>

        <div className="mt-9 grid gap-8 lg:grid-cols-[240px_1fr]">
          <nav aria-label="Account sections" className="flex gap-2 overflow-x-auto lg:flex-col">
            {tabs.map(function (tab) {
              const value = tab[0]
              const label = tab[1]
              const linkHref = '#/account?tab=' + value
              const linkClass = activeTab === value
                ? 'shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition bg-[#4b2637] text-white'
                : 'shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition border border-[#ead4de] bg-white text-[#604c55] hover:border-[#d92c83]'
              return (
                <a key={value} href={linkHref} className={linkClass}>
                  {label}
                </a>
              )
            })}
          </nav>

          <section className="rounded-[1.75rem] border border-[#ead4de] bg-white p-6 shadow-[0_16px_50px_rgba(76,35,53,0.06)] sm:p-9">
            {activeTab === 'profile' && (
              <div>
                <h2 className="font-serif text-3xl text-[#3e2530]">Profile details</h2>
                <form onSubmit={saveProfile} className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    {avatarUrl && (
                      <img src={avatarUrl} alt="" className="mb-3 h-20 w-20 rounded-full object-cover" />
                    )}
                    <ImageUploadField label="Profile picture" value={avatarUrl} onChange={setAvatarUrl} />
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">Full name</span>
                    <input required name="name" minLength={2} defaultValue={user.name} autoComplete="name" className="h-13 w-full rounded-xl border border-[#dfbdcb] px-4 outline-none focus:border-[#dc2d83]" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">Phone number</span>
                    <input required name="phone" type="tel" minLength={7} maxLength={20} defaultValue={user.phone} autoComplete="tel" className="h-13 w-full rounded-xl border border-[#dfbdcb] px-4 outline-none focus:border-[#dc2d83]" />
                  </label>
                  <button type="submit" disabled={busy} className="w-fit rounded-full bg-[#dc2d83] px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50 sm:col-span-2">
                    {busy ? 'Saving...' : 'Save changes'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h2 className="font-serif text-3xl text-[#3e2530]">My appointments</h2>

                {reviewableBookings.length > 0 && (
                  <div className="mt-7 rounded-2xl border border-dashed border-[#dc2d83] bg-[#fff7fa] p-5">
                    <p className="text-sm font-semibold text-[#3e2530]">
                      You have {reviewableBookings.length} completed appointment(s) you can review
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {reviewableBookings.map(function (item) {
                        return (
                          <button key={item.bookingId} type="button" onClick={function () { openReview(item.bookingId, 'booking', item.serviceName) }} className="rounded-full bg-[#dc2d83] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white">
                            Review {item.serviceName}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {reviewingId && reviewingType === 'booking' && (
                  <ReviewForm
                    reviewingLabel={reviewingLabel}
                    rating={rating}
                    setRating={setRating}
                    comment={comment}
                    setComment={setComment}
                    setMediaUrl={setMediaUrl}
                    setMediaType={setMediaType}
                    reviewMessage={reviewMessage}
                    reviewSubmitting={reviewSubmitting}
                    submitReview={submitReview}
                    setReviewingId={setReviewingId}
                  />
                )}

                <div className="mt-7 space-y-4">
                  {recordsLoading && <p>Loading appointments...</p>}
                  {!recordsLoading && bookings.length === 0 && <p className="text-sm text-[#745f68]">You have no appointments yet.</p>}
                  {!recordsLoading && bookings.map(function (booking) {
                    return (
                      <article key={booking.id} className="grid gap-3 rounded-2xl bg-[#fff6f9] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <h3 className="font-serif text-xl text-[#3e2530]">{booking.serviceName}</h3>
                          <p className="mt-2 text-sm text-[#745f68]">
                            {new Date(booking.date).toLocaleDateString()} - {booking.timeSlot}
                          </p>
                          {booking.confirmationCode && (
                            <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#3e2530]">
                              Your code: <span className="tracking-[0.2em] text-[#dc2d83]">{booking.confirmationCode}</span>
                            </p>
                          )}
                          {booking.customLengthStatus === 'approved' && (
                            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                              Your requested style was approved at GHC {booking.customLengthPrice}
                            </p>
                          )}
                          {booking.customLengthRequest && booking.customLengthStatus !== 'approved' && (
                            <p className="mt-3 rounded-lg bg-[#fdf2e0] px-3 py-2 text-xs font-bold text-[#8a5a1f]">
                              Your requested style is being reviewed, we will confirm a price soon.
                            </p>
                          )}
                          {booking.status === 'confirmed' && !booking.isPaid && booking.confirmedPrice && !booking.amountPaid && (
                            <button
                              type="button"
                              onClick={function () { payForBooking(booking.id) }}
                              disabled={payingId === booking.id}
                              className="mt-3 rounded-full bg-[#dc2d83] px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                            >
                              {payingId === booking.id ? 'Redirecting...' : 'Pay deposit, GHC ' + (booking.confirmedPrice / 2) + ' of ' + booking.confirmedPrice}
                            </button>
                          )}
                          {booking.status === 'confirmed' && !booking.isPaid && booking.confirmedPrice && !booking.amountPaid && (
                            <p className="mt-2 text-xs leading-5 text-[#8f707d]">
                              Only half of the total is paid online, right now. The remaining half is paid directly at the salon on the day of your appointment.
                            </p>
                          )}
                          {booking.status === 'confirmed' && !booking.isPaid && booking.confirmedPrice && booking.amountPaid > 0 && (
                            <p className="mt-3 rounded-lg bg-[#fdf2e0] px-3 py-2 text-xs font-bold text-[#8a5a1f]">
                              Deposit paid. The remaining GHC {booking.confirmedPrice - booking.amountPaid} will be paid at the salon on the day of your appointment.
                            </p>
                          )}
                          {booking.status === 'confirmed' && !booking.isPaid && !booking.amountPaid && (
                            <p className="mt-2 text-xs leading-5 text-[#8f707d]">
                              This is a deposit, half of your total price. You will pay the remaining balance in person at the salon when your appointment happens.
                            </p>
                          )}
                          {booking.status === 'confirmed' && !booking.isPaid && !booking.confirmedPrice && (
                            <p className="mt-3 rounded-lg bg-[#fdf2e0] px-3 py-2 text-xs font-bold text-[#8a5a1f]">
                              Waiting for the salon to confirm your final price before you can pay
                            </p>
                          )}
                          {booking.isPaid && (
                            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                              Paid
                            </p>
                          )}
                        </div>
                        <span className="w-fit rounded-full bg-[#f5d5e3] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a82061]">
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
                <h2 className="font-serif text-3xl text-[#3e2530]">My orders</h2>

                {reviewableOrders.length > 0 && (
                  <div className="mt-7 rounded-2xl border border-dashed border-[#dc2d83] bg-[#fff7fa] p-5">
                    <p className="text-sm font-semibold text-[#3e2530]">
                      You have {reviewableOrders.length} delivered order(s) you can review
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {reviewableOrders.map(function (item) {
                        return (
                          <button key={item.orderId} type="button" onClick={function () { openReview(item.orderId, 'order', item.productNames) }} className="rounded-full bg-[#dc2d83] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white">
                            Review {item.productNames}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {reviewingId && reviewingType === 'order' && (
                  <ReviewForm
                    reviewingLabel={reviewingLabel}
                    rating={rating}
                    setRating={setRating}
                    comment={comment}
                    setComment={setComment}
                    setMediaUrl={setMediaUrl}
                    setMediaType={setMediaType}
                    reviewMessage={reviewMessage}
                    reviewSubmitting={reviewSubmitting}
                    submitReview={submitReview}
                    setReviewingId={setReviewingId}
                  />
                )}

                <div className="mt-7 space-y-4">
                  {recordsLoading && <p>Loading orders...</p>}
                  {!recordsLoading && orders.length === 0 && <p className="text-sm text-[#745f68]">You have no orders yet.</p>}
                  {!recordsLoading && orders.map(function (order) {
                    const itemsText = order.items.map(function (item) {
                      return item.quantity + ' x ' + item.name
                    }).join(', ')
                    return (
                      <article key={order.id} className="rounded-2xl border border-[#eadbe1] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-[#937781]">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                            <p className="mt-1 font-serif text-xl text-[#3e2530]">
                              GHC {Number(order.totalAmount).toLocaleString()}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#f5d5e3] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a82061]">
                            {order.status.replaceAll('_', ' ')}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-[#745f68]">{itemsText}</p>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <h2 className="font-serif text-3xl text-[#3e2530]">My wishlist</h2>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {wishlistLoading && <p>Loading your wishlist...</p>}
                  {!wishlistLoading && wishlistItems.length === 0 && (
                    <p className="text-sm text-[#745f68] sm:col-span-2">
                      Nothing saved yet, tap the heart on any product to save it here.
                    </p>
                  )}
                  {!wishlistLoading && wishlistItems.map(function (item) {
                    return (
                      <article key={item.id} className="flex gap-4 rounded-2xl border border-[#eadbe1] p-4">
                        <img src={productImage(item)} alt="" className="h-20 w-20 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <a href={'#/product?id=' + item.id} className="font-serif text-lg text-[#3e2530] hover:text-[#dc2d83]">
                            {item.name}
                          </a>
                          <p className="mt-1 text-sm font-semibold text-[#b32269]">GHC {item.price.toLocaleString()}</p>
                          <div className="mt-3 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={function () { onAdd(item) }}
                              className="rounded-full bg-[#dc2d83] px-4 py-2 text-xs font-bold uppercase text-white"
                            >
                              Add to bag
                            </button>
                            <button
                              type="button"
                              onClick={function () { removeWishlistItem(item.id) }}
                              className="text-xs font-bold text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="font-serif text-3xl text-[#3e2530]">Change password</h2>
                <form onSubmit={savePassword} className="mt-7 max-w-xl space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">Current password</span>
                    <input required name="currentPassword" type="password" minLength={6} autoComplete="current-password" className="h-13 w-full rounded-xl border border-[#dfbdcb] px-4 outline-none focus:border-[#dc2d83]" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">New password</span>
                    <input required name="newPassword" type="password" minLength={6} autoComplete="new-password" className="h-13 w-full rounded-xl border border-[#dfbdcb] px-4 outline-none focus:border-[#dc2d83]" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">Confirm new password</span>
                    <input required name="confirmPassword" type="password" minLength={6} autoComplete="new-password" className="h-13 w-full rounded-xl border border-[#dfbdcb] px-4 outline-none focus:border-[#dc2d83]" />
                  </label>
                  <button type="submit" disabled={busy} className="rounded-full bg-[#dc2d83] px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50">
                    {busy ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              </div>
            )}

            {(message || recordsError) && (
              <p role="status" className="mt-6 rounded-xl bg-[#f8e7ee] px-4 py-3 text-sm text-[#7a4258]">
                {message || recordsError}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}