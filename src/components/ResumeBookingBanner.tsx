import { useEffect, useState } from 'react'

export function ResumeBookingBanner() {
  const [serviceId, setServiceId] = useState(null)

  useEffect(function () {
    function check() {
      setServiceId(sessionStorage.getItem('resumeBookingService'))
    }
    check()
    window.addEventListener('hashchange', check)
    return function () {
      window.removeEventListener('hashchange', check)
    }
  }, [])

  if (!serviceId) return null

  function resume() {
    sessionStorage.removeItem('resumeBookingService')
    window.location.hash = '#/appointments?service=' + serviceId + '&hasExtension=1'
  }

  function dismiss() {
    sessionStorage.removeItem('resumeBookingService')
    setServiceId(null)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] bg-[#1d171a] px-4 py-3 text-white shadow-[0_-10px_25px_rgba(0,0,0,0.15)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="text-xs sm:text-sm">Got your extensions? Continue your booking.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resume}
            className="rounded-full bg-[#984667] px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white"
          >
            Continue booking
          </button>
          <button type="button" onClick={dismiss} className="text-xs text-white/60 underline">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}