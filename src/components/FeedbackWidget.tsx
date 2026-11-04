import { useState } from 'react'
import { useAppData } from '../context/appData'
import { api } from '../lib/api'

const labels = ['Poor', 'Not great', 'Okay', 'Good', 'Love it']

export function FeedbackWidget() {
  const { user, token } = useAppData()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function close() {
    setOpen(false)
    if (sent) {
      setSent(false)
      setRating(0)
      setMessage('')
      setName('')
      setContact('')
    }
    setError('')
  }

  async function submit() {
    if (!rating) {
      setError('Please tap a star to rate your experience.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.submitFeedback(
        {
          rating,
          message: message.trim() || undefined,
          name: user ? undefined : name.trim() || undefined,
          contact: user ? undefined : contact.trim() || undefined,
          page: window.location.hash.slice(0, 80) || undefined,
        },
        token,
      )
      setSent(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send your feedback.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-30 rounded-full bg-[#dc2d83] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg transition hover:bg-[#c2246f]"
        aria-label="Give feedback"
      >
        Feedback
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Give feedback"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#fffaf8] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-2xl text-[#3e2530]">
                {sent ? 'Thank you!' : 'How are you enjoying the app?'}
              </h2>
              <button type="button" onClick={close} className="text-sm font-semibold text-[#816873] underline" aria-label="Close feedback">
                Close
              </button>
            </div>
            {sent ? (
              <p className="mt-4 text-sm leading-6 text-[#745f68]">
                Your feedback has been sent to Beryl. We really appreciate you taking the time.
              </p>
            ) : (
              <div className="mt-4 grid gap-4">
                <div>
                  <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map(function (value) {
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={rating === value}
                          aria-label={value + ' star' + (value === 1 ? '' : 's') + ', ' + labels[value - 1]}
                          onClick={() => setRating(value)}
                          className={'text-4xl leading-none transition ' + (value <= rating ? 'text-[#e8a317]' : 'text-[#dccbd2]')}
                        >
                          &#9733;
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1 h-5 text-xs font-semibold text-[#8a5a1f]">{rating ? labels[rating - 1] : ''}</p>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  placeholder="Tell us what you like or what we can do better (optional)"
                  className="h-28 rounded-xl border border-[#dfbdcb] bg-white p-3 text-sm outline-none focus:border-[#dc2d83]"
                />
                {!user && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={80}
                      placeholder="Your name (optional)"
                      className="h-11 rounded-xl border border-[#dfbdcb] bg-white px-3 text-sm outline-none focus:border-[#dc2d83]"
                    />
                    <input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      maxLength={120}
                      placeholder="Phone or email (optional)"
                      className="h-11 rounded-xl border border-[#dfbdcb] bg-white px-3 text-sm outline-none focus:border-[#dc2d83]"
                    />
                  </div>
                )}
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700" role="alert">{error}</p>}
                <button
                  type="button"
                  disabled={busy}
                  onClick={submit}
                  className="rounded-full bg-[#dc2d83] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-60"
                >
                  {busy ? 'Sending...' : 'Send feedback'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
