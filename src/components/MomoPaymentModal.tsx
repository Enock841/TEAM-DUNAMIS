import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ImageUploadField } from '../admin/components/ImageUploadField'

type MomoPaymentModalProps = {
  type: 'booking' | 'order' | 'gift_card'
  refId: string
  token?: string
  portion?: 'half' | 'full'
  onClose: (submitted: boolean) => void
}

type Quote = {
  amount: number
  momoNetwork: string
  momoNumber: string
  momoAccountName: string
}

export function MomoPaymentModal({ type, refId, token, portion, onClose }: MomoPaymentModalProps) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payerName, setPayerName] = useState('')
  const [claimedAmount, setClaimedAmount] = useState('')
  const [proofImageUrl, setProofImageUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    let current = true
    api
      .manualPaymentQuote(token, { type, refId, portion })
      .then((result) => {
        if (!current) return
        setQuote(result)
        setClaimedAmount(String(result.amount))
      })
      .catch((reason) => {
        if (current) setError(reason instanceof Error ? reason.message : 'Unable to load payment details.')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [token, type, refId, portion])

  async function submit() {
    setError('')
    if (!agreed) {
      setError('Please tick the box to agree to the terms before you continue.')
      return
    }
    if (payerName.trim().length < 2) {
      setError('Please type the name on your Mobile Money account.')
      return
    }
    const amountNumber = Number(claimedAmount)
    if (!amountNumber || amountNumber <= 0) {
      setError('Please type the amount you sent.')
      return
    }
    if (!proofImageUrl) {
      setError('Please upload a screenshot of your payment.')
      return
    }
    setBusy(true)
    try {
      await api.submitManualPayment(token, {
        type,
        refId,
        portion,
        payerName: payerName.trim(),
        claimedAmount: amountNumber,
        proofImageUrl,
      })
      setDone(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send your payment details.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#24131b]/60 p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-[#fffaf8] p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl text-[#3e2530]">Pay with Mobile Money</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onClose(done)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5e1e9] text-xl"
          >
            x
          </button>
        </div>

        {loading && <p className="mt-6 text-sm text-[#745f68]">Loading payment details...</p>}

        {!loading && !quote && (
          <p className="mt-6 rounded-xl bg-[#f7e4ec] px-4 py-3 text-sm text-[#74485a]">{error || 'Mobile Money is not available right now.'}</p>
        )}

        {quote && !done && (
          <>
            <div className="mt-5 rounded-2xl border border-[#e6c5d3] bg-[#f7e4ec] p-4 text-sm text-[#3e2530]">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#956f80]">Step 1: send the money</p>
              <p className="mt-2">
                Send <strong>GHC {quote.amount.toLocaleString()}</strong> by {quote.momoNetwork || 'Mobile Money'} to:
              </p>
              <p className="mt-2 text-2xl font-bold tracking-wide text-[#b32269]">{quote.momoNumber}</p>
              {quote.momoAccountName && <p className="mt-1">Name: <strong>{quote.momoAccountName}</strong></p>}
            </div>

            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-bold">Check the name before you send</p>
              <p className="mt-1">
                When you type in the number, your phone will show the name on the account
                {quote.momoAccountName ? ` (it should say ${quote.momoAccountName})` : ''}. If the name is different, do not complete the transaction.
              </p>
              <label className="mt-3 flex items-start gap-3 text-xs leading-5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#dc2d83]"
                />
                <span>
                  I agree to the terms: I will only send money if the name matches. If I send money to a wrong number or name, or leave out any step, the store is not responsible for any money lost.
                </span>
              </label>
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#956f80]">Step 2: tell us you sent it</p>
            <div className="mt-3 grid gap-3">
              <input
                value={payerName}
                onChange={(event) => setPayerName(event.target.value)}
                placeholder="Name on your Mobile Money account"
                className="h-12 rounded-xl border border-[#dfbdcb] bg-white px-4 text-sm outline-none focus:border-[#dc2d83]"
              />
              <input
                value={claimedAmount}
                onChange={(event) => setClaimedAmount(event.target.value)}
                inputMode="decimal"
                placeholder="Amount you sent (GHC)"
                className="h-12 rounded-xl border border-[#dfbdcb] bg-white px-4 text-sm outline-none focus:border-[#dc2d83]"
              />
              <ImageUploadField label="Screenshot of your payment" value={proofImageUrl} onChange={setProofImageUrl} />
            </div>

            {error && <p className="mt-4 rounded-xl bg-[#f7e4ec] px-4 py-3 text-sm text-[#74485a]" role="status">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={busy || !agreed}
              className="mt-5 min-h-12 w-full rounded-full bg-[#d92c83] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white disabled:opacity-50"
            >
              {busy ? 'Sending...' : 'I have sent the money'}
            </button>
            <p className="mt-3 text-xs leading-5 text-[#8f707d]">
              Beryl will check her phone and confirm your payment. You will be marked as paid once she does.
            </p>
          </>
        )}

        {done && (
          <div className="mt-6">
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Thank you! Your payment details were sent. Beryl will confirm shortly.
            </p>
            <button
              type="button"
              onClick={() => onClose(true)}
              className="mt-5 min-h-12 w-full rounded-full bg-[#d92c83] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}