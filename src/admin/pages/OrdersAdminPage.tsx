import { useCallback } from 'react'
import { api } from '../../lib/api'
import { Notice, PageHeader, Panel } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

const statusStyle: Record<string, string> = {
  pending_payment: 'bg-[#fbe7d0] text-[#8a5a1f]',
  paid: 'bg-[#dcefe3] text-[#2f7d55]',
  preparing: 'bg-[#e0ecfb] text-[#2f5d8a]',
  out_for_delivery: 'bg-[#f0e0fb] text-[#6a2f8a]',
  fulfilled: 'bg-[#e4e1f0] text-[#5a4e8a]',
  cancelled: 'bg-[#f3ecee] text-[#8f7480]',
}

const statusLabel: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Order received',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  fulfilled: 'Delivered',
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
                  <p className="font-serif text-xl text-[#3e2530]">{order.user.name}</p>
                  <p className="mt-1 text-xs text-[#806b74]">
                    {order.user.phone} - Order {order.id.slice(0, 8)}
                  </p>
                  <p className="mt-3 text-sm">
                    {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                  </p>
                  <p className="mt-3 font-semibold text-[#a52261]">
                    GHC {Number(order.totalAmount).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] ${style}`}
                  >
                    {label}
                  </span>
                  <span className="rounded-full bg-[#f0e0fb] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6a2f8a]">
                    {order.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}
                  </span>
                </div>
              </div>

              {order.fulfillmentType === 'pickup' ? (
                <div className="mt-4 rounded-2xl bg-[#fff7fa] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#956f80]">
                    Pickup, at the salon
                  </p>
                  <p className="mt-1.5 text-sm text-[#3e2530]">{order.deliveryName}</p>
                </div>
              ) : (
                order.deliveryName && (
                  <div className="mt-4 rounded-2xl bg-[#fff7fa] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#956f80]">
                      Deliver to
                    </p>
                    <p className="mt-1.5 text-sm text-[#3e2530]">{order.deliveryName}</p>
                    <p className="text-sm text-[#745f68]">{order.deliveryPhone}</p>
                    <p className="text-sm text-[#745f68]">{order.deliveryAddress}</p>
                    {order.deliveryNotes && (
                      <p className="mt-2 text-xs italic text-[#8c747e]">{order.deliveryNotes}</p>
                    )}
                  </div>
                )
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
                    onClick={() => change(order.id, 'preparing')}
                    className="rounded-full bg-[#dc2d83] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white"
                  >
                    Start preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => change(order.id, 'out_for_delivery')}
                    className="rounded-full bg-[#dc2d83] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white"
                  >
                    Mark out for delivery
                  </button>
                )}
                {order.status === 'out_for_delivery' && (
                  <button
                    onClick={() => change(order.id, 'fulfilled')}
                    className="rounded-full bg-[#dc2d83] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white"
                  >
                    Mark delivered
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