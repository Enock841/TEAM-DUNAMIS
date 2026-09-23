import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppData } from '../context/appData'
import { formatDuration } from '../data/catalog'
import { api } from '../lib/api'
import { ImageUploadField } from '../admin/components/ImageUploadField'

const times = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM']
const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

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

  const today = useMemo(function () { return new Date() }, [])

  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(serviceFromHash || '')
  const [hasOwnExtension, setHasOwnExtension] = useState(null)
  const [wantsToBuyExtension, setWantsToBuyExtension] = useState(null)
  const [extensionProducts, setExtensionProducts] = useState([])
  const [extensionsLoading, setExtensionsLoading] = useState(false)
  const [selectedExtension, setSelectedExtension] = useState(null)
  const [extensionQuantity, setExtensionQuantity] = useState(1)
  const [agreedToExtensionPickup, setAgreedToExtensionPickup] = useState(false)
  const [lengthOptions, setLengthOptions] = useState([])
  const [selectedLength, setSelectedLength] = useState(null)
  const [wantsCustomLength, setWantsCustomLength] = useState(false)
  const [customLengthText, setCustomLengthText] = useState('')
  const [referenceImageUrl, setReferenceImageUrl] = useState('')
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1)
  const [monthData, setMonthData] = useState(null)
  const [monthLoading, setMonthLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availability, setAvailability] = useState(null)
  const [notes, setNotes] = useState('')
  const [contactEmail, setContactEmail] = useState(user ? user.email || '' : '')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const activeService = useMemo(function () {
    return services.find(function (service) { return service.id === selectedService })
  }, [selectedService, services])

  const hasHandledServiceFromHash = useRef(false)

  useEffect(function () {
    if (hasHandledServiceFromHash.current) return
    if (!serviceFromHash || !services.length) return
    const match = services.find(function (service) { return service.id === serviceFromHash })
    if (!match) return
    hasHandledServiceFromHash.current = true
    selectService(match)
  }, [serviceFromHash, services])

  useEffect(function () {
    if (wantsToBuyExtension !== true) return
    setExtensionsLoading(true)
    api.products().then(function (allProducts) {
      const extras = allProducts.filter(function (product) {
        return product.category.trim().toLowerCase() === 'extensions'
      })
      setExtensionProducts(extras)
      setExtensionsLoading(false)
    })
  }, [wantsToBuyExtension])

  useEffect(function () {
    if (step !== 2 || !selectedService) return
    setMonthLoading(true)
    api.monthAvailability(selectedService, calendarYear, calendarMonth).then(function (data) {
      setMonthData(data)
      setMonthLoading(false)
    }).catch(function () {
      setMonthLoading(false)
    })
  }, [step, selectedService, calendarYear, calendarMonth])

  function selectService(service) {
    setSelectedService(service.id)
    setHasOwnExtension(null)
    setWantsToBuyExtension(null)
    setExtensionProducts([])
    setSelectedExtension(null)
    setExtensionQuantity(1)
    setSelectedDate('')
    setSelectedTime('')
    setAvailability(null)
    setSelectedLength(null)
    setLengthOptions([])
    setWantsCustomLength(false)
    setCustomLengthText('')
    api.serviceLengthOptions(service.id).then(function (options) {
      setLengthOptions(options)
    })
  }

  function selectExtension(product) {
    setSelectedExtension(function (current) {
      return current && current.id === product.id ? null : product
    })
    setExtensionQuantity(1)
  }

  function isoDate(year, month, day) {
    return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0')
  }

  function parseTimeLabelToMinutes(label) {
    const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return null
    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const period = match[3].toUpperCase()
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  async function chooseDate(iso) {
    setSelectedDate(iso)
    setSelectedTime('')
    setAvailability(null)
    setMessage('')
    if (!selectedService) return
    try {
      setAvailability(await api.availability(selectedService, iso))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to check availability.')
    }
  }

  function changeMonth(direction) {
    let nextMonth = calendarMonth + direction
    let nextYear = calendarYear
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }
    if (nextMonth < 1) {
      nextMonth = 12
      nextYear -= 1
    }
    setCalendarMonth(nextMonth)
    setCalendarYear(nextYear)
    setSelectedDate('')
    setSelectedTime('')
    setAvailability(null)
  }

  const monthsAhead = (calendarYear - today.getFullYear()) * 12 + (calendarMonth - (today.getMonth() + 1))
  const canGoBack = monthsAhead > 0
  const canGoForward = monthsAhead < 1

  const calendarDays = useMemo(function () {
    const firstOfMonth = new Date(calendarYear, calendarMonth - 1, 1)
    const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate()
    const startWeekday = firstOfMonth.getDay()
    const days = []
    for (let i = 0; i < startWeekday; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }, [calendarYear, calendarMonth])

  async function requestBooking() {
    if (!token) {
      setMessage('Sign in or create a client account to complete your booking.')
      onRequireAuth()
      return
    }
    if (busy || submitted) return

    setBusy(true)
    setMessage('')
    try {
      await api.createBooking(token, {
        serviceId: selectedService,
        date: selectedDate,
        timeSlot: selectedTime,
        lengthLabel: selectedLength ? selectedLength.label : undefined,
        referenceImageUrl: referenceImageUrl || undefined,
        customLengthRequest: wantsCustomLength && customLengthText.trim() ? customLengthText.trim() : undefined,
        notes: notes.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        extensionProductId: selectedExtension ? selectedExtension.id : undefined,
        extensionProductName: selectedExtension ? selectedExtension.name : undefined,
        extensionQuantity: selectedExtension ? extensionQuantity : undefined,
        extensionProductPrice: selectedExtension ? selectedExtension.price : undefined,
      })

      setSubmitted(true)
      setMessage('Your booking request was submitted. We will review it and let you know once it is approved with a confirmed price, at which point you can pay from your account.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to request this booking.')
    } finally {
      setBusy(false)
    }
  }

  const extensionStepAnswered = !activeService || activeService.category.name !== 'Braiding'
    ? true
    : hasOwnExtension === true || (hasOwnExtension === false && wantsToBuyExtension !== null)
  const lengthStepAnswered = lengthOptions.length === 0 || Boolean(selectedLength) || (wantsCustomLength && customLengthText.trim().length > 1)

  return (
    <main className="min-h-[760px] bg-[#f9e8ef] px-5 py-12 sm:px-10 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d92c83]">Reserve your time</p>
          <h1 className="mt-4 font-serif text-[42px] leading-tight text-[#3e2530] sm:text-6xl">
            Book an appointment
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#745f68]">
            Choose your service and preferred time. We will confirm every detail before your visit.
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center">
          {[1, 2, 3].map(function (item) {
            const circleClass = 'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ' +
              (step >= item ? 'bg-[#dc2d83] text-white' : 'border border-[#d9aabd] bg-white text-[#8f707d]')
            const lineClass = 'h-px w-12 sm:w-24 ' + (step > item ? 'bg-[#dc2d83]' : 'bg-[#d9aabd]')
            return (
              <div key={item} className="flex items-center">
                <span className={circleClass}>{item}</span>
                {item < 3 && <span className={lineClass} />}
              </div>
            )
          })}
        </div>

        <section className="mt-9 rounded-[1.75rem] border border-[#ebc8d7] bg-[#fffaf8] p-5 shadow-[0_20px_55px_rgba(80,34,54,0.08)] sm:mt-10 sm:rounded-[2rem] sm:p-10">
          {step === 1 && (
            <div>
              <h2 className="font-serif text-3xl text-[#3e2530]">Select a service</h2>
              <p className="mt-2 text-sm text-[#745f68]">Prices are supplied by the salon and shown as a range.</p>
              {catalogLoading && <p className="mt-7">Loading services...</p>}
              {catalogError && <p className="mt-7 text-[#8b435f]">{catalogError}</p>}

              <div className="mt-7 grid gap-3 md:grid-cols-2">
                {services.map(function (service) {
                  const selected = selectedService === service.id
                  const cardClass = selected
                    ? 'flex items-start justify-between gap-4 rounded-2xl border p-5 text-left transition border-[#dc2d83] bg-[#fbe0eb] shadow-sm'
                    : 'flex items-start justify-between gap-4 rounded-2xl border p-5 text-left transition border-[#ecd8e1] bg-white hover:border-[#dc2d83]'
                  return (
                    <button key={service.id} type="button" onClick={function () { selectService(service) }} className={cardClass}>
                      <span>
                        <span className="block font-serif text-lg text-[#3e2530]">{service.name}</span>
                        <span className="mt-1 block text-xs text-[#8f707d]">
                          {service.category.name + ' - ' + formatDuration(service.durationMinutes)}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-sm font-bold text-[#b32269]">
                        {'GHC ' + service.priceMin.toLocaleString() + ' - ' + service.priceMax.toLocaleString()}
                      </span>
                    </button>
                  )
                })}
              </div>

              {selectedService && lengthOptions.length > 0 && (
                <div className="mt-8 rounded-2xl border border-[#e6c5d3] bg-white p-6">
                  <p className="font-serif text-xl text-[#3e2530]">Choose your length</p>
                  <p className="mt-2 text-sm text-[#745f68]">Pricing depends on the length you choose.</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {lengthOptions.map(function (option) {
                      const selected = !wantsCustomLength && selectedLength && selectedLength.id === option.id
                      const optionClass = selected
                        ? 'overflow-hidden rounded-xl border text-left transition border-[#dc2d83] bg-[#fbe0eb]'
                        : 'overflow-hidden rounded-xl border text-left transition border-[#ecd8e1] bg-white hover:border-[#dc2d83]'
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={function () {
                            setSelectedLength(option)
                            setWantsCustomLength(false)
                          }}
                          className={optionClass}
                        >
                          {option.imageUrl && (
                            <img src={option.imageUrl} alt={option.label} className="h-36 w-full object-cover" />
                          )}
                          <div className="flex items-center justify-between p-4">
                            <span className="font-semibold text-[#3e2530]">{option.label}</span>
                            <span className="text-sm font-bold text-[#b32269]">
                              {'GHC ' + option.priceMin.toLocaleString() + ' - ' + option.priceMax.toLocaleString()}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-5 border-t border-[#ecd8e1] pt-5">
                    <button
                      type="button"
                      onClick={function () {
                        setWantsCustomLength(!wantsCustomLength)
                        setSelectedLength(null)
                      }}
                      className={
                        wantsCustomLength
                          ? 'text-sm font-bold text-[#dc2d83] underline underline-offset-4'
                          : 'text-sm font-semibold text-[#745f68] underline underline-offset-4'
                      }
                    >
                      I don't see the length or style I want
                    </button>

                    {wantsCustomLength && (
                      <div className="mt-4">
                        <textarea
                          value={customLengthText}
                          onChange={function (e) { setCustomLengthText(e.target.value) }}
                          placeholder="Describe exactly what you want, e.g. 32 inch bone straight with curtain bangs"
                          className="h-24 w-full rounded-xl border border-[#dfbdcb] bg-white p-4 text-sm outline-none focus:border-[#dc2d83]"
                        />
                        <p className="mt-2 text-xs leading-5 text-[#8f707d]">
                          We will review this and confirm a real price for your request before your appointment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedService && (
                <div className="mt-8 rounded-2xl border border-[#e6c5d3] bg-white p-6">
                  <p className="font-serif text-xl text-[#3e2530]">Reference photo</p>
                  <p className="mt-2 text-sm text-[#745f68]">
                    Required, a photo of the look you want helps the stylist prepare properly for your appointment.
                  </p>
                  <div className="mt-4">
                    <ImageUploadField label="Reference photo" value={referenceImageUrl} onChange={setReferenceImageUrl} />
                  </div>
                </div>
              )}

              {selectedService && activeService && activeService.category.name === 'Braiding' && (
                <div className="mt-8 rounded-2xl border border-[#e6c5d3] bg-white p-6">
                  <p className="font-serif text-xl text-[#3e2530]">Are you bringing your own extension?</p>
                  <p className="mt-2 text-sm text-[#745f68]">
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
                          ? 'rounded-full border border-[#dc2d83] bg-[#dc2d83] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white'
                          : 'rounded-full border border-[#dc2d83] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#dc2d83]'
                      }
                    >
                      Yes, I have my own
                    </button>
                    <button
                      type="button"
                      onClick={function () { setHasOwnExtension(false) }}
                      className={
                        hasOwnExtension === false
                          ? 'rounded-full border border-[#8f707d] bg-[#8f707d] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white'
                          : 'rounded-full border border-[#8f707d] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#604c55]'
                      }
                    >
                      No, I need extensions
                    </button>
                  </div>

                  {hasOwnExtension === false && (
                    <div className="mt-6 border-t border-[#ecd8e1] pt-5">
                      <p className="text-sm font-semibold text-[#3e2530]">Would you like to buy some now?</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={function () { setWantsToBuyExtension(true) }}
                          className={
                            wantsToBuyExtension === true
                              ? 'rounded-full border border-[#dc2d83] bg-[#dc2d83] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white'
                              : 'rounded-full border border-[#dc2d83] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#dc2d83]'
                          }
                        >
                          Yes, show me
                        </button>
                        <button
                          type="button"
                          onClick={function () { setWantsToBuyExtension(false) }}
                          className={
                            wantsToBuyExtension === false
                              ? 'rounded-full border border-[#8f707d] bg-[#8f707d] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white'
                              : 'rounded-full border border-[#8f707d] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#604c55]'
                          }
                        >
                          No, later
                        </button>
                      </div>

                      {wantsToBuyExtension === true && (
                        <div className="mt-5">
                          {extensionsLoading && <p className="text-sm text-[#745f68]">Loading extensions...</p>}
                          {!extensionsLoading && extensionProducts.length === 0 && (
                            <p className="text-sm text-[#745f68]">
                              No extensions have been added yet, ask the salon directly for now.
                            </p>
                          )}
                          <div className="rounded-xl border border-[#e6c5d3] bg-[#f7e4ec] p-4">
                            <label className="flex cursor-pointer items-start gap-3">
                              <input
                                type="checkbox"
                                checked={agreedToExtensionPickup}
                                onChange={function (event) { setAgreedToExtensionPickup(event.target.checked) }}
                                className="mt-0.5 h-4 w-4 accent-[#dc2d83]"
                              />
                              <span className="text-sm text-[#3e2530]">
                                Choose the extension you would like, the salon will hold it for you at your appointment, no need to pay for it separately or wait for delivery.
                              </span>
                            </label>
                          </div>
                          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {extensionProducts.map(function (product) {
                              const isSelected = selectedExtension && selectedExtension.id === product.id
                              return (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={function () { selectExtension(product) }}
                                  className={
                                    'overflow-hidden rounded-2xl border text-left transition ' +
                                    (isSelected ? 'border-[#dc2d83] ring-2 ring-[#dc2d83]/30' : 'border-[#ecd8e1] hover:border-[#dc2d83]')
                                  }
                                >
                                  <img src={product.image} alt="" className="h-32 w-full object-cover" />
                                  <div className="p-3">
                                    <p className="text-sm font-semibold text-[#3e2530]">{product.name}</p>
                                    <p className="mt-1 text-xs font-bold text-[#b32269]">
                                      {'GHC ' + product.price.toLocaleString()} each
                                    </p>
                                    <p className={'mt-2 text-[10px] font-bold uppercase tracking-[0.1em] ' + (isSelected ? 'text-[#dc2d83]' : 'text-[#a08a94]')}>
                                      {isSelected ? 'Selected' : 'Tap to select'}
                                    </p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>

                          {selectedExtension && (
                            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#e6c5d3] bg-[#f7e4ec] p-4">
                              <p className="text-sm font-semibold text-[#3e2530]">
                                How many {selectedExtension.name} do you think you need?
                              </p>
                              <div className="flex items-center gap-3 rounded-full border border-[#e5cbd6] bg-white px-3 py-1.5">
                                <button
                                  type="button"
                                  onClick={function () { setExtensionQuantity(Math.max(1, extensionQuantity - 1)) }}
                                  className="text-lg font-bold text-[#604c55]"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center text-sm font-bold">{extensionQuantity}</span>
                                <button
                                  type="button"
                                  onClick={function () { setExtensionQuantity(extensionQuantity + 1) }}
                                  className="text-lg font-bold text-[#604c55]"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}

                          <p className="mt-3 text-xs leading-5 text-[#8f707d]">
                            Not sure exactly how many you will need? The salon will confirm and set the real total price for your service and extensions together once they review your request. If it is not quite enough on the day, more can be bought directly at the salon.
                          </p>

                          <a href="#/shop?category=Extensions" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.1em] text-[#dc2d83] underline underline-offset-4">Browse more extensions in our shop, opens in a new tab</a>
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
              <h2 className="font-serif text-3xl text-[#3e2530]">Choose your date and time</h2>

              <div className="mt-7 rounded-2xl border border-[#e6c5d3] bg-white p-5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={function () { changeMonth(-1) }}
                    disabled={!canGoBack}
                    className="rounded-full border border-[#e5cbd6] px-4 py-2 text-sm font-bold text-[#604c55] disabled:opacity-30"
                  >
                    &#8592;
                  </button>
                  <p className="font-serif text-xl text-[#3e2530]">
                    {new Date(calendarYear, calendarMonth - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </p>
                  <button
                    type="button"
                    onClick={function () { changeMonth(1) }}
                    disabled={!canGoForward}
                    className="rounded-full border border-[#e5cbd6] px-4 py-2 text-sm font-bold text-[#604c55] disabled:opacity-30"
                  >
                    &#8594;
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase text-[#8f707d]">
                  {weekdayLabels.map(function (label, i) {
                    return <span key={i}>{label}</span>
                  })}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-1.5">
                  {monthLoading && <p className="col-span-7 py-6 text-center text-sm text-[#745f68]">Loading availability...</p>}
                  {!monthLoading && calendarDays.map(function (day, index) {
                    if (!day) return <span key={'blank-' + index} />

                    const iso = isoDate(calendarYear, calendarMonth, day)
                    const dayDate = new Date(calendarYear, calendarMonth - 1, day)
                    const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    const bookedCount = monthData && monthData.bookedByDate[iso] ? monthData.bookedByDate[iso] : 0
                    const dailyCap = monthData ? monthData.dailyCap : 0
                    const slotsLeft = Math.max(dailyCap - bookedCount, 0)
                    const isFull = dailyCap > 0 && slotsLeft === 0
                    const selected = selectedDate === iso

                    let dayClass = 'flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition '
                    if (isPast || isFull) {
                      dayClass += 'cursor-not-allowed bg-[#f3e6ec] text-[#c7a9b6] line-through'
                    } else if (selected) {
                      dayClass += 'bg-[#dc2d83] text-white'
                    } else if (slotsLeft > 0 && slotsLeft <= 2) {
                      dayClass += 'border border-[#e6a94a] bg-[#fdf2e0] text-[#8a5a1f]'
                    } else {
                      dayClass += 'border border-[#ecd8e1] bg-white text-[#604c55] hover:border-[#dc2d83]'
                    }

                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={isPast || isFull}
                        onClick={function () { chooseDate(iso) }}
                        className={dayClass}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-semibold text-[#8f707d]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-[#ecd8e1] bg-white" /> Open
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-[#e6a94a] bg-[#fdf2e0]" /> Almost full
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f3e6ec]" /> Fully booked
                  </span>
                </div>
              </div>

              {availability && (
                <p className="mt-5 text-sm text-[#745f68]">
                  {availability.available
                    ? availability.slotsRemaining + ' booking spaces remain for this service category.'
                    : 'This service category is fully booked for the selected date.'}
                </p>
              )}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {times.map(function (time) {
                  const selected = selectedTime === time
                  const isTaken = Boolean(availability && availability.bookedTimeSlots && availability.bookedTimeSlots.indexOf(time) !== -1)
                  const now = new Date()
                  const isToday = selectedDate === isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
                  const isPastTime = isToday && parseTimeLabelToMinutes(time) !== null && parseTimeLabelToMinutes(time) <= now.getHours() * 60 + now.getMinutes()
                  const isUnavailable = isTaken || isPastTime
                  const timeClass = selected
                    ? 'rounded-full border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 border-[#dc2d83] bg-[#fbe0eb] text-[#a51e61]'
                    : isUnavailable
                    ? 'rounded-full border px-4 py-3 text-sm font-semibold transition cursor-not-allowed border-[#ecd8e1] bg-[#f3e6ec] text-[#c7a9b6] line-through'
                    : 'rounded-full border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 border-[#e5cbd6] bg-white text-[#604c55]'
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={!availability || !availability.available || isUnavailable}
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
                <h2 className="font-serif text-3xl text-[#3e2530]">Confirm your booking</h2>
                {user ? (
                  <div className="mt-7 rounded-2xl border border-[#e6c5d3] bg-white p-5">
                    <p className="font-semibold text-[#3e2530]">{user.name}</p>
                    <p className="mt-1 text-sm text-[#745f68]">{user.phone}</p>
                  </div>
                ) : (
                  <p className="mt-7 rounded-2xl bg-[#f7e4ec] p-5 text-sm leading-7 text-[#745f68]">
                    You will be asked to sign in before the request is submitted.
                  </p>
                )}
                <label className="mt-5 block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">
                    Email for booking updates
                  </span>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={function (event) { setContactEmail(event.target.value) }}
                    placeholder="you@example.com"
                    className="h-13 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 outline-none focus:border-[#dc2d83] focus:ring-4 focus:ring-[#dc2d83]/10"
                  />
                </label>
                <label className="mt-5 block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">
                    Anything else we should know? (optional)
                  </span>
                  <textarea
                    value={notes}
                    onChange={function (event) { setNotes(event.target.value) }}
                    placeholder="Allergies, a specific stylist request, anything about your reference photo, etc."
                    className="h-24 w-full rounded-xl border border-[#dfbdcb] bg-white p-4 text-sm outline-none focus:border-[#dc2d83] focus:ring-4 focus:ring-[#dc2d83]/10"
                  />
                </label>

                <div className="mt-6 rounded-2xl border border-[#e6c5d3] bg-[#f7e4ec] p-5">
                  <p className="text-sm font-semibold text-[#3e2530]">Appointment terms</p>
                  <p className="mt-2 text-sm leading-6 text-[#745f68]">
                    If you arrive late for your appointment, the salon has the right to cancel and reschedule your booking, or additional charges may be added to your service.
                  </p>
                  <label className="mt-4 flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={function (event) { setAgreedToTerms(event.target.checked) }}
                      className="mt-0.5 h-4 w-4 accent-[#dc2d83]"
                    />
                    <span className="text-sm text-[#3e2530]">I have read and agree to these terms.</span>
                  </label>
                </div>
              </div>
              <aside className="rounded-2xl bg-[#4b2637] p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f2a7c9]">Booking summary</p>
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
                  {selectedLength && !wantsCustomLength && (
                    <div className="flex justify-between gap-4">
                      <dt>Length</dt>
                      <dd>{selectedLength.label}</dd>
                    </div>
                  )}
                  {wantsCustomLength && customLengthText.trim() && (
                    <div className="flex justify-between gap-4">
                      <dt>Requested style</dt>
                      <dd className="text-right">{customLengthText.trim()}</dd>
                    </div>
                  )}
                  {selectedExtension && (
                    <div className="flex justify-between gap-4">
                      <dt>Extension</dt>
                      <dd className="text-right">
                        {extensionQuantity}x {selectedExtension.name}
                        <br />
                        GHC {(selectedExtension.price * extensionQuantity).toLocaleString()}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 border-t border-white/15 pt-3">
                    <dt>Service price range</dt>
                    <dd>
                      {wantsCustomLength
                        ? 'To be confirmed'
                        : selectedLength
                        ? 'GHC ' + selectedLength.priceMin.toLocaleString() + ' - ' + selectedLength.priceMax.toLocaleString()
                        : activeService
                        ? 'GHC ' + activeService.priceMin.toLocaleString() + ' - ' + activeService.priceMax.toLocaleString()
                        : ''}
                    </dd>
                  </div>
                  <p className="pt-2 text-xs text-white/60">
                    The salon will confirm one final price covering the service and any extension together before you pay.
                  </p>
                </dl>
              </aside>
            </div>
          )}

          {message && (
            <p role="status" className="mt-6 rounded-xl bg-[#f7e4ec] px-4 py-3 text-sm text-[#74485a]">
              {message}
            </p>
          )}

          <div className="mt-9 flex items-center justify-between border-t border-[#ecd8e1] pt-6">
            <button
              type="button"
              onClick={function () { setStep(function (current) { return Math.max(1, current - 1)}) }}
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
                  (step === 1 && (!selectedService || !extensionStepAnswered || !lengthStepAnswered || !referenceImageUrl)) ||
                  (step === 2 && (!selectedDate || !selectedTime))
                }
                className="rounded-full bg-[#dc2d83] px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={function () { requestBooking() }}
                disabled={busy || submitted || !agreedToTerms}
                className="rounded-full bg-[#dc2d83] px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
              >
                {busy ? 'Submitting...' : submitted ? 'Request submitted' : 'Request booking'}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}