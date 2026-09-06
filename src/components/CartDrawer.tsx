import { useState } from 'react'
import { useAppData } from '../context/appData'
import type { Product } from '../data/catalog'
import { productImage } from '../data/catalog'
import { api } from '../lib/api'

type CartDrawerProps = {
  items: Product[]
  open: boolean
  onClose: () => void
  onRemove: (index: number) => void
  onRequireAuth: () => void
  onOrderComplete: () => void
}

export function CartDrawer({
  items,
  open,
  onClose,
  onRemove,
  onRequireAuth,
  onOrderComplete,
}: CartDrawerProps) {
  const { token, user } = useAppData()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [giftCardCode, setGiftCardCode] = useState('')
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; balance: number } | null>(null)
  const [giftCardChecking, setGiftCardChecking] = useState(false)
  const [giftCardError, setGiftCardError] = useState('')

  if (!open) return null

  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0)
  const discount = appliedGiftCard ? Math.min(appliedGiftCard.balance, total) : 0
  const finalTotal = Math.max(0, total - discount)

  async function applyGiftCard() {
    if (!giftCardCode.trim()) return
    setGiftCardChecking(true)
    setGiftCardError('')
    try {
      const result = await api.checkGiftCard(giftCardCode.trim())
      setAppliedGiftCard({ code: result.giftCard.code, balance: result.giftCard.balance })
    } catch (error) {
      setGiftCardError(error instanceof Error ? error.message : 'That code could not be found.')
      setAppliedGiftCard(null)
    } finally {
      setGiftCardChecking(false)
    }
  }

  async function checkout() {
    if (!name.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      setMessage('Please fill in your name, phone number, email and location.')
      return
    }
    if (!agreedToTerms) {
      setMessage('Please agree to the return policy before paying.')
      return
    }

    setBusy(true)
    setMessage('')
    try {
      const quantities = new Map<string, { productId: string; variantId?: string; quantity: number }>()
      items.forEach((item) => {
        const key = item.id + '::' + (item.variantId || '')
        const existing = quantities.get(key)
        quantities.set(key, {
          productId: item.id,
          variantId: item.variantId,
          quantity: (existing?.quantity ?? 0) + 1,
        })
      })
      const result = await api.createOrder(
        token,
        [...quantities.values()].map((entry) => ({
          productId: entry.productId,
          quantity: entry.quantity,
          variantId: entry.variantId,
        })),
        {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim() || undefined,
          email: email.trim(),
        },
        appliedGiftCard ? appliedGiftCard.code : undefined,
      )

      if (result.order.status === 'paid') {
        onOrderComplete()
        setMessage('Your order is fully covered by your gift card and has been placed.')
        setBusy(false)
        return
      }

      const payment = await api.initiatePayment(token, {
        type: 'order',
        refId: result.order.id,
        momoNumber: phone.trim(),
      })

      onOrderComplete()
      window.location.href = payment.authorizationUrl
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Checkout failed.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#24131b]/55 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close shopping bag"
        onClick={onClose}
        className="absolute inset-0 h-full w-full"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#fffaf8] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d92c83]">
              Your bag
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#3e2530]">Shopping bag</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5e1e9] text-2xl"
          >
            x
          </button>
        </div>

        <div className="mt-8 flex-1 space-y-5">
          {items.length === 0 ? (
            <div className="rounded-2xl bg-[#f8e5ed] p-6 text-center">
              <p className="font-serif text-2xl text-[#3e2530]">Your bag is waiting.</p>
              <p className="mt-2 text-sm text-[#765c68]">
                Browse the shop and add a product when you are ready.
              </p>
            </div>
          ) : (
            items.map(function (item, index) {
              return (
                <article key={item.id + '-' + index} className="flex gap-4 border-b border-[#ecd8e1] pb-5">
                  <img
                    src={productImage(item)}
                    alt=""
                    className="h-24 w-20 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg text-[#3e2530]">{item.name}</p>
                    {item.variantLabel && (
                      <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#8f707d]">
                        {item.variantLabel}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-semibold text-[#b32269]">
                      GHC {item.price.toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={function () { onRemove(index) }}
                      className="mt-2 text-xs text-[#816873] underline"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-6 space-y-4 border-t border-[#e7ccd7] pt-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">
              Delivery details
            </p>
            {!user && (
              <p className="rounded-xl bg-[#f7e4ec] px-4 py-2.5 text-xs leading-5 text-[#745f68]">
                You can check out as a guest right now, no account needed. Or you can{' '}
                <button type="button" onClick={onRequireAuth} className="font-bold text-[#dc2d83] underline">
                  sign in
                </button>{' '}
                to save this order to your account.
              </p>
            )}
            <input
              type="text"
              value={name}
              onChange={function (e) { setName(e.target.value) }}
              placeholder="Full name"
              className="h-12 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 text-sm outline-none focus:border-[#dc2d83]"
            />
            <input
              type="tel"
              value={phone}
              onChange={function (e) { setPhone(e.target.value) }}
              placeholder={user ? user.phone : '024 000 0000'}
              className="h-12 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 text-sm outline-none focus:border-[#dc2d83]"
            />
            <input
              type="email"
              value={email}
              onChange={function (e) { setEmail(e.target.value) }}
              placeholder="Email address, for your receipt"
              className="h-12 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 text-sm outline-none focus:border-[#dc2d83]"
            />
            <input
              type="text"
              value={address}
              onChange={function (e) { setAddress(e.target.value) }}
              placeholder="Your location, e.g. Ayeduase, near the market"
              className="h-12 w-full rounded-xl border border-[#dfbdcb] bg-white px-4 text-sm outline-none focus:border-[#dc2d83]"
            />
            <textarea
              value={notes}
              onChange={function (e) { setNotes(e.target.value) }}
              placeholder="Any notes for delivery, optional"
              className="h-20 w-full rounded-xl border border-[#dfbdcb] bg-white p-4 text-sm outline-none focus:border-[#dc2d83]"
            />

            <div className="rounded-2xl border border-[#e6c5d3] bg-white p-4">
              <p className="text-sm font-semibold text-[#3e2530]">Have a gift card?</p>
              {appliedGiftCard ? (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                  <span className="text-xs font-bold text-emerald-700">
                    {appliedGiftCard.code} applied, GHC {appliedGiftCard.balance} available
                  </span>
                  <button
                    type="button"
                    onClick={function () { setAppliedGiftCard(null); setGiftCardCode('') }}
                    className="text-xs font-bold text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={giftCardCode}
                    onChange={function (e) { setGiftCardCode(e.target.value.toUpperCase()) }}
                    placeholder="e.g. GIFT-AB12CD34"
                    className="h-11 flex-1 rounded-xl border border-[#dfbdcb] bg-white px-3 text-sm uppercase tracking-[0.1em] outline-none focus:border-[#dc2d83]"
                  />
                  <button
                    type="button"
                    onClick={function () { applyGiftCard() }}
                    disabled={giftCardChecking}
                    className="rounded-xl bg-[#3e2530] px-4 text-xs font-bold uppercase text-white disabled:opacity-50"
                  >
                    {giftCardChecking ? 'Checking...' : 'Apply'}
                  </button>
                </div>
              )}
              {giftCardError && <p className="mt-2 text-xs font-semibold text-red-600">{giftCardError}</p>}
            </div>

            <div className="rounded-2xl border border-[#e6c5d3] bg-[#f7e4ec] p-4">
              <p className="text-sm font-semibold text-[#3e2530]">Return policy</p>
              <p className="mt-2 text-xs leading-5 text-[#745f68]">
                Once an item has been in your possession for more than 24 hours, it is no longer eligible for return or refund.
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={function (e) { setAgreedToTerms(e.target.checked) }}
                  className="mt-0.5 h-4 w-4 accent-[#dc2d83]"
                />
                <span className="text-xs text-[#3e2530]">I have read and agree to this policy.</span>
              </label>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-[#e7ccd7] pt-5">
          {discount > 0 && (
            <div className="flex justify-between text-sm text-[#745f68]">
              <span>Subtotal</span>
              <span>GHC {total.toLocaleString()}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-emerald-700">
              <span>Gift card discount</span>
              <span>- GHC {discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-serif text-xl text-[#3e2530]">
            <span>Total</span>
            <span>GHC {finalTotal.toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={function () { checkout() }}
            disabled={!items.length || busy || !agreedToTerms}
            className="mt-5 min-h-13 w-full rounded-full bg-[#d92c83] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white disabled:opacity-40"
          >
            {busy ? 'Redirecting to payment...' : 'Pay now'}
          </button>
          {message && (
            <p className="mt-3 text-sm leading-6 text-[#74485a]" role="status">
              {message}
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}