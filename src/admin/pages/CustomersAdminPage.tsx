import { useCallback, useState } from 'react'
import { api, type AdminCustomer } from '../../lib/api'
import { Notice, PageHeader, Panel } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

type Details = Awaited<ReturnType<typeof api.adminCustomer>>

export function CustomersAdminPage() {
  const loader = useCallback((token: string) => api.adminCustomers(token), [])
  const { data = [], loading, error, token } = useAdminResource(loader)
  const [selected, setSelected] = useState<Details | null>(null)
  const [detailError, setDetailError] = useState('')

  async function open(customer: AdminCustomer) {
    if (!token) return
    try { setSelected(await api.adminCustomer(token, customer.id)); setDetailError('') }
    catch (reason) { setDetailError(reason instanceof Error ? reason.message : 'Unable to load customer.') }
  }

  return (
    <>
      <PageHeader eyebrow="Customers" title="Customer directory" description="View contact details, booking history and purchase activity." />
      {loading && <div className="mt-8"><Notice>Loading customers…</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      {detailError && <div className="mt-8"><Notice error>{detailError}</Notice></div>}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase text-[#75636b]"><tr><th className="pb-3">Customer</th><th>Bookings</th><th>Orders</th><th>Spent</th><th></th></tr></thead>
            <tbody>{data?.map((customer) => <tr key={customer.id} className="border-t border-[#e6d9df]"><td className="py-4"><strong>{customer.name}</strong><span className="block text-xs text-[#6b5a62]">{customer.phone}</span></td><td>{customer.bookingCount}</td><td>{customer.orderCount}</td><td>GH₵{Number(customer.totalSpent).toLocaleString()}</td><td><button onClick={() => open(customer)} className="font-bold text-[#984667]">View</button></td></tr>)}</tbody>
          </table>
        </Panel>
        <Panel>
          {selected ? (
            <>
              <h2 className="font-serif text-2xl text-[#1d171a]">{selected.name}</h2>
              <p className="mt-1 text-sm">{selected.phone}</p>
              <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-[#984667]">Booking history</h3>
              <div className="mt-3 space-y-2">{selected.bookings.map((item) => <p key={item.id} className="rounded-lg bg-[#f7e8ee] p-3 text-sm">{item.serviceName} · {String(item.date).slice(0,10)} · {item.status}</p>)}</div>
              <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-[#984667]">Purchase history</h3>
              <div className="mt-3 space-y-2">{selected.orders.map((item) => <p key={item.id} className="rounded-lg bg-[#f7e8ee] p-3 text-sm">GH₵{Number(item.totalAmount).toLocaleString()} · {item.status}</p>)}</div>
            </>
          ) : <p className="text-sm text-[#6b5a62]">Select a customer to view their history.</p>}
        </Panel>
      </div>
    </>
  )
}
