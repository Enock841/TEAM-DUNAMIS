import { useState, type FormEvent } from 'react'
import { useAppData } from '../context/appData'

type AuthPanelProps = {
  open: boolean
  onClose: () => void
}

export function AuthPanel({ open, onClose }: AuthPanelProps) {
  const { login, register } = useAppData()
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (!open) return null

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)

    try {
      if (mode === 'login') {
        await login(String(form.get('phone')), String(form.get('password')))
      } else {
        const password = String(form.get('password'))
        if (password !== confirmPassword) {
          setMessage('Passwords do not match.')
          setBusy(false)
          return
        }
        await register(
          String(form.get('name')),
          String(form.get('phone')),
          password,
          String(form.get('email') || ''),
          String(form.get('area') || ''),
        )
      }
      onClose()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24131b]/60 px-5 py-10 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative w-full max-w-md rounded-[2rem] border border-[#e7b9cd] bg-[#f8d7e5] p-7 shadow-2xl sm:p-9"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close account panel"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/45 text-2xl text-[#4d2838]"
        >
          x
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#984667]">
          Client account
        </p>
        <h2 id="auth-title" className="mt-3 font-serif text-4xl text-[#1d171a]">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#765c68]">
          {mode === 'login'
            ? 'Access bookings, order history and saved services.'
            : 'Create your profile for faster bookings and personalised care.'}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">
                Full name
              </span>
              <input
                required
                name="name"
                minLength={2}
                autoComplete="name"
                className="h-13 w-full rounded-xl border border-[#d99eb7] bg-white px-4 outline-none focus:border-[#984667]"
              />
            </label>
          )}
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">
                Email
              </span>
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                className="h-13 w-full rounded-xl border border-[#d99eb7] bg-white px-4 outline-none focus:border-[#984667]"
              />
            </label>
          )}
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">
                Area or neighbourhood, optional
              </span>
              <input
                name="area"
                type="text"
                placeholder="e.g. Ayeduase, Bantama"
                className="h-13 w-full rounded-xl border border-[#d99eb7] bg-white px-4 outline-none focus:border-[#984667]"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">
              Phone number
            </span>
            <input
              required
              name="phone"
              type="tel"
              pattern={mode === 'signup' ? '(0|\\+233)[0-9]{9}' : undefined}
              title={mode === 'signup' ? 'Enter a valid Ghanaian number, e.g. 024 123 4567' : undefined}
              placeholder="024 123 4567"
              minLength={7}
              maxLength={20}
              autoComplete="tel"
              className="h-13 w-full rounded-xl border border-[#d99eb7] bg-white px-4 outline-none focus:border-[#984667]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">
              Password
            </span>
            <input
              required
              name="password"
              type="password"
              minLength={mode === 'signup' ? 8 : 6}
              pattern={mode === 'signup' ? '(?=.*[A-Za-z])(?=.*\\d).{8,}' : undefined}
              title={mode === 'signup' ? 'At least 8 characters, including a letter and a number' : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="h-13 w-full rounded-xl border border-[#d99eb7] bg-white px-4 outline-none focus:border-[#984667]"
            />
          </label>
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em]">
                Confirm password
              </span>
              <input
                required
                name="confirmPassword"
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-13 w-full rounded-xl border border-[#d99eb7] bg-white px-4 outline-none focus:border-[#984667]"
              />
            </label>
          )}
          <button
            type="submit"
            disabled={busy}
            className="min-h-13 w-full rounded-full bg-[#984667] px-6 py-3 font-serif text-xl font-bold text-white transition hover:bg-[#71334f] disabled:opacity-60"
          >
            {busy
              ? 'Please waitÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦'
              : mode === 'login'
                ? 'Login'
                : 'Create account'}
          </button>
        </form>

        {message && (
          <p
            className="mt-4 rounded-xl bg-white/50 px-4 py-3 text-sm text-[#8b3157]"
            role="alert"
          >
            {message}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setMessage('')
          }}
          className="mt-5 text-sm font-semibold text-[#9f205f] underline underline-offset-4"
        >
          {mode === 'login'
            ? 'Create a client account'
            : 'I already have an account'}
        </button>
      </section>
    </div>
  )
}