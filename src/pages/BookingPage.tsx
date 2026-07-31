import { useEffect, useMemo, useState } from 'react'
import { useAppData } from '../context/appData'
import { formatDuration } from '../data/catalog'
import { api } from '../lib/api'
import { ImageUploadField } from '../admin/components/ImageUploadField'

const times = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM']

export function BookingPage(props) {
  const onRequireAuth = props.onRequireAuth
  const onAdd = props.onAdd
  const appData = useAppData()
  const services = appData.services
  const catalogLoading = appData.catalogLoading
  const catalogError = appData.catalogError
  const token = appData.token
  const user = appData.user

  const serviceFromHash = new URLSearchParams(
    window.location.hash.split('?')[1],
  ).get('service')

  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(serviceFromHash || '')
  const [hasOwnExtension, setHasOwnExtension] = useState(null)
  const [wantsToBuyExtension, setWantsToBuyExtension] = useState(null)
  const [extensionProducts, setExtensionProducts] = useState([])
  const [extensionsLoading, setExtensionsLoading] = useState(false)
  const [addedExtensionId, setAddedExtensionId] = useState(null)
  const [lengthOptions, setLengthOptions] = useState([])
  const [selectedLength, setSelectedLength] = useState(null)
  const [referenceImageUrl, setReferenceImageUrl] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availability, setAvailability] = useState(null)
  const [momoNumber, setMomoNumber] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const dates = useMemo(function () {
    return Array.from({ length: 5 }, function (_, index) {
      const date = new Date()
      date.setDate(date.getDate() + index + 1)
      return {
        iso: date.toISOString().slice(0, 10),
        day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        date: date.toLocaleDateString('en-GB', { day: '2-digit' }),
      }
    })
  }, [])

  const activeService = useMemo(function () {
    return services.find(function (service) { return service.id === selectedService })
  }, [selectedService, services])

  useEffect(function () {
    if (wantsToBuyExtension !== true) return
    setExtensionsLoading(true)
    api.products().then(function (allProducts) {
      const extras = allProducts.filter(function (product) {
        return product.category === 'Extensions'
      })
      setExtensionProducts(extras)
      setExtensionsLoading(false)
    })
  }, [wantsToBuyExtension])

  function selectService(service) {
    setSelectedService(service.id)
    setHasOwnExtension(null)
    setWantsToBuyExtension(null)
    setExtensionProducts([])
    setAddedExtensionId(null)
    setSelectedDate('')
    setSelectedTime('')
    setAvailability(null)
    setSelectedLength(null)
    setLengthOptions([])
    api.serviceLengthOptions(service.id).then(function (options) {
      setLengthOptions(options)
    })
  }

  function addExtension(product) {
    onAdd(product)
    setAddedExtensionId(product.id)
  }

  async function chooseDate(date) {
    setSelectedDate(date)
    setSelectedTime('')
    setAvailability(null)
    setMessage('')
    if (!selectedService) return
    try {
      setAvailability(await api.availability(selectedService, date))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to check availability.')
    }
  }

  async function requestBooking() {
    if (!token) {
      setMessage('Sign in or create a client account to complete your booking.')
      onRequireAuth()
      return
    }

    setBusy(true)
    setMessage('')
    try {
      const result = await api.createBooking(token, {
        serviceId: selectedService,
        date: selectedDate,
        timeSlot: selectedTime,
        lengthLabel: selectedLength ? selectedLength.label : undefined,
        referenceImageUrl: referenceImageUrl || undefined,
      })

      if (momoNumber.trim()) {
        const payment = await api.initiatePayment(token, {
          type: 'booking',
          refId: result.booking.id,
          momoNumber: momoNumber.trim(),
        })
        window.location.href = payment.authorizationUrl
        return
      }
      setMessage('Your booking request was submitted. You can pay online from your account, or in the studio.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to request this booking.')
    } finally {
      setBusy(false)
    }
  }

  const extensionStepAnswered = hasOwnExtension === true || (hasOwnExtension === false && wantsToBuyExtension !== null)

  return (
    <main className="min-h-[760px] bg-[#f3e3ea] px-5 py-12 sm:px-10 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#984667]">Reserve your time</p>
          <h1 className="mt-4 font-serif text-[42px] leading-tight text-[#1d171a] sm:text-6xl">
            Book an appointment
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#5f5157]">
            Choose your service and preferred time. We will confirm every detail before your visit.
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center">
          {[1, 2, 3].map(function (item) {
            const circleClass = 'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ' +
              (step >= item ? 'bg-[#984667] text-white' : 'border border-[#c992aa] bg-white text-[#75636b]')
            const lineClass = 'h-px w-12 sm:w-24 ' + (step > item ? 'bg-[#984667]' : 'bg-[#c992aa]')
            return (
              <div key={item} className="flex items-center">
                <span className={circleClass}>{item}</span>
                {item < 3 && <span className={lineClass} />}
              </div>
            )
          })}
        </div>

        <section className="mt-9 rounded-[1.75rem] border border-[#d9c7cf] bg-[#fffdfd] p-5 shadow-[0_20px_55px_rgba(80,34,54,0.08)] sm:mt-10 sm:rounded-[2rem] sm:p-10">
          {step === 1 && (
            <div>
              <h2 className="font-serif text-3xl text-[#1d171a]">Select a service</h2>
              <p className="mt-2 text-sm text-[#5f5157]">Prices are supplied by the salon and shown as a range.</p>
              {catalogLoading && <p className="mt-7">Loading services...</p>}
              {catalogError && <p className="mt-7 text-[#8b435f]">{catalogError}</p>}

              <div className="mt-7 grid gap-3 md:grid-cols-2">
                {services.map(function (service) {
                  const selected = selectedService === service.id
                  const cardClass = selected
                    ? 'flex items-start justify-between gap-4 rounded-2xl border p-5 text-left transition border-[#984667] bg-[#fbe0eb] shadow-sm'
                    : 'flex items-start justify-between gap-4 rounded-2xl border p-5 text-left transition border-[#d9c7cf] bg-white hover:border-[#984667]'
                  return (
                    <button key={service.id} type="button" onClick={function () { selectService(service) }} className={cardClass}>
                      <span>
                        <span className="block font-serif text-lg text-[#1d171a]">{service.name}</span>
                        <span className="mt-1 block text-xs text-[#75636b]">
                          {service.category.name + ' - ' + formatDuration(service.durationMinutes)}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-sm font-bold text-[#984667]">
                        {'GHC ' + service.priceMin.toLocaleString() + ' - ' + service.priceMax.toLocaleString()}
                      </span>
                    </button>
                  )
                })}
              </div>

              {selectedService && lengthOptions.length > 0 && (
                <div className="mt-8 rounded-2xl border border-[#d9c7cf] bg-white p-6">
                  <p className="font-serif text-xl text-[#1d171a]">Choose your length</p>
                  <p className="mt-2 text-sm text-[#5f5157]">Pricing depends on the length you choose.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {lengthOptions.map(function (option) {
                      const selected = selectedLength && selectedLength.id === option.id
                      const optionClass = selected
                        ? 'flex items-center justify-between rounded-xl border p-4 text-left transition border-[#984667] bg-[#fbe0eb]'
                        : 'flex items-center justify-between rounded-xl border p-4 text-left transition border-[#d9c7cf] bg-white hover:border-[#984667]'
                      return (
                        <button key={option.id} type="button" onClick={function () { setSelectedLength(option) }} className={optionClass}>
                          <span className="font-semibold text-[#1d171a]">{option.label}</span>
                          <span className="text-sm font-bold text-[#984667]">
                            {'GHC ' + option.priceMin.toLocaleString() + ' - ' + option.priceMax.toLocaleString()}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedService && (
                <div className="mt-8 rounded-2xl border border-[#d9c7cf] bg-white p-6">
                  <p className="font-serif text-xl text-[#1d171a]">Have a reference picture?</p>
                  <p className="mt-2 text-sm text-[#5f5157]">
                    Optional, but a photo of the look you want helps the stylist a lot.
                  </p>
                  <div className="mt-4">
                    <ImageUploadField label="Reference photo" value={referenceImageUrl} onChange={setReferenceImageUrl} />
                  </div>
                </div>
              )}

              {selectedService && (
                <div className="mt-8 rounded-2xl border border-[#d9c7cf] bg-white p-6">
                  <p className="font-serif text-xl text-[#1d171a]">Are you bringing your own extension?</p>
                  <p className="mt-2 text-sm text-[#5f5157]">
                    If you already have your own hair or extensions, choose Yes.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={function () {
                        setHasOwnExtension(true)
                        setWantsToBuyExtension(null)
                      }}
                      className={
                        hasOwnExtension === true
                          ? 'rounded-full border border-[#984667] bg-[#984667] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white'
                          : 'rounded-full border border-[#984667] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#984667]'
                      }
                    >
                      Yes, I have my own
                    </button>
                    <button
                      type="button"
                      onClick={function () { setHasOwnExtension(false) }}
                      className={
                        hasOwnExtension === false
                          ? 'rounded-full border border-[#75636b] bg-[#75636b] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white'
                          : 'rounded-full border border-[#75636b] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#5f5157]'
                      }
                    >
                      No, I need extensions
                    </button>
                  </div>

                  {hasOwnExtension === false && (
                    <div className="mt-6 border-t border-[#d9c7cf] pt-5">
                      <p className="text-sm font-semibold text-[#1d171a]">Would you like to buy some now?</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={function () { setWantsToBuyExtension(true) }}
                          className={
                            wantsToBuyExtension === true
                              ? 'rounded-full border border-[#984667] bg-[#984667] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white'
                              : 'rounded-full border border-[#984667] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#984667]'
                          }
                        >
                          Yes, show me
                        </button>
                        <button
                          type="button"
                          onClick={function () { setWantsToBuyExtension(false) }}
                          className={
                            wantsToBuyExtension === false
                              ? 'rounded-full border border-[#75636b] bg-[#75636b] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white'
                              : 'rounded-full border border-[#75636b] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#5f5157]'
                          }
                        >
                          No, later
                        </button>
                      </div>

                      {wantsToBuyExtension === true && (
                        <div className="mt-5">
                          {extensionsLoading && <p className="text-sm text-[#5f5157]">Loading extensions...</p>}
                          {!extensionsLoading && extensionProducts.length === 0 && (
                            <p className="text-sm text-[#5f5157]">
                              No extensions have been added yet, ask the salon directly for now.
                            </p>
                          )}
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {extensionProducts.map(function (product) {
                              const added = addedExtensionId === product.id
                              return (
                                <div key={product.id} className="overflow-hidden rounded-2xl border border-[#d9c7cf] bg-white">
                                  <img src={product.image} alt="" className="h-32 w-full object-cover" />
                                  <div className="p-3">
                                    <p className="text-sm font-semibold text-[#1d171a]">{product.name}</p>
                                    <p className="mt-1 text-xs font-bold text-[#984667]">
                                      {'GHC ' + product.price.toLocaleString()}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={function () { addExtension(product) }}
                                      className={
                                        added
                                          ? 'mt-2 w-full rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold uppercase text-white'
                                          : 'mt-2 w-full rounded-full bg-[#984667] px-3 py-2 text-xs font-bold uppercase text-white'
                                      }
                                    >
                                      {added ? 'Added to bag' : 'Add to bag'}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-serif text-3xl text-[#1d171a]">Choose your time</h2>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {dates.map(function (date) {
                  const selected = selectedDate === date.iso
                  const dateClass = selected
                    ? 'rounded-2xl border px-4 py-4 text-center transition border-[#984667] bg-[#984667] text-white'
                    : 'rounded-2xl border px-4 py-4 text-center transition border-[#d9c7cf] bg-white text-[#5f5157]'
                  return (
                    <button key={date.iso} type="button" onClick={function () { chooseDate(date.iso) }} className={dateClass}>
                      <span className="block text-xs uppercase tracking-[0.12em]">{date.day}</span>
                      <span className="mt-1 block font-serif text-2xl">{date.date}</span>
                    </button>
                  )
                })}
              </div>
              {availability && (
                <p className="mt-5 text-sm text-[#5f5157]">
                  {availability.available
                    ? availability.slotsRemaining + ' booking spaces remain for this service category.'
                    : 'This service category is fully booked for the selected date.'}
                </p>
              )}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {times.map(function (time) {
                  const selected = selectedTime === time
                  const timeClass = selected
                    ? 'rounded-full border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 border-[#984667] bg-[#fbe0eb] text-[#984667]'
                    : 'rounded-full border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 border-[#e5cbd6] bg-white text-[#5f5157]'
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={!availability || !availability.available}
                      onClick={function () { setSelectedTime(time) }}
                      className={timeClass}
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr]">
              <div>
                <h2 className="font-serif text-3xl text-[#1d171a]">Confirm your booking</h2>
                {user ? (
                  <div className="mt-7 rounded-2xl border border-[#d9c7cf] bg-white p-5">
                    <p className="font-semibold text-[#1d171a]">{user.name}</p>
                    <p className="mt-1 text-sm text-[#5f5157]">{user.phone}</p>
                  </div>
                ) : (
                  <p className="mt-7 rounded-2xl bg-[#ead2dd] p-5 text-sm leading-7 text-[#5f5157]">
                    You will be asked to sign in before the request is submitted.
                  </p>
                )}
                <label className="mt-5 block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">
                    Mobile Money number (optional)
                  </span>
                  <input
                    type="tel"
                    value={momoNumber}
                    onChange={function (event) { setMomoNumber(event.target.value) }}
                    placeholder={user ? user.phone : '024 000 0000'}
                    className="h-13 w-full rounded-xl border border-[#cdb8c1] bg-white px-4 outline-none focus:border-[#984667] focus:ring-4 focus:ring-[#984667]/10"
                  />
                </label>
              </div>
              <aside className="rounded-2xl bg-[#1d171a] p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d9abbf]">Booking summary</p>
                <h3 className="mt-4 font-serif text-2xl">{activeService ? activeService.name : 'Your service'}</h3>
                <dl className="mt-5 space-y-3 text-sm text-white/75">
                  <div className="flex justify-between gap-4">
                    <dt>Date</dt>
                    <dd>{selectedDate}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Time</dt>
                    <dd>{selectedTime}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Bringing own extension</dt>
                    <dd>{hasOwnExtension ? 'Yes' : 'No'}</dd>
                  </div>
                  {selectedLength && (
                    <div className="flex justify-between gap-4">
                      <dt>Length</dt>
                      <dd>{selectedLength.label}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 border-t border-white/15 pt-3">
                    <dt>Price range</dt>
                    <dd>
                      {selectedLength
                        ? 'GHC ' + selectedLength.priceMin.toLocaleString() + ' - ' + selectedLength.priceMax.toLocaleString()
                        : activeService
                        ? 'GHC ' + activeService.priceMin.toLocaleString() + ' - ' + activeService.priceMax.toLocaleString()
                        : ''}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>
          )}

          {message && (
            <p role="status" className="mt-6 rounded-xl bg-[#ead2dd] px-4 py-3 text-sm text-[#74485a]">
              {message}
            </p>
          )}

          <div className="mt-9 flex items-center justify-between border-t border-[#d9c7cf] pt-6">
            <button
              type="button"
              onClick={function () { setStep(function (current) { return Math.max(1, current - 1) }) }}
              disabled={step === 1}
              className="text-sm font-bold text-[#725761] disabled:opacity-30"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={function () { setStep(function (current) { return Math.min(3, current + 1) }) }}
                disabled={
                  (step === 1 && (!selectedService || !extensionStepAnswered || (lengthOptions.length > 0 && !selectedLength))) ||
                  (step === 2 && (!selectedDate || !selectedTime))
                }
                className="rounded-full bg-[#984667] px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={function () { requestBooking() }}
                disabled={busy}
                className="rounded-full bg-[#984667] px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
              >
                {busy ? 'Submitting...' : 'Request booking'}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}