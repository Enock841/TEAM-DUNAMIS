import { type FormEvent, useEffect, useState } from 'react'
import { api } from '../lib/api'

export function Footer() {
  const [info, setInfo] = useState(null)
  const [email, setEmail] = useState('')
  const [signupState, setSignupState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [signupMessage, setSignupMessage] = useState('')

  useEffect(function () {
    let cancelled = false
    api.businessInfo().then(function (data) {
      if (!cancelled) setInfo(data)
    })
    return function () {
      cancelled = true
    }
  }, [])

  async function handleNewsletterSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSignupState('submitting')
    setSignupMessage('')

    try {
      const result = await api.newsletterSubscribe(email)
      setSignupState('success')
      setSignupMessage(result.message)
      setEmail('')
    } catch (error) {
      setSignupState('error')
      setSignupMessage(error instanceof Error ? error.message : 'Unable to sign you up right now.')
    }
  }

  return (
    <footer className="border-t border-[#1d171a] bg-[#c992aa] text-[#1d171a]">
      <section className="campaign-grid border-b border-[#1d171a]/20 px-6 py-14 sm:px-10 lg:px-12 lg:py-20">
        <div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <p className="editorial-kicker text-[#6f354f]">
              Stay updated
            </p>
            <h2 className="mt-3 font-serif text-5xl font-light uppercase leading-[0.9] sm:text-6xl">
              New arrivals, hair-care notes and available appointment dates.
            </h2>
          </div>
          <div className="-mx-3 w-[calc(100%+1.5rem)] max-w-lg sm:mx-0 sm:w-full">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={handleNewsletterSignup}
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (signupState !== 'idle') {
                    setSignupState('idle')
                    setSignupMessage('')
                  }
                }}
                placeholder="Email address"
                disabled={signupState === 'submitting'}
                className="h-13 w-full flex-1 border border-[#1d171a] bg-transparent px-5 text-sm text-[#1d171a] outline-none placeholder:text-[#4f3e46] focus:bg-white/25 disabled:cursor-wait disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={signupState === 'submitting'}
                className="h-13 shrink-0 border border-[#1d171a] bg-[#1d171a] px-8 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#984667] disabled:cursor-wait disabled:opacity-70"
              >
                {signupState === 'submitting' ? 'Signing up...' : 'Sign up'}
              </button>
            </form>
            <p
              className={`mt-3 min-h-5 text-sm ${
                signupState === 'error' ? 'text-[#7f173f]' : 'text-[#4f3e46]'
              }`}
              role="status"
              aria-live="polite"
            >
              {signupMessage}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1480px] grid-cols-2 gap-x-8 gap-y-12 px-6 py-14 sm:px-10 lg:grid-cols-4 lg:gap-x-10 lg:px-12">
        <div className="col-span-2 lg:col-span-1">
          <h2 className="font-serif text-5xl font-light uppercase tracking-[0.08em]">
            Beryl's
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-7 text-[#4f3e46]">
            Quality raw hair, ready-to-wear wigs and professional salon services in Kumasi.
          </p>
        </div>

        <div>
          <p className="h-px w-8 bg-[#1d171a]" />
          <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#d9abbf]">
            Visit
          </h3>
          <address className="mt-5 text-sm not-italic leading-8 text-white/60">
            {info ? info.address : 'Ayeduase Newsite, Kumasi, Ghana'}
            <br />
            By appointment only
          </address>
        </div>

        <nav>
          <p className="h-px w-8 bg-[#1d171a]" />
          <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#d9abbf]">
            Explore
          </h3>
          <div className="mt-5 grid gap-3.5 text-sm text-[#4f3e46]">
            <a href="#/shop" className="w-fit transition hover:text-white">Shop</a>
            <a href="#/services" className="w-fit transition hover:text-white">Services</a>
            <a href="#/appointments" className="w-fit transition hover:text-white">Appointments</a>
          </div>
        </nav>

        <nav className="col-span-2 lg:col-span-1">
          <p className="h-px w-8 bg-[#1d171a]" />
          <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#d9abbf]">
            Information
          </h3>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5 text-sm text-[#4f3e46] lg:grid-cols-1">
            <a href="#/about" className="w-fit transition hover:text-white">About</a>
            <a href="#/reviews" className="w-fit transition hover:text-white">Reviews</a>
            <a href="#/privacy" className="w-fit transition hover:text-white">Privacy policy</a>
            <a href="#/faqs" className="w-fit transition hover:text-white">FAQs</a>
            <a href="#/terms" className="w-fit transition hover:text-white">Terms of service</a>
            <a href={info ? "tel:" + info.phone.replace(/\s/g, "") : "tel:0591911212"} className="w-fit transition hover:text-white">{info ? info.phone : "059 191 1212"}</a>
              <a
              href="#/staff-login"
              className="col-span-2 mt-3 w-fit border-t border-white/10 pt-4 font-semibold text-[#d9abbf] transition hover:text-white lg:col-span-1"
            >
              Staff Portal
            </a>
          </div>
        </nav>
      </div>

      <div className="border-t border-[#1d171a]/20 px-6 py-6 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-[#4f3e46]">
        © 2026 Beryl&apos;s Beauty Mark. All rights reserved.
      </div>
    </footer>
  )
}
