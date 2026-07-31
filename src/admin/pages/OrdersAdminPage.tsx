import { useCallback } from 'react'
import { api } from '../../lib/api'
import { Notice, PageHeader, Panel } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

const statusStyle: Record<string, string> = {
  pending_payment: 'bg-[#fbe7d0] text-[#8a5a1f]',
  paid: 'bg-[#dcefe3] text-[#2f7d55]',
  fulfilled: 'bg-[#e4e1f0] text-[#5a4e8a]',
  cancelled: 'bg-[#f3ecee] text-[#75636b]',
}

const statusLabel: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
}

export function OrdersAdminPage() {
  const loader = useCallback((token: string) => api.adminOrders(token), [])
  const { data = [], loading, error, setError, reload, token } = useAdminResource(loader)

  async function change(id: string, status: string) {
    if (!token) return
    try {
      await api.updateOrderStatus(token, id, status)
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update order.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Orders"
        title="Customer orders"
        description="Review purchases, update their status and track fulfilment."
      />
      <div className="mt-8 space-y-4">
        {loading && <Notice>Loading orders...</Notice>}
        {error && <Notice error>{error}</Notice>}

        {data?.map((order) => {
          const style = statusStyle[order.status] ?? statusStyle.pending_payment
          const label = statusLabel[order.status] ?? order.status

          return (
            <Panel key={order.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-xl text-[#1d171a]">{order.user.name}</p>
                  <p className="mt-1 text-xs text-[#6b5a62]">
                    {order.user.phone} - Order {order.id.slice(0, 8)}
                  </p>
                  <p className="mt-3 text-sm">
                    {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                  </p>
                  <p className="mt-3 font-semibold text-[#984667]">
                    GHC {Number(order.totalAmount).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] ${style}`}
                >
                  {label}
                </span>
              </div>

              {order.deliveryName && (
                <div className="mt-4 rounded-2xl bg-[#fff9fb] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#956f80]">
                    Deliver to
                  </p>
                  <p className="mt-1.5 text-sm text-[#1d171a]">{order.deliveryName}</p>
                  <p className="text-sm text-[#5f5157]">{order.deliveryPhone}</p>
                  <p className="text-sm text-[#5f5157]">{order.deliveryAddress}</p>
                  {order.deliveryNotes && (
                    <p className="mt-2 text-xs italic text-[#8c747e]">{order.deliveryNotes}</p>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2 border-t border-[#f0dfe6] pt-5">
                {order.status === 'pending_payment' && (
                  <button
                    onClick={() => change(order.id, 'paid')}
                    className="rounded-full border border-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-emerald-700"
                  >
                    Mark as paid
                  </button>
                )}
                {order.status === 'paid' && (
                  <button
                    onClick={() => change(order.id, 'fulfilled')}
                    className="rounded-full bg-[#984667] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white"
                  >
                    Mark fulfilled
                  </button>
                )}
                {(order.status === 'pending_payment' || order.status === 'paid') && (
                  <button
                    onClick={() => change(order.id, 'cancelled')}
                    className="rounded-full border border-red-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-red-600"
                  >
                    Cancel order
                  </button>
                )}
              </div>
            </Panel>
          )
        })}
      </div>
    </>
  )
}