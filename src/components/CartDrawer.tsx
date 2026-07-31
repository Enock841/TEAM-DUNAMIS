import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { useAppData } from '../context/appData'
import type { Product } from '../data/catalog'
import { productImage } from '../data/catalog'
import { useDialogAccessibility } from '../hooks/useDialogAccessibility'
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
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const dialogRef = useDialogAccessibility(open, onClose)

  if (!open) return null

  const total = items.reduce((sum, item) => sum + item.price, 0)

  async function checkout() {
    if (!token) {
      setMessage('Sign in or create an account to complete checkout.')
      onRequireAuth()
      return
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setMessage('Please fill in your name, phone number and location.')
      return
    }

    setBusy(true)
    setMessage('')
    try {
      const quantities = new Map<string, number>()
      items.forEach((item) =>
        quantities.set(item.id, (quantities.get(item.id) ?? 0) + 1),
      )
      const result = await api.createOrder(
        token,
        [...quantities].map(([productId, quantity]) => ({
          productId,
          quantity,
        })),
        {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim() || undefined,
        },
      )

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
      <aside
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#fffdfd] p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#984667]">
              Your bag
            </p>
            <h2 id="cart-title" className="mt-2 font-serif text-3xl text-[#1d171a]">
              Shopping bag
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5e1e9] text-2xl"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <div className="mt-8 flex-1 space-y-5">
          {items.length === 0 ? (
            <div className="rounded-2xl bg-[#f8e5ed] p-6 text-center">
              <p className="font-serif text-2xl text-[#1d171a]">Your bag is waiting.</p>
              <p className="mt-2 text-sm text-[#765c68]">
                Browse the shop and add a product when you are ready.
              </p>
            </div>
          ) : (
            items.map(function (item, index) {
              return (
                <article key={item.id + '-' + index} className="flex gap-4 border-b border-[#d9c7cf] pb-5">
                  <img
                    src={productImage(item)}
                    alt=""
                    className="h-24 w-20 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg text-[#1d171a]">{item.name}</p>
                    <p className="mt-2 text-sm font-semibold text-[#984667]">
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
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#654656]">
                Full name
              </span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={function (e) { setName(e.target.value) }}
                placeholder="Your full name"
                className="h-12 w-full rounded-xl border border-[#cdb8c1] bg-white px-4 text-sm outline-none focus:border-[#984667]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#654656]">
                Phone number
              </span>
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={function (e) { setPhone(e.target.value) }}
                placeholder={user ? user.phone : '024 000 0000'}
                className="h-12 w-full rounded-xl border border-[#cdb8c1] bg-white px-4 text-sm outline-none focus:border-[#984667]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#654656]">
                Delivery location
              </span>
              <input
                type="text"
                autoComplete="street-address"
                value={address}
                onChange={function (e) { setAddress(e.target.value) }}
                placeholder="e.g. Ayeduase, near the market"
                className="h-12 w-full rounded-xl border border-[#cdb8c1] bg-white px-4 text-sm outline-none focus:border-[#984667]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#654656]">
                Delivery notes <span className="font-normal normal-case">(optional)</span>
              </span>
              <textarea
                value={notes}
                onChange={function (e) { setNotes(e.target.value) }}
                placeholder="Landmark, preferred contact, or other details"
                className="h-20 w-full rounded-xl border border-[#cdb8c1] bg-white p-4 text-sm outline-none focus:border-[#984667]"
              />
            </label>
          </div>
        )}

        <div className="mt-6 border-t border-[#e7ccd7] pt-5">
          <div className="flex justify-between font-serif text-xl text-[#1d171a]">
            <span>Total</span>
            <span>GHC {total.toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={function () { checkout() }}
            disabled={!items.length || busy}
            className="mt-5 min-h-13 w-full rounded-full bg-[#984667] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white disabled:opacity-40"
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
