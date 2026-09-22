import { useEffect, useState } from 'react'
import { useAppData } from '../context/appData'
import { api } from '../lib/api'

const presetAmounts = [50, 100, 200, 500]

export function GiftCardPage(props) {
  const onRequireAuth = props.onRequireAuth
  const appData = useAppData()
  const token = appData.token
  const user = appData.user

  const [amount, setAmount] = useState(100)
  const [customAmount, setCustomAmount] = useState('')
  const [purchaserName, setPurchaserName] = useState(user ? user.name : '')
  const [purchaserEmail, setPurchaserEmail] = useState(user ? user.email || '' : '')
  const [isGift, setIsGift] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [momoNumber, setMomoNumber] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) setBusy(false)
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  const finalAmount = customAmount ? Number(customAmount) : amount

  async function submit(event) {
    event.preventDefault()
    if (!token) {
      setError('Sign in or create an account to buy a gift card.')
      onRequireAuth()
      return
    }
    if (!finalAmount || finalAmount < 20) {
      setError('Enter an amount of at least GHC 20.')
      return
    }
    if (!purchaserName.trim() || !purchaserEmail.trim()) {
      setError('Please fill in your name and email.')
      return
    }
    if (!momoNumber.trim()) {
      setError('Please enter a Mobile Money number to pay with.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const result = await api.purchaseGiftCard(token, {
        amount: finalAmount,
        purchaserName: purchaserName.trim(),
        purchaserEmail: purchaserEmail.trim(),
        recipientName: isGift ? recipientName.trim() || undefined : undefined,
        recipientEmail: isGift ? recipientEmail.trim() || undefined : undefined,
        message: message.trim() || undefined,
      })

      const payment = await api.initiatePayment(token, {
        type: 'gift_card',
        refId: result.giftCard.id,
        momoNumber: momoNumber.trim(),
      })
      window.location.href = payment.authorizationUrl
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to purchase gift card.')
      setBusy(false)
    }
  }

  return (
    <main className="min-h-[720px] bg-[#f9e8ef] px-5 py-14 sm:px-10 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d92c83]">Give the gift of beauty</p>
          <h1 className="mt-4 font-serif text-[42px] leading-tight text-[#3e2530] sm:text-6xl">
            Gift cards
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#745f68]">
            Any amount, redeemable on any product or appointment at Beryl's Beauty Mark.
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 rounded-[1.75rem] border border-[#ebc8d7] bg-white p-6 shadow-[0_20px_55px_rgba(80,34,54,0.08)] sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#765b67]">Choose an amount</p>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {presetAmounts.map(function (value) {
              const selected = !customAmount && amount === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={function () { setAmount(value); setCustomAmount('') }}
                  className={
                    selected
                      ? 'rounded-xl border border-[#dc2d83] bg-[#fbe0eb] py-3 text-sm font-bold text-[#a51e61]'
                      : 'rounded-xl border border-[#ecd8e1] bg-white py-3 text-sm font-bold text-[#604c55]'
                  }
                >
                  GHC {value}
                </button>
              )
            })}
          </div>
          <input
            type="number"
            min="20"
            value={customAmount}
            onChange={function (e) { setCustomAmount(e.target.value) }}
            placeholder="Or enter any amount, minimum GHC 20"
            className="mt-3 h-13 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 outline-none focus:border-[#dc2d83]"
          />

          <div className="mt-7 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">Your name</span>
              <input
                required
                value={purchaserName}
                onChange={function (e) { setPurchaserName(e.target.value) }}
                className="h-13 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 outline-none focus:border-[#dc2d83]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">Your email</span>
              <input
                required
                type="email"
                value={purchaserEmail}
                onChange={function (e) { setPurchaserEmail(e.target.value) }}
                className="h-13 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 outline-none focus:border-[#dc2d83]"
              />
            </label>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isGift}
              onChange={function (e) { setIsGift(e.target.checked) }}
              className="h-4 w-4 accent-[#dc2d83]"
            />
            <span className="text-sm font-semibold text-[#3e2530]">This is a gift for someone else</span>
          </label>

          {isGift && (
            <div className="mt-4 grid gap-4 rounded-2xl border border-[#e6c5d3] bg-[#f7e4ec] p-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">Recipient's name</span>
                <input
                  value={recipientName}
                  onChange={function (e) { setRecipientName(e.target.value) }}
                  className="h-13 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 outline-none focus:border-[#dc2d83]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">Recipient's email</span>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={function (e) { setRecipientEmail(e.target.value) }}
                  className="h-13 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 outline-none focus:border-[#dc2d83]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">A short message, optional</span>
                <textarea
                  value={message}
                  onChange={function (e) { setMessage(e.target.value) }}
                  className="h-20 w-full rounded-xl border border-[#dfbdcb] bg-white p-4 text-sm outline-none focus:border-[#dc2d83]"
                />
              </label>
            </div>
          )}

          <label className="mt-6 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">Mobile Money number to pay with</span>
            <input
              required
              type="tel"
              value={momoNumber}
              onChange={function (e) { setMomoNumber(e.target.value) }}
              placeholder={user ? user.phone : '024 000 0000'}
              className="h-13 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 outline-none focus:border-[#dc2d83]"
            />
          </label>

          {error && (
            <p role="status" className="mt-5 rounded-xl bg-[#f7e4ec] px-4 py-3 text-sm text-[#74485a]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-7 min-h-14 w-full rounded-full bg-[#dc2d83] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
          >
            {busy ? 'Redirecting to payment...' : 'Buy gift card, GHC ' + (finalAmount || 0)}
          </button>
        </form>
      </div>
    </main>
  )
}