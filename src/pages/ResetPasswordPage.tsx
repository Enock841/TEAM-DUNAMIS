import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'

function tokenFromHash() {
  const query = window.location.hash.split('?')[1] || ''
  return new URLSearchParams(query).get('token') || ''
}

const strongPassword = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export function ResetPasswordPage() {
  const token = tokenFromHash()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const result = await api.forgotPassword(String(form.get('identifier')).trim())
      setSuccess(result.message)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send the reset link.')
    } finally {
      setBusy(false)
    }
  }

  async function chooseNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    const confirm = String(form.get('confirm'))
    if (!strongPassword.test(password)) {
      setError('Password needs at least 8 characters, including a letter and a number.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const result = await api.resetPassword(token, password)
      setSuccess(result.message)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to change the password.')
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'h-13 w-full rounded-xl border border-[#d99eb7] bg-white px-4 outline-none focus:border-[#d92c83]'
  const labelClass = 'mb-2 block text-xs font-bold uppercase tracking-[0.12em]'

  return (
    <main className="flex min-h-[620px] items-center justify-center bg-[#f9e8ef] px-5 py-14">
      <section className="relative w-full max-w-md rounded-[2rem] border border-[#e7b9cd] bg-[#f8d7e5] p-7 shadow-2xl sm:p-9">
        <a
          href="#/"
          aria-label="Close"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/45 text-2xl text-[#4d2838]"
        >
          x
        </a>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d92c83]">Client account</p>
        <h1 className="mt-3 font-serif text-4xl text-[#3e2530]">
          {token ? 'Choose a new password' : 'Forgot your password?'}
        </h1>

        {success ? (
          <div className="mt-6">
            <p className="rounded-xl bg-white/60 px-4 py-3 text-sm leading-6 text-[#4d2838]" role="status">
              {success}
            </p>
            <a
              href="#/"
              className="mt-5 inline-block text-sm font-semibold text-[#9f205f] underline underline-offset-4"
            >
              Back to the website
            </a>
          </div>
        ) : token ? (
          <form onSubmit={chooseNewPassword} className="mt-6 space-y-4">
            <label className="block">
              <span className={labelClass}>New password</span>
              <input required name="password" type="password" minLength={8} autoComplete="new-password" className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Confirm new password</span>
              <input required name="confirm" type="password" minLength={8} autoComplete="new-password" className={inputClass} />
            </label>
            <p className="text-xs leading-5 text-[#765c68]">At least 8 characters, including a letter and a number.</p>
            <button
              type="submit"
              disabled={busy}
              className="min-h-13 w-full rounded-full bg-[#d92c83] px-6 py-3 font-serif text-xl font-bold text-white transition hover:bg-[#b92068] disabled:opacity-60"
            >
              {busy ? 'Please wait...' : 'Save new password'}
            </button>
          </form>
        ) : (
          <form onSubmit={requestLink} className="mt-6 space-y-4">
            <p className="text-sm leading-6 text-[#765c68]">
              Enter the email or phone number on your account and we will email you a link to choose a new password.
            </p>
            <label className="block">
              <span className={labelClass}>Email or phone number</span>
              <input required name="identifier" type="text" autoComplete="username" className={inputClass} />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="min-h-13 w-full rounded-full bg-[#d92c83] px-6 py-3 font-serif text-xl font-bold text-white transition hover:bg-[#b92068] disabled:opacity-60"
            >
              {busy ? 'Please wait...' : 'Send reset link'}
            </button>
            <p className="text-xs leading-5 text-[#765c68]">
              Check your spam or junk folder if the email does not arrive within a few minutes.
            </p>
          </form>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-white/50 px-4 py-3 text-sm text-[#8b3157]" role="alert">
            {error}
          </p>
        )}
        {!success && (
          <a href="#/" className="mt-5 mr-5 inline-block text-sm font-semibold text-[#9f205f] underline underline-offset-4">
            Back to the website
          </a>
        )}
        {token && !success && (
          <a href="#/reset-password" className="mt-5 inline-block text-sm font-semibold text-[#9f205f] underline underline-offset-4">
            Link expired? Request a new one
          </a>
        )}
      </section>
    </main>
  )
}